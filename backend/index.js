const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const socketIo = require('socket.io');
var uniqid = require('uniqid');
const fs = require('fs');
const path = require('path');
const GameService = require('./services/game.service');
const BotService = require('./services/bot.service');
const authRoutes = require('./routes/auth.routes');
const db = require('./db');

const getUserByPseudoStmt = db.prepare('SELECT id, pseudo, avatar_key FROM users WHERE pseudo = ?');

// Chemin pour sauvegarder les parties vs bot
const SAVED_GAMES_DIR = path.join(__dirname, 'data');
const SAVED_GAMES_FILE = path.join(SAVED_GAMES_DIR, 'saved_games.json');

// Créer le dossier data s'il n'existe pas
if (!fs.existsSync(SAVED_GAMES_DIR)) {
  fs.mkdirSync(SAVED_GAMES_DIR, { recursive: true });
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

let games = [];
let queue = [];

// Helper functions
const updateClientsViewTimers = (game) => {
  game.player1Socket.emit('game.timer', GameService.send.forPlayer.gameTimer('player:1', game.gameState));
  if (!game.isVsBot && game.player2Socket) {
    game.player2Socket.emit('game.timer', GameService.send.forPlayer.gameTimer('player:2', game.gameState));
  }
};

const updateClientsViewDecks = (game) => {
  setTimeout(() => {
    game.player1Socket.emit('game.deck.view-state', GameService.send.forPlayer.deckViewState('player:1', game.gameState));
    if (!game.isVsBot && game.player2Socket) {
      game.player2Socket.emit('game.deck.view-state', GameService.send.forPlayer.deckViewState('player:2', game.gameState));
    }
  }, 200);
};

const updateClientsViewChoices = (game) => {
  setTimeout(() => {
    game.player1Socket.emit('game.choices.view-state', GameService.send.forPlayer.choicesViewState('player:1', game.gameState));
    if (!game.isVsBot && game.player2Socket) {
      game.player2Socket.emit('game.choices.view-state', GameService.send.forPlayer.choicesViewState('player:2', game.gameState));
    }
  }, 200);
};

const updateClientsViewGrid = (game) => {
  setTimeout(() => {
    game.player1Socket.emit('game.grid.view-state', GameService.send.forPlayer.gridViewState('player:1', game.gameState));
    if (!game.isVsBot && game.player2Socket) {
      game.player2Socket.emit('game.grid.view-state', GameService.send.forPlayer.gridViewState('player:2', game.gameState));
    }
  }, 200);
};

const newPlayerInQueue = (socket, pseudo, avatarKey) => {

  removePlayerFromQueue(socket);

  queue.push({ socket, pseudo, avatarKey });

  if (queue.length >= 2) {
    const player1 = queue.shift();
    const player2 = queue.shift();
    createGame(player1.socket, player1.pseudo, player1.avatarKey, player2.socket, player2.pseudo, player2.avatarKey);
  }
  else {
    socket.emit('queue.added', GameService.send.forPlayer.viewQueueState());
  }
};

const createGame = (player1Socket, player1Pseudo, player1AvatarKey, player2Socket, player2Pseudo, player2AvatarKey) => {

  const newGame = GameService.init.gameState();
  newGame['idGame'] = uniqid();
  newGame['player1Socket'] = player1Socket;
  newGame['player1Pseudo'] = player1Pseudo;
  newGame['player1AvatarKey'] = player1AvatarKey;
  newGame['player2Socket'] = player2Socket;
  newGame['player2Pseudo'] = player2Pseudo;
  newGame['player2AvatarKey'] = player2AvatarKey;
  newGame['isVsBot'] = false;

  games.push(newGame);

  const gameIndex = GameService.utils.findGameIndexById(games, newGame.idGame);

  games[gameIndex].player1Socket.emit('game.start', GameService.send.forPlayer.viewGameState('player:1', games[gameIndex]));
  games[gameIndex].player2Socket.emit('game.start', GameService.send.forPlayer.viewGameState('player:2', games[gameIndex]));

  updateClientsViewTimers(games[gameIndex]);
  updateClientsViewDecks(games[gameIndex]);
  updateClientsViewChoices(games[gameIndex]);
  updateClientsViewGrid(games[gameIndex]);

  // Démarrer le timer du jeu
  startOnlineGameTimer(gameIndex);

  // Gérer les déconnexions
  player1Socket.on('disconnect', () => {
    if (games[gameIndex] && games[gameIndex].gameInterval) {
      clearInterval(games[gameIndex].gameInterval);
    }
  });

  player2Socket.on('disconnect', () => {
    if (games[gameIndex] && games[gameIndex].gameInterval) {
      clearInterval(games[gameIndex].gameInterval);
    }
  });
};

// Créer une partie contre le bot en réutilisant la logique existante
const createGameVsBot = (playerSocket, playerPseudo, playerAvatarKey) => {

  const newGame = GameService.init.gameState();
  newGame['idGame'] = uniqid();
  newGame['player1Socket'] = playerSocket;
  newGame['player1Pseudo'] = playerPseudo;
  newGame['player1AvatarKey'] = playerAvatarKey;
  newGame['player2Socket'] = null; // Le bot n'a pas de socket
  newGame['player2Pseudo'] = '🤖 Bot';
  newGame['player2AvatarKey'] = 'avatar_6'; // Avatar du bot
  newGame['isVsBot'] = true; // Marquer cette partie comme vs Bot
  newGame['botDifficulty'] = 'normal'; // Niveau du bot

  games.push(newGame);

  const gameIndex = GameService.utils.findGameIndexById(games, newGame.idGame);

  // Envoyer l'état initial au joueur
  games[gameIndex].player1Socket.emit('game.start', GameService.send.forPlayer.viewGameState('player:1', games[gameIndex]));

  updateClientsViewTimers(games[gameIndex]);
  updateClientsViewDecks(games[gameIndex]);
  updateClientsViewChoices(games[gameIndex]);
  updateClientsViewGrid(games[gameIndex]);

  // Démarrer le timer du jeu
  startGameTimer(gameIndex);

  // Gérer la déconnexion
  playerSocket.on('disconnect', () => {
    if (games[gameIndex] && games[gameIndex].gameInterval) {
      clearInterval(games[gameIndex].gameInterval);
      saveVsBotGames(); // Sauvegarder à la déconnexion
    }
  });
};

// Fonction qui fait jouer le bot pour son tour complet
const playBotTurn = (gameIndex) => {
  if (!games[gameIndex] || games[gameIndex].gameState.currentTurn !== 'player:2') return;

  console.log('[BOT] 🎲 Nouveau tour - déverrouillage de tous les dés');
  
  // IMPORTANT : Déverrouiller tous les dés au début du tour
  games[gameIndex].gameState.deck.dices = games[gameIndex].gameState.deck.dices.map(dice => ({
    ...dice,
    locked: false
  }));
  
  // Réinitialiser le compteur de lancers
  games[gameIndex].gameState.deck.rollsCounter = 1;
  
  updateClientsViewDecks(games[gameIndex]);

  const rollAndDecide = () => {
    if (!games[gameIndex] || games[gameIndex].gameState.currentTurn !== 'player:2') return;
    
    const rollsCounter = games[gameIndex].gameState.deck.rollsCounter;
    const rollsMax = games[gameIndex].gameState.deck.rollsMaximum;

    // Si le bot peut encore lancer les dés (rollsCounter va de 1 à 3 inclus)
    if (rollsCounter <= rollsMax) {
      
      console.log(`[BOT] Lancer ${rollsCounter}/${rollsMax}`);
      
      // Lancer les dés
      games[gameIndex].gameState.deck.dices = GameService.dices.roll(games[gameIndex].gameState.deck.dices);
      games[gameIndex].gameState.deck.rollsCounter++;

      // Calculer les combinaisons disponibles
      const dices = games[gameIndex].gameState.deck.dices;
      const currentRoll = games[gameIndex].gameState.deck.rollsCounter;
      const isDefi = false;
      const isSec = currentRoll === 2;
      const combinations = GameService.choices.findCombinations(dices, isDefi, isSec, games[gameIndex].gameState.grid);
      games[gameIndex].gameState.choices.availableChoices = combinations;

      // Ajuster le timer selon les combinaisons disponibles
      const usableChoices = combinations.filter(c => !c.disabled);
      const hasUsableChoice = usableChoices.length > 0;
      
      // Si c'est le dernier lancer et qu'il n'y a pas de combo disponible, timer à 4s
      if (currentRoll > rollsMax && !hasUsableChoice) {
        games[gameIndex].gameState.timer = 4;
      } else {
        games[gameIndex].gameState.timer = GameService.timer.getTurnDuration();
      }

      // Mettre à jour l'affichage pour le joueur
      games[gameIndex].player1Socket.emit('game.timer', GameService.send.forPlayer.gameTimer('player:1', games[gameIndex].gameState));
      updateClientsViewDecks(games[gameIndex]);
      updateClientsViewChoices(games[gameIndex]);

      // Attendre 2 secondes pour que le joueur voit les dés
      setTimeout(() => {
        if (!games[gameIndex] || games[gameIndex].gameState.currentTurn !== 'player:2') return;

        const usableChoices = combinations.filter(c => !c.disabled);
        
        // Si c'est le dernier lancer (après le 3ème lancer, currentRoll sera à 4)
        if (currentRoll > rollsMax) {
          console.log('[BOT] Dernier lancer détecté');
          
          // Si le bot a au moins une combinaison disponible, verrouiller tous les dés et choisir
          if (usableChoices.length > 0) {
            console.log('[BOT] Verrouillage de tous les dés et choix de combo');
            botLockAllDicesOneByOne(gameIndex, () => {
              setTimeout(() => botChooseCombo(gameIndex), 1000);
            });
          } else {
            console.log('[BOT] Aucune combinaison disponible - fin du tour');
            // Le timer a déjà été réduit à 4s plus haut
            // Le tour se terminera automatiquement par timeout
          }
          return;
        }

        // Vérifier si le bot a une excellente combo et décide de s'arrêter
        const grid = games[gameIndex].gameState.grid;
        const strategy = BotService.determineStrategy(grid, 'player:2', 'player:1');
        
        // Détecter les types de combos
        const hasYam = usableChoices.some(c => c.id === 'yam' || c.id.startsWith('yam'));
        const hasCarre = usableChoices.some(c => c.id === 'carre' || c.id.startsWith('carre'));
        const hasSuite = usableChoices.some(c => c.id === 'suite' || c.id.startsWith('suite'));
        const hasFull = usableChoices.some(c => c.id === 'full' || c.id.startsWith('full'));
        
        // Évaluer si la combo a une importance stratégique critique
        const choicesWithScores = usableChoices.map(choice => {
          const possibleCells = BotService.decision.findCellsForChoice(grid, choice.id, 'player:2', 'player:1', strategy);
          const bestScore = possibleCells.length > 0 ? Math.max(...possibleCells.map(c => c.score)) : 0;
          return { choice, bestScore };
        });
        const hasCriticalMove = choicesWithScores.some(c => c.bestScore > 4000); // Coup gagnant ou blocage critique
        
        let shouldStop = false;
        
        // YAM : Toujours s'arrêter (combo ultime)
        if (hasYam) {
          shouldStop = true;
          console.log('[BOT] 🏆 YAM obtenu - arrêt immédiat');
        }
        // CARRÉ : S'arrêter SEULEMENT si c'est le 3ème lancer OU si c'est un coup critique
        else if (hasCarre) {
          if (currentRoll >= rollsMax) {
            shouldStop = true;
            console.log('[BOT] CARRÉ au dernier lancer - arrêt');
          } else if (hasCriticalMove) {
            shouldStop = true;
            console.log('[BOT] CARRÉ avec coup critique - arrêt stratégique');
          } else {
            shouldStop = false;
            console.log('[BOT] CARRÉ mais continue pour tenter le YAM');
          }
        }
        // SUITE ou FULL : S'arrêter si dernier lancer OU coup critique OU probabilité
        else if (hasSuite || hasFull) {
          if (currentRoll >= rollsMax) {
            shouldStop = true;
            console.log('[BOT] SUITE/FULL au dernier lancer - arrêt');
          } else if (hasCriticalMove) {
            shouldStop = true;
            console.log('[BOT] SUITE/FULL avec coup critique - arrêt stratégique');
          } else {
            shouldStop = Math.random() < 0.3; // 30% de chance de s'arrêter
            console.log('[BOT] SUITE/FULL -', shouldStop ? 'arrêt' : 'continue pour améliorer');
          }
        }
        
        if (shouldStop) {
          console.log('[BOT] ✋ Arrêt et choix de la combo');
          // Ne pas verrouiller tous les dés, juste choisir la combo
          setTimeout(() => botChooseCombo(gameIndex), 1000);
        } else {
          console.log('[BOT] ➡️ Verrouillage stratégique et continuation');
          // Décider quels dés garder pour le prochain lancer
          const dicesToKeep = BotService.decideDicesToLock(dices, currentRoll, combinations, grid, 'player:2', 'player:1');
          console.log('[BOT] Dés à garder:', dicesToKeep.map(d => `${d.id}(${d.value})`));
          
          // Afficher visuellement les changements un par un (verrouillage/déverrouillage)
          botUpdateDiceLocks(gameIndex, dicesToKeep, () => {
            // Attendre puis relancer
            setTimeout(() => rollAndDecide(), 1500);
          });
        }
      }, 2000); // Délai de 2 secondes après chaque lancer
    }
  };

  // Commencer par lancer les dés après 1 seconde
  setTimeout(() => rollAndDecide(), 1000);
};

// Fonction pour mettre à jour les verrouillages (verrouiller et déverrouiller)
const botUpdateDiceLocks = (gameIndex, dicesToKeep, callback) => {
  if (!games[gameIndex]) {
    if (callback) callback();
    return;
  }
  
  const allDices = games[gameIndex].gameState.deck.dices;
  
  // Créer un Set des IDs à garder (convertir en string pour éviter les problèmes de type)
  const idsToKeep = new Set(dicesToKeep.map(d => String(d.id)));
  
  console.log('[BOT] IDs à garder:', Array.from(idsToKeep));
  console.log('[BOT] État actuel des dés:', allDices.map(d => `${d.id}:${d.locked?'🔒':'🔓'}`));
  
  // Identifier les dés à déverrouiller et à verrouiller
  const dicesToUnlock = allDices.filter(d => d.locked && !idsToKeep.has(String(d.id)));
  const dicesToLock = allDices.filter(d => !d.locked && idsToKeep.has(String(d.id)));
  
  console.log('[BOT] 🔓 À déverrouiller:', dicesToUnlock.map(d => `${d.id}(${d.value})`));
  console.log('[BOT] 🔒 À verrouiller:', dicesToLock.map(d => `${d.id}(${d.value})`));
  
  // Si aucun changement, attendre quand même un peu
  if (dicesToUnlock.length === 0 && dicesToLock.length === 0) {
    console.log('[BOT] Aucun changement de verrouillage nécessaire');
    setTimeout(() => {
      if (callback) callback();
    }, 800);
    return;
  }
  
  let delay = 0;
  
  // D'abord déverrouiller les dés qu'on ne veut plus
  dicesToUnlock.forEach((dice) => {
    setTimeout(() => {
      if (games[gameIndex]) {
        const diceIndex = games[gameIndex].gameState.deck.dices.findIndex(d => String(d.id) === String(dice.id));
        if (diceIndex !== -1) {
          games[gameIndex].gameState.deck.dices[diceIndex].locked = false;
          updateClientsViewDecks(games[gameIndex]);
          console.log(`[BOT] 🔓 Déverrouillé dé ${dice.id} (valeur: ${dice.value})`);
        }
      }
    }, delay);
    delay += 150;
  });
  
  // Ensuite verrouiller les dés qu'on veut garder
  dicesToLock.forEach((dice) => {
    setTimeout(() => {
      if (games[gameIndex]) {
        const diceIndex = games[gameIndex].gameState.deck.dices.findIndex(d => String(d.id) === String(dice.id));
        if (diceIndex !== -1) {
          games[gameIndex].gameState.deck.dices[diceIndex].locked = true;
          updateClientsViewDecks(games[gameIndex]);
          console.log(`[BOT] 🔒 Verrouillé dé ${dice.id} (valeur: ${dice.value})`);
        }
      }
    }, delay);
    delay += 150;
  });
  
  // Appeler le callback après toutes les animations (minimum 800ms)
  const finalDelay = Math.max(delay + 100, 800);
  setTimeout(() => {
    if (callback) callback();
  }, finalDelay);
};

// Fonction pour verrouiller tous les dés un par un
const botLockAllDicesOneByOne = (gameIndex, callback) => {
  if (!games[gameIndex]) return;
  
  const dices = games[gameIndex].gameState.deck.dices;
  let delay = 0;
  
  dices.forEach((dice, index) => {
    if (!dice.locked) {
      setTimeout(() => {
        if (games[gameIndex]) {
          games[gameIndex].gameState.deck.dices[index].locked = true;
          updateClientsViewDecks(games[gameIndex]);
        }
      }, delay);
      delay += 150; // 150ms entre chaque verrouillage
    }
  });
  
  // Appeler le callback après tous les verrouillages
  setTimeout(() => {
    if (callback) callback();
  }, delay + 100);
};

// Fonction pour verrouiller certains dés un par un
const botLockDicesOneByOne = (gameIndex, dicesToLock, callback) => {
  if (!games[gameIndex]) {
    if (callback) callback();
    return;
  }
  
  // Si aucun dé à verrouiller, attendre quand même un peu avant de continuer
  if (dicesToLock.length === 0) {
    setTimeout(() => {
      if (callback) callback();
    }, 800);
    return;
  }
  
  let delay = 0;
  let hasLockedAny = false;
  
  dicesToLock.forEach((diceToLock) => {
    setTimeout(() => {
      if (games[gameIndex]) {
        const diceIndex = games[gameIndex].gameState.deck.dices.findIndex(d => d.id === diceToLock.id);
        if (diceIndex !== -1 && !games[gameIndex].gameState.deck.dices[diceIndex].locked) {
          games[gameIndex].gameState.deck.dices[diceIndex].locked = true;
          updateClientsViewDecks(games[gameIndex]);
          console.log(`[BOT] Verrouillé dé ${diceToLock.id} (valeur: ${diceToLock.value})`);
          hasLockedAny = true;
        } else if (diceIndex !== -1) {
          console.log(`[BOT] Dé ${diceToLock.id} (valeur: ${diceToLock.value}) déjà verrouillé`);
        }
      }
    }, delay);
    delay += 200; // 200ms entre chaque verrouillage
  });
  
  // Appeler le callback après tous les verrouillages (minimum 800ms même si tous déjà verrouillés)
  const finalDelay = Math.max(delay + 100, 800);
  setTimeout(() => {
    if (callback) callback();
  }, finalDelay);
};

// Le bot choisit une combinaison
const botChooseCombo = (gameIndex) => {
  if (!games[gameIndex] || games[gameIndex].gameState.currentTurn !== 'player:2') return;

  const availableChoices = games[gameIndex].gameState.choices.availableChoices;
  const grid = games[gameIndex].gameState.grid;
  const botKey = 'player:2';
  const playerKey = 'player:1';

  // Déterminer la stratégie du bot
  const strategy = BotService.determineStrategy(grid, botKey, playerKey);

  // Choisir la meilleure combinaison
  const chosenCombo = BotService.chooseCombo(availableChoices, grid, botKey, playerKey, strategy);

  if (!chosenCombo) {
    // Pas de combo disponible, passer au tour suivant
    return;
  }

  // Marquer le choix comme sélectionné
  games[gameIndex].gameState.choices.idSelectedChoice = chosenCombo.id;
  
  // Mettre à jour la grille pour montrer les cases sélectionnables
  games[gameIndex].gameState.grid = GameService.grid.updateGridAfterSelectingChoice(
    chosenCombo.id,
    games[gameIndex].gameState.grid
  );

  updateClientsViewChoices(games[gameIndex]);
  updateClientsViewGrid(games[gameIndex]);

  // Choisir la meilleure case après un délai
  setTimeout(() => botChooseCell(gameIndex, chosenCombo.id, strategy), 1200);
};

// Le bot choisit où placer son jeton
const botChooseCell = (gameIndex, choiceId, strategy) => {
  if (!games[gameIndex] || games[gameIndex].gameState.currentTurn !== 'player:2') return;

  const grid = games[gameIndex].gameState.grid;
  const botKey = 'player:2';
  const playerKey = 'player:1';

  // Trouver la meilleure case
  const bestCell = BotService.decision.chooseBestCell(grid, choiceId, botKey, playerKey, strategy);

  if (!bestCell) return;

  // Placer le jeton
  games[gameIndex].gameState.grid = GameService.grid.selectCell(
    bestCell.id,
    bestCell.row,
    bestCell.col,
    'player:2',
    games[gameIndex].gameState.grid
  );

  // Mettre à jour immédiatement pour montrer le jeton
  updateClientsViewGrid(games[gameIndex]);

  // Vérifier la fin du jeu (même logique que pour les joueurs)
  // La variable grid est déjà définie plus haut
  
  // Vérifier ligne de 5 pour le bot
  const botHasLineOf5 = GameService.grid.findLines(games[gameIndex].gameState.grid, 'player:2', 5).length > 0;
  if (botHasLineOf5) {
    games[gameIndex].player1Socket.emit('game.ended', {
      winner: 'player:2',
      reason: 'line-of-5',
      player1Score: 0,
      player2Score: 0
    });
    
    clearInterval(games[gameIndex].gameInterval);
    const gameIdx = games.findIndex(g => g.idGame === games[gameIndex].idGame);
    if (gameIdx !== -1) games.splice(gameIdx, 1);
    return;
  }

  // Vérifier ligne de 5 pour le joueur
  const playerHasLineOf5 = GameService.grid.findLines(games[gameIndex].gameState.grid, 'player:1', 5).length > 0;
  if (playerHasLineOf5) {
    games[gameIndex].player1Socket.emit('game.ended', {
      winner: 'player:1',
      reason: 'line-of-5',
      player1Score: 0,
      player2Score: 0
    });
    
    clearInterval(games[gameIndex].gameInterval);
    const gameIdx = games.findIndex(g => g.idGame === games[gameIndex].idGame);
    if (gameIdx !== -1) games.splice(gameIdx, 1);
    return;
  }

  // Vérifier si la grille est pleine
  if (GameService.grid.isFull(games[gameIndex].gameState.grid)) {
    const player1Score = GameService.grid.calculateScore(games[gameIndex].gameState.grid, 'player:1');
    const player2Score = GameService.grid.calculateScore(games[gameIndex].gameState.grid, 'player:2');
    
    let winner = 'draw';
    if (player1Score > player2Score) winner = 'player:1';
    else if (player2Score > player1Score) winner = 'player:2';
    
    games[gameIndex].player1Socket.emit('game.ended', {
      winner,
      reason: 'score',
      player1Score,
      player2Score
    });
    
    clearInterval(games[gameIndex].gameInterval);
    const gameIdx = games.findIndex(g => g.idGame === games[gameIndex].idGame);
    if (gameIdx !== -1) games.splice(gameIdx, 1);
    return;
  }

  // Sinon, continuer - changer de tour
  games[gameIndex].gameState.currentTurn = 'player:1';
  games[gameIndex].gameState.timer = GameService.timer.getTurnDuration();
  games[gameIndex].gameState.deck = GameService.init.deck();
  games[gameIndex].gameState.choices = GameService.init.choices();
  games[gameIndex].gameState.grid = GameService.grid.resetcanBeCheckedCells(games[gameIndex].gameState.grid);

  games[gameIndex].player1Socket.emit('game.timer', GameService.send.forPlayer.gameTimer('player:1', games[gameIndex].gameState));
  updateClientsViewDecks(games[gameIndex]);
  updateClientsViewChoices(games[gameIndex]);
  updateClientsViewGrid(games[gameIndex]);
};

const removePlayerFromQueue = (socket) => {
  const index = queue.findIndex(item => item.socket.id === socket.id);
  if (index !== -1) {
    queue.splice(index, 1);
  }
};

// Sauvegarder les parties vs bot dans un fichier JSON
const saveVsBotGames = () => {
  try {
    const botGames = games.filter(game => game.isVsBot).map(game => ({
      idGame: game.idGame,
      player1Pseudo: game.player1Pseudo,
      player1AvatarKey: game.player1AvatarKey,
      player2Pseudo: game.player2Pseudo,
      player2AvatarKey: game.player2AvatarKey,
      gameState: game.gameState,
      isVsBot: game.isVsBot,
      botDifficulty: game.botDifficulty,
      savedAt: new Date().toISOString()
    }));
    
    fs.writeFileSync(SAVED_GAMES_FILE, JSON.stringify(botGames, null, 2));
    console.log(`[SAVE] ${botGames.length} partie(s) vs bot sauvegardée(s)`);
  } catch (error) {
    console.error('[SAVE ERROR]', error);
  }
};

// Charger les parties vs bot sauvegardées
const loadVsBotGames = () => {
  try {
    if (fs.existsSync(SAVED_GAMES_FILE)) {
      const data = fs.readFileSync(SAVED_GAMES_FILE, 'utf8');
      const savedGames = JSON.parse(data);
      console.log(`[LOAD] ${savedGames.length} partie(s) vs bot chargée(s)`);
      return savedGames;
    }
  } catch (error) {
    console.error('[LOAD ERROR]', error);
  }
  return [];
};

// Trouver une partie sauvegardée pour un joueur
const findSavedGameForPlayer = (playerPseudo) => {
  const savedGames = loadVsBotGames();
  return savedGames.find(game => game.player1Pseudo === playerPseudo);
};

// Restaurer une partie vs bot pour un joueur reconnecté
const restoreVsBotGame = (playerSocket, savedGame) => {
  console.log(`[RESTORE] Restauration partie vs bot pour ${savedGame.player1Pseudo}`);
  
  const restoredGame = {
    ...savedGame,
    player1Socket: playerSocket,
    player2Socket: null,
    gameInterval: null
  };
  
  games.push(restoredGame);
  const gameIndex = GameService.utils.findGameIndexById(games, restoredGame.idGame);
  
  // Envoyer l'état restauré au joueur
  games[gameIndex].player1Socket.emit('game.start', GameService.send.forPlayer.viewGameState('player:1', games[gameIndex]));
  
  updateClientsViewTimers(games[gameIndex]);
  updateClientsViewDecks(games[gameIndex]);
  updateClientsViewChoices(games[gameIndex]);
  updateClientsViewGrid(games[gameIndex]);
  
  // Relancer le timer du jeu
  startGameTimer(gameIndex);
  
  // Gérer la déconnexion
  playerSocket.on('disconnect', () => {
    if (games[gameIndex] && games[gameIndex].gameInterval) {
      clearInterval(games[gameIndex].gameInterval);
      saveVsBotGames(); // Sauvegarder à la déconnexion
    }
  });
  
  // Si c'est le tour du bot, le faire jouer
  if (games[gameIndex].gameState.currentTurn === 'player:2') {
    setTimeout(() => {
      playBotTurn(gameIndex);
    }, 1000);
  }
  
  return restoredGame;
};

// Fonction pour démarrer le timer d'une partie vs bot
const startGameTimer = (gameIndex) => {
  const game = games[gameIndex];
  if (!game || !game.isVsBot) return;
  
  const gameInterval = setInterval(() => {
    if (!games[gameIndex]) {
      clearInterval(gameInterval);
      return;
    }

    games[gameIndex].gameState.timer--;

    // Mettre à jour seulement le joueur humain
    if (games[gameIndex].player1Socket) {
      games[gameIndex].player1Socket.emit('game.timer', GameService.send.forPlayer.gameTimer('player:1', games[gameIndex].gameState));
    }

    // Si le timer tombe à zéro
    if (games[gameIndex].gameState.timer === 0) {

      // On change de tour
      games[gameIndex].gameState.currentTurn = games[gameIndex].gameState.currentTurn === 'player:1' ? 'player:2' : 'player:1';

      // Réinitialiser le timer
      games[gameIndex].gameState.timer = GameService.timer.getTurnDuration();

      // Réinitialisation du deck
      games[gameIndex].gameState.deck = GameService.init.deck();

      // Réinitialisation des choix
      games[gameIndex].gameState.choices = GameService.init.choices();

      // Reset des cases sélectionnables
      games[gameIndex].gameState.grid = GameService.grid.resetcanBeCheckedCells(games[gameIndex].gameState.grid);

      // Mettre à jour le joueur
      if (games[gameIndex].player1Socket) {
        games[gameIndex].player1Socket.emit('game.timer', GameService.send.forPlayer.gameTimer('player:1', games[gameIndex].gameState));
      }
      updateClientsViewDecks(games[gameIndex]);
      updateClientsViewChoices(games[gameIndex]);
      updateClientsViewGrid(games[gameIndex]);

      // Si c'est maintenant le tour du bot, le faire jouer automatiquement
      if (games[gameIndex].gameState.currentTurn === 'player:2') {
        setTimeout(() => {
          playBotTurn(gameIndex);
        }, 1000); // Petite pause pour que le joueur voit le changement de tour
      }
      
      // Sauvegarder l'état après chaque tour
      saveVsBotGames();
    }

  }, 1000);

  // Stocker l'intervalle dans l'objet game
  games[gameIndex].gameInterval = gameInterval;
};

// Fonction pour démarrer le timer d'une partie en ligne
const startOnlineGameTimer = (gameIndex) => {
  const game = games[gameIndex];
  if (!game || game.isVsBot) return;
  
  const gameInterval = setInterval(() => {
    if (!games[gameIndex]) {
      clearInterval(gameInterval);
      return;
    }

    games[gameIndex].gameState.timer--;

    updateClientsViewTimers(games[gameIndex]);

    // Si le timer tombe à zéro
    if (games[gameIndex].gameState.timer === 0) {

      // On change de tour en inversant le clé dans 'currentTurn'
      games[gameIndex].gameState.currentTurn = games[gameIndex].gameState.currentTurn === 'player:1' ? 'player:2' : 'player:1';

      // Méthode du service qui renvoie la constante 'TURN_DURATION'
      games[gameIndex].gameState.timer = GameService.timer.getTurnDuration();

      // Réinitialisation du deck
      games[gameIndex].gameState.deck = GameService.init.deck();

      // Réinitialisation des choix
      games[gameIndex].gameState.choices = GameService.init.choices();

      // Reset des cases sélectionnables
      games[gameIndex].gameState.grid = GameService.grid.resetcanBeCheckedCells(games[gameIndex].gameState.grid);

      updateClientsViewTimers(games[gameIndex]);
      updateClientsViewDecks(games[gameIndex]);
      updateClientsViewChoices(games[gameIndex]);
      updateClientsViewGrid(games[gameIndex]);
    }

  }, 1000);

  // Stocker l'intervalle dans l'objet game
  games[gameIndex].gameInterval = gameInterval;
};

// Gérer la reconnexion d'un joueur à une partie en ligne
const reconnectToOnlineGame = (socket, previousSocketId) => {
  const gameIndex = games.findIndex(game => 
    !game.isVsBot && (
      (game.player1Socket && game.player1Socket.id === previousSocketId) ||
      (game.player2Socket && game.player2Socket.id === previousSocketId)
    )
  );
  
  if (gameIndex === -1) {
    console.log('[RECONNECT] Aucune partie trouvée pour ce socket');
    return false;
  }
  
  const game = games[gameIndex];
  
  // Vérifier qu'il y a bien eu une déconnexion
  if (!game.disconnectedPlayer) {
    console.log('[RECONNECT] Pas de déconnexion en cours');
    return false;
  }
  
  const isPlayer1 = game.player1Socket && game.player1Socket.id === previousSocketId;
  console.log(`[RECONNECT] Joueur ${isPlayer1 ? '1' : '2'} reconnecté`);
  
  // Annuler le timer de reconnexion
  if (game.reconnectionTimer) {
    clearTimeout(game.reconnectionTimer);
    game.reconnectionTimer = null;
  }
  
  // Remplacer le socket
  if (isPlayer1) {
    game.player1Socket = socket;
  } else {
    game.player2Socket = socket;
  }
  
  // Réinitialiser l'état de déconnexion
  game.disconnectedPlayer = null;
  game.disconnectionTime = null;
  
  // Envoyer l'état de la partie au joueur reconnecté
  const playerKey = isPlayer1 ? 'player:1' : 'player:2';
  socket.emit('game.start', GameService.send.forPlayer.viewGameState(playerKey, games[gameIndex]));
  socket.emit('game.reconnected', { message: 'Reconnexion réussie !' });
  
  updateClientsViewTimers(games[gameIndex]);
  updateClientsViewDecks(games[gameIndex]);
  updateClientsViewChoices(games[gameIndex]);
  updateClientsViewGrid(games[gameIndex]);
  
  // Notifier l'adversaire
  const opponentSocket = isPlayer1 ? game.player2Socket : game.player1Socket;
  if (opponentSocket) {
    opponentSocket.emit('opponent.reconnected', { message: 'Votre adversaire s\'est reconnecté' });
  }
  
  // Relancer le timer de jeu
  if (!game.gameInterval) {
    startOnlineGameTimer(gameIndex);
  }
  
  // Ajouter les gestionnaires d'événements
  socket.on('disconnect', () => {
    removeGameBySocket(socket);
  });
  
  return true;
};

const findGameBySocket = (socket) => {
  return games.find(game => 
    game.player1Socket.id === socket.id || 
    (game.player2Socket && game.player2Socket.id === socket.id)
  );
};

const removeGameBySocket = (socket) => {
  const gameIndex = games.findIndex(game => 
    game.player1Socket && game.player1Socket.id === socket.id || 
    (game.player2Socket && game.player2Socket.id === socket.id)
  );
  
  if (gameIndex !== -1) {
    const game = games[gameIndex];
    
    // Pour les parties vs Bot : Sauvegarder et supprimer
    if (game.isVsBot) {
      console.log(`[DISCONNECT] Partie vs bot - Sauvegarde pour ${game.player1Pseudo}`);
      
      // Nettoyer l'intervalle du timer
      if (game.gameInterval) {
        clearInterval(game.gameInterval);
      }
      
      // Sauvegarder avant de supprimer de la mémoire
      saveVsBotGames();
      
      // Supprimer de la liste des parties actives
      games.splice(gameIndex, 1);
      return;
    }
    
    // Pour les parties en ligne : Timer de reconnexion 3 minutes
    const isPlayer1 = game.player1Socket && game.player1Socket.id === socket.id;
    const disconnectedSocketId = socket.id;
    
    console.log(`[DISCONNECT] Partie en ligne - Timer 3min pour reconnexion`);
    
    // Marquer le joueur comme déconnecté
    game.disconnectedPlayer = isPlayer1 ? 'player:1' : 'player:2';
    game.disconnectionTime = Date.now();
    
    // Mettre le jeu en pause
    if (game.gameInterval) {
      clearInterval(game.gameInterval);
      game.gameInterval = null;
    }
    
    // Notifier l'adversaire
    const opponentSocket = isPlayer1 ? game.player2Socket : game.player1Socket;
    if (opponentSocket) {
      opponentSocket.emit('opponent.disconnected.waiting', { 
        message: 'Votre adversaire s\'est déconnecté. Attente de reconnexion (3 min)...',
        waitTime: 180 // 3 minutes en secondes
      });
    }
    
    // Timer de 3 minutes
    game.reconnectionTimer = setTimeout(() => {
      console.log(`[TIMEOUT] Pas de reconnexion après 3 min - Victoire par forfait`);
      
      // Le joueur déconnecté perd, l'adversaire gagne
      const winner = game.disconnectedPlayer === 'player:1' ? 'player:2' : 'player:1';
      game.gameState.winner = winner;
      
      // Calculer les scores actuels
      const player1Score = GameService.grid.calculateScore(game.gameState.grid, 'player:1');
      const player2Score = GameService.grid.calculateScore(game.gameState.grid, 'player:2');
      
      // Déterminer le playerKey de l'adversaire qui est resté connecté
      const opponentPlayerKey = isPlayer1 ? 'player:2' : 'player:1';
      
      // Notifier le joueur connecté de sa victoire
      if (opponentSocket) {
        opponentSocket.emit('game.end', {
          winner: winner,
          reason: 'disconnect',
          message: 'Vous avez gagné par forfait !',
          player1Score: player1Score,
          player2Score: player2Score,
          playerKey: opponentPlayerKey
        });
      }
      
      // Nettoyer la partie
      games.splice(gameIndex, 1);
    }, 180000); // 3 minutes = 180000 ms
  }
};

io.on('connection', socket => {

  socket.on('queue.join', (data) => {
    const pseudo = data?.pseudo || 'Anonymous';
    let avatarKey = 'avatar_1';
    
    // Récupérer l'avatarKey depuis la DB si le pseudo existe
    try {
      const user = getUserByPseudoStmt.get(pseudo);
      if (user && user.avatar_key) {
        avatarKey = user.avatar_key;
      }
    } catch (error) {
      console.error('Error fetching user avatar:', error);
    }
    
    newPlayerInQueue(socket, pseudo, avatarKey);
  });

  socket.on('queue.leave', () => {
    removePlayerFromQueue(socket);
    socket.emit('queue.left', { success: true, message: 'You left the queue' });
  });

  socket.on('vsbot.start', (data) => {
    const pseudo = data?.pseudo || 'Anonymous';
    let avatarKey = 'avatar_1';
    
    // Récupérer l'avatarKey depuis la DB si le pseudo existe
    try {
      const user = getUserByPseudoStmt.get(pseudo);
      if (user && user.avatar_key) {
        avatarKey = user.avatar_key;
      }
    } catch (error) {
      console.error('Error fetching user avatar:', error);
    }
    
    // Vérifier s'il existe une partie sauvegardée pour ce joueur
    const savedGame = findSavedGameForPlayer(pseudo);
    
    if (savedGame && data?.resumeGame !== false) {
      console.log(`[RESUME] Partie sauvegardée trouvée pour ${pseudo}`);
      
      // Demander au joueur s'il veut reprendre
      socket.emit('vsbot.resume.available', {
        savedAt: savedGame.savedAt,
        currentTurn: savedGame.gameState.currentTurn
      });
    } else {
      createGameVsBot(socket, pseudo, avatarKey);
    }
  });
  
  socket.on('vsbot.resume', (data) => {
    const pseudo = data?.pseudo || 'Anonymous';
    const savedGame = findSavedGameForPlayer(pseudo);
    
    if (savedGame) {
      restoreVsBotGame(socket, savedGame);
      
      // Supprimer la partie du fichier de sauvegarde
      const savedGames = loadVsBotGames();
      const updatedGames = savedGames.filter(g => g.player1Pseudo !== pseudo);
      fs.writeFileSync(SAVED_GAMES_FILE, JSON.stringify(updatedGames, null, 2));
    } else {
      socket.emit('vsbot.resume.error', { message: 'Aucune partie sauvegardée' });
    }
  });
  
  socket.on('vsbot.new', (data) => {
    const pseudo = data?.pseudo || 'Anonymous';
    let avatarKey = 'avatar_1';
    
    try {
      const user = getUserByPseudoStmt.get(pseudo);
      if (user && user.avatar_key) {
        avatarKey = user.avatar_key;
      }
    } catch (error) {
      console.error('Error fetching user avatar:', error);
    }
    
    // Supprimer toute partie sauvegardée existante
    const savedGames = loadVsBotGames();
    const updatedGames = savedGames.filter(g => g.player1Pseudo !== pseudo);
    fs.writeFileSync(SAVED_GAMES_FILE, JSON.stringify(updatedGames, null, 2));
    
    createGameVsBot(socket, pseudo, avatarKey);
  });
  
  socket.on('game.reconnect', (data) => {
    const previousSocketId = data?.previousSocketId;
    
    if (!previousSocketId) {
      socket.emit('game.reconnect.error', { message: 'Socket ID manquant' });
      return;
    }
    
    const success = reconnectToOnlineGame(socket, previousSocketId);
    
    if (!success) {
      socket.emit('game.reconnect.error', { message: 'Partie introuvable ou délai dépassé' });
    }
  });

  socket.on('get.state', () => {
    const inQueue = queue.some(item => item.socket.id === socket.id);
    if (inQueue) {
      socket.emit('queue.added', GameService.send.forPlayer.viewQueueState());
      return;
    }
    
    const game = findGameBySocket(socket);
    if (game) {
      const playerKey = game.player1Socket.id === socket.id ? 'player:1' : 'player:2';
      const gameIndex = GameService.utils.findGameIndexById(games, game.idGame);
      socket.emit('game.start', GameService.send.forPlayer.viewGameState(playerKey, games[gameIndex]));
      return;
    }
  });

  socket.on('game.refresh-board', () => {
    const gameIndex = GameService.utils.findGameIndexBySocketId(games, socket.id);
    
    if (gameIndex === -1) return;

    updateClientsViewTimers(games[gameIndex]);
    updateClientsViewDecks(games[gameIndex]);
    updateClientsViewChoices(games[gameIndex]);
    updateClientsViewGrid(games[gameIndex]);
  });

  socket.on('game.dices.roll', () => {
    const gameIndex = GameService.utils.findGameIndexBySocketId(games, socket.id);

    if (gameIndex === -1) return;

    if (games[gameIndex].gameState.deck.rollsCounter < games[gameIndex].gameState.deck.rollsMaximum) {
      // Si ce n'est pas le dernier lancé

      // Gestion des dés 
      games[gameIndex].gameState.deck.dices = GameService.dices.roll(games[gameIndex].gameState.deck.dices);
      games[gameIndex].gameState.deck.rollsCounter++;

      // Gestion des combinaisons
      const dices = games[gameIndex].gameState.deck.dices;
      const isDefi = false;
      const isSec = games[gameIndex].gameState.deck.rollsCounter === 2;

      const combinations = GameService.choices.findCombinations(dices, isDefi, isSec, games[gameIndex].gameState.grid);
      games[gameIndex].gameState.choices.availableChoices = combinations;

      // Réinitialiser le timer à 30s (le joueur peut encore roller)
      games[gameIndex].gameState.timer = GameService.timer.getTurnDuration();

      // Gestion des vues
      updateClientsViewTimers(games[gameIndex]);
      updateClientsViewDecks(games[gameIndex]);
      updateClientsViewChoices(games[gameIndex]);

    } else {
      // Si c'est le dernier lancer

      // Gestion des dés 
      games[gameIndex].gameState.deck.dices = GameService.dices.roll(games[gameIndex].gameState.deck.dices);
      games[gameIndex].gameState.deck.rollsCounter++;

      // Gestion des combinaisons
      const dices = games[gameIndex].gameState.deck.dices;
      const isDefi = false;
      const isSec = games[gameIndex].gameState.deck.rollsCounter === 2;

      const combinations = GameService.choices.findCombinations(dices, isDefi, isSec, games[gameIndex].gameState.grid);
      games[gameIndex].gameState.choices.availableChoices = combinations;

      // Si on a au moins une combinaison utilisable (non disabled), on laisse 30s, sinon 4s
      const hasUsableChoice = combinations.some(combo => !combo.disabled);
      if (hasUsableChoice) {
        games[gameIndex].gameState.timer = GameService.timer.getTurnDuration();
      } else {
        games[gameIndex].gameState.timer = 4;
      }

      // Envoyer d'abord l'état avec les dés non verrouillés pour l'animation
      updateClientsViewTimers(games[gameIndex]);
      updateClientsViewDecks(games[gameIndex]);
      updateClientsViewChoices(games[gameIndex]);

      // Verrouiller tous les dés après 2.3 secondes (temps de l'animation)
      setTimeout(() => {
        if (games[gameIndex]) {
          games[gameIndex].gameState.deck.dices = GameService.dices.lockEveryDice(games[gameIndex].gameState.deck.dices);
          updateClientsViewDecks(games[gameIndex]);
        }
      }, 2300);
    }
  });

  socket.on('game.dices.lock', (idDice) => {
    const gameIndex = GameService.utils.findGameIndexBySocketId(games, socket.id);

    if (gameIndex === -1) return;

    const indexDice = GameService.utils.findDiceIndexByDiceId(games[gameIndex].gameState.deck.dices, idDice);

    if (indexDice === -1) return;

    // Reverse flag 'locked'
    games[gameIndex].gameState.deck.dices[indexDice].locked = !games[gameIndex].gameState.deck.dices[indexDice].locked;

    // Réinitialiser le timer à 30s
    games[gameIndex].gameState.timer = GameService.timer.getTurnDuration();

    updateClientsViewTimers(games[gameIndex]);
    updateClientsViewDecks(games[gameIndex]);
  });

  socket.on('game.choices.selected', (data) => {
    // Gestion des choix
    const gameIndex = GameService.utils.findGameIndexBySocketId(games, socket.id);

    if (gameIndex === -1) return;

    games[gameIndex].gameState.choices.idSelectedChoice = data.choiceId;

    // Mise à jour de la grille
    games[gameIndex].gameState.grid = GameService.grid.resetcanBeCheckedCells(games[gameIndex].gameState.grid);
    games[gameIndex].gameState.grid = GameService.grid.updateGridAfterSelectingChoice(data.choiceId, games[gameIndex].gameState.grid);

    // Ne pas toucher au timer - le joueur garde le temps qu'il lui reste pour placer sur la grille

    updateClientsViewChoices(games[gameIndex]);
    updateClientsViewGrid(games[gameIndex]);
  });

  socket.on('game.grid.selected', (data) => {
    const gameIndex = GameService.utils.findGameIndexBySocketId(games, socket.id);

    if (gameIndex === -1) return;

    // La sélection d'une cellule signifie la fin du tour
    // On reset l'état des cases qui étaient précédemment clicables
    games[gameIndex].gameState.grid = GameService.grid.resetcanBeCheckedCells(games[gameIndex].gameState.grid);
    games[gameIndex].gameState.grid = GameService.grid.selectCell(data.cellId, data.rowIndex, data.cellIndex, games[gameIndex].gameState.currentTurn, games[gameIndex].gameState.grid);

    // IMPORTANT : Mettre à jour la grille côté client IMMÉDIATEMENT
    // pour que le dernier jeton soit visible avant la fin de partie
    updateClientsViewGrid(games[gameIndex]);

    // Étape 1 : Vérifier si quelqu'un a une ligne de 5 (victoire immédiate)
    const player1LinesOf5 = GameService.grid.findLines(games[gameIndex].gameState.grid, 'player:1', 5);
    const player2LinesOf5 = GameService.grid.findLines(games[gameIndex].gameState.grid, 'player:2', 5);

    if (player1LinesOf5.length > 0) {
      console.log('[DEBUG] VICTOIRE PLAYER 1 - Ligne de 5 !');
      if (games[gameIndex].gameInterval) {
        clearInterval(games[gameIndex].gameInterval);
      }

      games[gameIndex].player1Socket.emit('game.ended', {
        winner: 'player:1',
        reason: 'line-of-5',
        player1Score: 0,
        player2Score: 0,
        playerKey: 'player:1'
      });

      if (!games[gameIndex].isVsBot && games[gameIndex].player2Socket) {
        games[gameIndex].player2Socket.emit('game.ended', {
          winner: 'player:1',
          reason: 'line-of-5',
          player1Score: 0,
          player2Score: 0,
          playerKey: 'player:2'
        });
      }

      // Supprimer la partie terminée
      games.splice(gameIndex, 1);
      return;
    }

    if (player2LinesOf5.length > 0) {
      console.log('[DEBUG] VICTOIRE PLAYER 2 - Ligne de 5 !');
      if (games[gameIndex].gameInterval) {
        clearInterval(games[gameIndex].gameInterval);
      }

      games[gameIndex].player1Socket.emit('game.ended', {
        winner: 'player:2',
        reason: 'line-of-5',
        player1Score: 0,
        player2Score: 0,
        playerKey: 'player:1'
      });

      if (!games[gameIndex].isVsBot && games[gameIndex].player2Socket) {
        games[gameIndex].player2Socket.emit('game.ended', {
          winner: 'player:2',
          reason: 'line-of-5',
          player1Score: 0,
          player2Score: 0,
          playerKey: 'player:2'
        });
      }

      // Supprimer la partie terminée
      games.splice(gameIndex, 1);
      return;
    }

    // Étape 2 : Vérifier si la grille est pleine
    if (GameService.grid.isFull(games[gameIndex].gameState.grid)) {
      console.log('[DEBUG] GRILLE PLEINE - Calcul des scores...');
      
      // Calculer les scores uniquement maintenant
      games[gameIndex].gameState.player1Score = GameService.grid.calculateScore(games[gameIndex].gameState.grid, 'player:1');
      games[gameIndex].gameState.player2Score = GameService.grid.calculateScore(games[gameIndex].gameState.grid, 'player:2');
      
      console.log('[DEBUG] Scores finaux:', {
        player1Score: games[gameIndex].gameState.player1Score,
        player2Score: games[gameIndex].gameState.player2Score
      });

      if (games[gameIndex].gameInterval) {
        clearInterval(games[gameIndex].gameInterval);
      }

      const winner = games[gameIndex].gameState.player1Score > games[gameIndex].gameState.player2Score 
        ? 'player:1' 
        : games[gameIndex].gameState.player2Score > games[gameIndex].gameState.player1Score 
          ? 'player:2' 
          : 'draw';

      games[gameIndex].player1Socket.emit('game.ended', {
        winner: winner,
        reason: 'score',
        player1Score: games[gameIndex].gameState.player1Score,
        player2Score: games[gameIndex].gameState.player2Score,
        playerKey: 'player:1'
      });

      if (!games[gameIndex].isVsBot && games[gameIndex].player2Socket) {
        games[gameIndex].player2Socket.emit('game.ended', {
          winner: winner,
          reason: 'score',
          player1Score: games[gameIndex].gameState.player1Score,
          player2Score: games[gameIndex].gameState.player2Score,
          playerKey: 'player:2'
        });
      }

      // Supprimer la partie terminée
      games.splice(gameIndex, 1);
      return;
    }

    // Sinon on continue - changement de tour
    games[gameIndex].gameState.currentTurn = games[gameIndex].gameState.currentTurn === 'player:1' ? 'player:2' : 'player:1';
    
    // Réinitialiser le timer à 30 secondes pour le nouveau joueur
    games[gameIndex].gameState.timer = GameService.timer.getTurnDuration();

    // On remet le deck et les choix à zéro (la grille, elle, ne change pas)
    games[gameIndex].gameState.deck = GameService.init.deck();
    games[gameIndex].gameState.choices = GameService.init.choices();

    // On reset le timer et on remet à jour la vue
    updateClientsViewTimers(games[gameIndex]);
    updateClientsViewDecks(games[gameIndex]);
    updateClientsViewChoices(games[gameIndex]);
    updateClientsViewGrid(games[gameIndex]);

    // Si c'est une partie contre le bot et que c'est maintenant le tour du bot
    if (games[gameIndex].isVsBot && games[gameIndex].gameState.currentTurn === 'player:2') {
      setTimeout(() => {
        playBotTurn(gameIndex);
      }, 1000);
    }
  });

  socket.on('disconnect', reason => {
    removePlayerFromQueue(socket);
    removeGameBySocket(socket);
  });
});

app.get('/', (req, res) => res.json({ status: 'WebSocket Server running', port: 3000 }));

server.listen(3000, function(){
  console.log('listening on *:3000');
});
