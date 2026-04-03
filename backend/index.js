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
const historyRoutes = require('./routes/history.routes');
const db = require('./db');

const getUserByPseudoStmt = db.prepare('SELECT id, pseudo, avatar_key FROM users WHERE pseudo = ?');

// Statements pour les sauvegardes vs bot (SQLite)
const getSavedGameStmt = db.prepare('SELECT * FROM saved_games WHERE user_id = ?');
const insertSavedGameStmt = db.prepare(`
  INSERT INTO saved_games (user_id, game_state, created_at, updated_at)
  VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
`);
const updateSavedGameStmt = db.prepare(`
  UPDATE saved_games 
  SET game_state = ?, updated_at = CURRENT_TIMESTAMP 
  WHERE user_id = ?
`);
const deleteSavedGameStmt = db.prepare('DELETE FROM saved_games WHERE user_id = ?');

// Statements pour l'historique des parties
const insertGameHistoryStmt = db.prepare(`
  INSERT INTO game_history (
    game_type, player1_id, player1_pseudo, player2_id, player2_pseudo,
    winner_id, player1_score, player2_score, duration_seconds, moves_json, end_reason, played_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
`);

// Fonction pour sauvegarder une partie dans l'historique
const saveGameToHistory = (game, winner, player1Score, player2Score, durationSeconds = null, endReason = 'score') => {
  try {
    const gameType = game.isVsBot ? 'bot' : 'online';
    
    // Récupérer les IDs des utilisateurs
    const player1 = getUserByPseudoStmt.get(game.player1Pseudo);
    const player2 = game.isVsBot ? null : getUserByPseudoStmt.get(game.player2Pseudo);
    
    if (!player1) {
      console.log(`[HISTORY] Player1 "${game.player1Pseudo}" introuvable, historique ignoré`);
      return;
    }
    
    // Déterminer l'ID du gagnant
    let winnerId = null;
    if (winner === 'player:1') {
      winnerId = player1.id;
    } else if (winner === 'player:2' && player2) {
      winnerId = player2.id;
    } else if (winner === 'player:2' && game.isVsBot) {
      winnerId = 0; // Sentinel : le bot a gagné (0 n'est jamais un vrai user ID)
    }
    // Si winner === 'draw', winnerId reste null

    const movesJson = game.moves && game.moves.length > 0
      ? JSON.stringify(game.moves)
      : null;
    
    insertGameHistoryStmt.run(
      gameType,
      player1.id,
      game.player1Pseudo,
      player2 ? player2.id : null,
      game.player2Pseudo || '🤖 Bot',
      winnerId,
      player1Score,
      player2Score,
      durationSeconds,
      movesJson,
      endReason
    );
    
    console.log(`[HISTORY] ✓ Partie sauvegardée: ${game.player1Pseudo} vs ${game.player2Pseudo || 'Bot'} (${winner})`);

    // Supprimer la sauvegarde en cours pour les parties vs bot (la partie est terminée)
    if (game.isVsBot) {
      deleteSavedGameStmt.run(player1.id);
      console.log(`[HISTORY] Sauvegarde vs bot supprimée pour "${game.player1Pseudo}"`);
    }
  } catch (error) {
    console.error('[HISTORY ERROR]', error);
  }
};

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
app.use('/api', historyRoutes);

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

const determineRPSWinner = (choice1, choice2) => {
  if (choice1 === choice2) return 'draw';
  
  if (
    (choice1 === 'rock' && choice2 === 'scissors') ||
    (choice1 === 'paper' && choice2 === 'rock') ||
    (choice1 === 'scissors' && choice2 === 'paper')
  ) {
    return 'player1';
  }
  
  return 'player2';
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
  newGame['moves'] = [];
  
  // Pierre-papier-ciseaux pour déterminer qui commence
  newGame['rpsPlayer1Choice'] = null;
  newGame['rpsPlayer2Choice'] = null;
  newGame['rpsStarted'] = false;

  games.push(newGame);

  const gameIndex = GameService.utils.findGameIndexById(games, newGame.idGame);
  
  // Envoyer l'événement pour démarrer le pierre-papier-ciseaux
  games[gameIndex].rpsStarted = true;
  games[gameIndex].player1Socket.emit('rps.start', {
    playerPseudo: player1Pseudo,
    opponentPseudo: player2Pseudo
  });
  games[gameIndex].player2Socket.emit('rps.start', {
    playerPseudo: player2Pseudo,
    opponentPseudo: player1Pseudo
  });

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
  newGame['moves'] = [];

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
      const isFirstRollBot = currentRoll === 2;
      let isDefi;
      if (isFirstRollBot) {
        isDefi = Math.random() < 0.75 && isDefiCellAvailable(games[gameIndex].gameState.grid);
        games[gameIndex].gameState.choices.isDefi = isDefi;
      } else {
        isDefi = games[gameIndex].gameState.choices.isDefi || false;
      }
      const isSec = isFirstRollBot;
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
        const hasYam  = usableChoices.some(c => c.id === 'yam'  || c.id.startsWith('yam'));
        const hasCarre = usableChoices.some(c => c.id === 'carre' || c.id.startsWith('carre'));
        const hasSuite = usableChoices.some(c => c.id === 'suite' || c.id.startsWith('suite'));
        const hasFull  = usableChoices.some(c => c.id === 'full'  || c.id.startsWith('full'));
        const hasSec   = usableChoices.some(c => c.id === 'sec');
        const hasMoinsHuit = usableChoices.some(c => c.id === 'moinshuit');
        const hasDefi  = usableChoices.some(c => c.id === 'defi');

        // Évaluer si la combo a une importance stratégique critique
        const choicesWithScores = usableChoices.map(choice => {
          const possibleCells = BotService.decision.findCellsForChoice(grid, choice.id, 'player:2', 'player:1', strategy);
          const bestScore = possibleCells.length > 0 ? Math.max(...possibleCells.map(c => c.score)) : 0;
          return { choice, bestScore };
        });
        const hasCriticalMove = choicesWithScores.some(c => c.bestScore > 4000);

        // SEC / DÉFI / ≤8 : évaluer si la case visée est sur une ligne gagnante
        const secScore = hasSec ? (choicesWithScores.find(c => c.choice.id === 'sec')?.bestScore ?? 0) : 0;
        const moinsHuitScore = hasMoinsHuit ? (choicesWithScores.find(c => c.choice.id === 'moinshuit')?.bestScore ?? 0) : 0;
        // On considère SEC/≤8 stratégique si la case vaut ≥ 1500 pts (sur une ligne avancée)
        const hasStrategicSec = hasSec && secScore >= 1500;
        const hasStrategicMH = hasMoinsHuit && moinsHuitScore >= 1500;

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
        // SEC : on ne peut PAS re-lancer et garder sec - si la case est stratégique, on s'arrête obligatoirement
        else if (hasSec && (hasCriticalMove || hasStrategicSec || currentRoll >= rollsMax)) {
          shouldStop = true;
          console.log('[BOT] 🔒 SEC obtenu - arrêt (stratégique:', hasStrategicSec, '/ critique:', hasCriticalMove, '/ score:', secScore, ')');
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
            shouldStop = Math.random() < 0.3;
            console.log('[BOT] SUITE/FULL -', shouldStop ? 'arrêt' : 'continue pour améliorer');
          }
        }
        // ≤8 : s'arrêter uniquement si la case est sur une ligne avancée
        else if (hasStrategicMH || (hasMoinsHuit && currentRoll >= rollsMax)) {
          shouldStop = true;
          console.log('[BOT] ≤8 stratégique - arrêt immédiat');
        }
        // DÉFI : le bot tente le défi si disponible et pas de meilleure combo
        else if (hasDefi) {
          if (currentRoll >= rollsMax) {
            shouldStop = true;
            console.log('[BOT] 🎯 DÉFI disponible au dernier lancer - arrêt');
          } else {
            shouldStop = Math.random() < 0.5;
            console.log('[BOT] 🎯 DÉFI disponible -', shouldStop ? 'arrêt pour tenter le défi' : 'continue de lancer');
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

// Le bot joue en mode défi (tente d'obtenir une figure non-brelan)
const botPlayDefiMode = (gameIndex, maxAttempts = 2) => {
  if (!games[gameIndex] || games[gameIndex].gameState.currentTurn !== 'player:2') return;

  const attemptDefiRoll = () => {
    if (!games[gameIndex] || games[gameIndex].gameState.currentTurn !== 'player:2') return;

    const defiRollCount = (games[gameIndex].gameState.choices.defiRollCount || 0) + 1;
    games[gameIndex].gameState.choices.defiRollCount = defiRollCount;

    // Déverrouiller tous les dés avant de lancer (sauf si c'est un relancer avec des dés gardés)
    if (defiRollCount === 1) {
      // Premier lancer défi : tout déverrouiller
      games[gameIndex].gameState.deck.dices = games[gameIndex].gameState.deck.dices.map(d => ({ ...d, locked: false }));
    }
    // Sinon les dés sont déjà dans l'état voulu (certains verrouillés par botUpdateDiceLocks)
    games[gameIndex].gameState.deck.dices = GameService.dices.roll(games[gameIndex].gameState.deck.dices);
    games[gameIndex].gameState.deck.rollsCounter++;

    console.log(`[BOT] [DEFI] Lancer défi ${defiRollCount}/${maxAttempts}`);
    updateClientsViewDecks(games[gameIndex]);
    updateClientsViewChoices(games[gameIndex]);

    setTimeout(() => {
      if (!games[gameIndex]) return;

      const dices = games[gameIndex].gameState.deck.dices;
      const isSec = defiRollCount === 1;
      const allCombos = GameService.choices.findCombinations(dices, false, isSec, games[gameIndex].gameState.grid);
      const hasNonBrelan = allCombos.some(c => !c.id.includes('brelan'));

      if (hasNonBrelan) {
        // DÉFI RÉUSSI
        console.log('[BOT] [DEFI] ✅ Défi réussi !');
        const defiAvailable = isDefiCellAvailable(games[gameIndex].gameState.grid);
        games[gameIndex].gameState.choices.availableChoices = [{ value: 'Défi', id: 'defi', disabled: !defiAvailable }];
        games[gameIndex].gameState.choices.idSelectedChoice = 'defi';
        games[gameIndex].gameState.grid = GameService.grid.resetcanBeCheckedCells(games[gameIndex].gameState.grid);
        games[gameIndex].gameState.grid = GameService.grid.updateGridAfterSelectingChoice('defi', games[gameIndex].gameState.grid);
        games[gameIndex].gameState.deck.rollsCounter = games[gameIndex].gameState.deck.rollsMaximum + 1;
        games[gameIndex].gameState.deck.dices = GameService.dices.lockEveryDice(games[gameIndex].gameState.deck.dices);
        updateClientsViewDecks(games[gameIndex]);
        updateClientsViewChoices(games[gameIndex]);
        updateClientsViewGrid(games[gameIndex]);
        setTimeout(() => botChooseCell(gameIndex, 'defi', BotService.determineStrategy(
          games[gameIndex].gameState.grid, 'player:2', 'player:1'
        )), 1200);

      } else if (defiRollCount >= maxAttempts) {
        // DÉFI ÉCHOUÉ après tous les lancers disponibles - perte du tour
        console.log('[BOT] [DEFI] ❌ Défi échoué - perte du tour');
        games[gameIndex].gameState.currentTurn = 'player:1';
        games[gameIndex].gameState.timer = GameService.timer.getTurnDuration();
        games[gameIndex].gameState.deck = GameService.init.deck();
        games[gameIndex].gameState.choices = GameService.init.choices();
        games[gameIndex].gameState.grid = GameService.grid.resetcanBeCheckedCells(games[gameIndex].gameState.grid);
        updateClientsViewTimers(games[gameIndex]);
        updateClientsViewDecks(games[gameIndex]);
        updateClientsViewChoices(games[gameIndex]);
        updateClientsViewGrid(games[gameIndex]);

      } else {
        // Échec du 1er lancer - verrouiller les dés stratégiques avant de relancer
        const dicesToKeep = BotService.getDefiDicesToKeep(games[gameIndex].gameState.deck.dices);
        console.log(`[BOT] [DEFI] Dés à garder pour relancer: ${dicesToKeep.map(d => `${d.id}(${d.value})`).join(', ') || 'aucun'}`);
        botUpdateDiceLocks(gameIndex, dicesToKeep, () => {
          setTimeout(() => attemptDefiRoll(), 500);
        });
      }
    }, 2300);
  };

  setTimeout(() => attemptDefiRoll(), 1000);
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

  // Cas spécial : le bot a choisi le défi
  if (chosenCombo.id === 'defi') {
    const alreadyValidates = games[gameIndex].gameState.choices.availableChoices.some(
      c => !c.id.includes('brelan') && c.id !== 'defi'
    );

    if (alreadyValidates) {
      // Défi validé immédiatement (figure non-brelan déjà présente)
      console.log('[BOT] [DEFI] ✅ Défi validé immédiatement (figure non-brelan déjà présente)');
      const defiAvailable = isDefiCellAvailable(games[gameIndex].gameState.grid);
      games[gameIndex].gameState.choices.availableChoices = [{ value: 'Défi', id: 'defi', disabled: !defiAvailable }];
      games[gameIndex].gameState.choices.idSelectedChoice = 'defi';
      games[gameIndex].gameState.grid = GameService.grid.resetcanBeCheckedCells(games[gameIndex].gameState.grid);
      games[gameIndex].gameState.grid = GameService.grid.updateGridAfterSelectingChoice('defi', games[gameIndex].gameState.grid);
      games[gameIndex].gameState.deck.rollsCounter = games[gameIndex].gameState.deck.rollsMaximum + 1;
      games[gameIndex].gameState.deck.dices = GameService.dices.lockEveryDice(games[gameIndex].gameState.deck.dices);
      updateClientsViewDecks(games[gameIndex]);
      updateClientsViewChoices(games[gameIndex]);
      updateClientsViewGrid(games[gameIndex]);
      setTimeout(() => botChooseCell(gameIndex, 'defi', BotService.determineStrategy(
        games[gameIndex].gameState.grid, 'player:2', 'player:1'
      )), 1200);
    } else {
      // Calculer combien de lancers défi sont encore possibles
      const rollsMaximum = games[gameIndex].gameState.deck.rollsMaximum;
      const rollsCounter = games[gameIndex].gameState.deck.rollsCounter;
      const maxDefiAttempts = Math.max(0, rollsMaximum - (rollsCounter - 1));

      if (maxDefiAttempts === 0) {
        // Plus de lancers disponibles, le défi échoue immédiatement
        console.log('[BOT] [DEFI] ❌ Aucun lancer restant pour le défi - perte du tour');
        games[gameIndex].gameState.currentTurn = 'player:1';
        games[gameIndex].gameState.timer = GameService.timer.getTurnDuration();
        games[gameIndex].gameState.deck = GameService.init.deck();
        games[gameIndex].gameState.choices = GameService.init.choices();
        games[gameIndex].gameState.grid = GameService.grid.resetcanBeCheckedCells(games[gameIndex].gameState.grid);
        updateClientsViewTimers(games[gameIndex]);
        updateClientsViewDecks(games[gameIndex]);
        updateClientsViewChoices(games[gameIndex]);
        updateClientsViewGrid(games[gameIndex]);
        return;
      }

      // Entrer en mode défi : le bot doit rouler pour obtenir une figure non-brelan
      console.log(`[BOT] [DEFI] 🎯 Entrée en mode défi (${maxDefiAttempts} lancers disponibles)`);
      games[gameIndex].gameState.choices.isDefiMode = true;
      games[gameIndex].gameState.choices.defiRollCount = 0;
      games[gameIndex].gameState.choices.availableChoices = [];
      updateClientsViewChoices(games[gameIndex]);
      updateClientsViewDecks(games[gameIndex]);
      setTimeout(() => botPlayDefiMode(gameIndex, maxDefiAttempts), 1000);
    }
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

  games[gameIndex].gameState.player2PiecesLeft = Math.max(0, (games[gameIndex].gameState.player2PiecesLeft ?? 12) - 1);

  // Mettre à jour immédiatement pour montrer le jeton
  updateClientsViewGrid(games[gameIndex]);

  // Vérifier la fin du jeu (même logique que pour les joueurs)
  // La variable grid est déjà définie plus haut
  
  // Vérifier ligne de 5 pour le bot
  const botHasLineOf5 = GameService.grid.findLines(games[gameIndex].gameState.grid, 'player:2', 5).length > 0;
  if (botHasLineOf5) {
    // Sauvegarder dans l'historique
    const p1ScoreBot = GameService.grid.calculateScore(games[gameIndex].gameState.grid, 'player:1');
    const p2ScoreBot = GameService.grid.calculateScore(games[gameIndex].gameState.grid, 'player:2');
    saveGameToHistory(games[gameIndex], 'player:2', p1ScoreBot, p2ScoreBot, null, 'line-of-5');
    
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
    // Sauvegarder dans l'historique
    const p1ScorePlayer = GameService.grid.calculateScore(games[gameIndex].gameState.grid, 'player:1');
    const p2ScorePlayer = GameService.grid.calculateScore(games[gameIndex].gameState.grid, 'player:2');
    saveGameToHistory(games[gameIndex], 'player:1', p1ScorePlayer, p2ScorePlayer, null, 'line-of-5');
    
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

  // Vérifier si un joueur n'a plus de pions OU si la grille est pleine
  const p1PiecesBot = games[gameIndex].gameState.player1PiecesLeft ?? 0;
  const p2PiecesBot = games[gameIndex].gameState.player2PiecesLeft ?? 0;
  const noPiecesLeftBot = p1PiecesBot === 0 || p2PiecesBot === 0;

  if (noPiecesLeftBot || GameService.grid.isFull(games[gameIndex].gameState.grid)) {
    const player1Score = GameService.grid.calculateScore(games[gameIndex].gameState.grid, 'player:1');
    const player2Score = GameService.grid.calculateScore(games[gameIndex].gameState.grid, 'player:2');
    
    let winner = 'draw';
    if (player1Score > player2Score) winner = 'player:1';
    else if (player2Score > player1Score) winner = 'player:2';
    
    // Sauvegarder dans l'historique
    saveGameToHistory(games[gameIndex], winner, player1Score, player2Score);
    
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

// Sauvegarder les parties vs bot dans SQLite
const saveVsBotGames = () => {
  try {
    const botGames = games.filter(game => game.isVsBot);
    console.log(`[SAVE] Sauvegarde de ${botGames.length} partie(s) vs bot...`);
    
    botGames.forEach(game => {
      try {
        // Récupérer l'ID utilisateur depuis le pseudo
        const user = getUserByPseudoStmt.get(game.player1Pseudo);
        if (!user) {
          console.log(`[SAVE] User "${game.player1Pseudo}" introuvable, sauvegarde ignorée`);
          return;
        }

        const gameStateJson = JSON.stringify({
          idGame: game.idGame,
          player1Pseudo: game.player1Pseudo,
          player1AvatarKey: game.player1AvatarKey,
          player2Pseudo: game.player2Pseudo,
          player2AvatarKey: game.player2AvatarKey,
          gameState: game.gameState,
          isVsBot: game.isVsBot,
          botDifficulty: game.botDifficulty,
          savedAt: new Date().toISOString()
        });

        // Vérifier si une sauvegarde existe déjà
        const existing = getSavedGameStmt.get(user.id);
        if (existing) {
          updateSavedGameStmt.run(gameStateJson, user.id);
        } else {
          insertSavedGameStmt.run(user.id, gameStateJson);
        }
        
        console.log(`[SAVE] ✓ Partie de "${game.player1Pseudo}" sauvegardée`);
      } catch (err) {
        console.error(`[SAVE ERROR] Erreur pour "${game.player1Pseudo}":`, err.message);
      }
    });
    
    console.log(`[SAVE] ${botGames.length} partie(s) vs bot sauvegardée(s)`);
  } catch (error) {
    console.error('[SAVE ERROR]', error);
  }
};

// Charger les parties vs bot sauvegardées (fonction conservée pour compatibilité)
const loadVsBotGames = () => {
  return []; // Non utilisée avec SQLite, conservée pour éviter les erreurs
};

// Trouver une partie sauvegardée pour un joueur (SQLite)
const findSavedGameForPlayer = (playerPseudo) => {
  try {
    const user = getUserByPseudoStmt.get(playerPseudo);
    if (!user) return null;
    
    const savedGame = getSavedGameStmt.get(user.id);
    if (!savedGame) return null;
    
    // Parser le JSON du game_state
    return JSON.parse(savedGame.game_state);
  } catch (error) {
    console.error('[LOAD ERROR]', error);
    return null;
  }
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

// Helper : vérifie si au moins une cellule Défi est disponible sur la grille
const isDefiCellAvailable = (grid) => {
  for (const row of grid) {
    for (const cell of row) {
      if (cell.id === 'defi' && cell.owner === null) return true;
    }
  }
  return false;
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
  
  socket.on('rps.choice', (data) => {
    const choice = data?.choice; // 'rock', 'paper', 'scissors'
    
    // Trouver la partie en cours pour ce joueur
    const gameIndex = games.findIndex(game => 
      game.rpsStarted && 
      ((game.player1Socket && game.player1Socket.id === socket.id) || 
       (game.player2Socket && game.player2Socket.id === socket.id))
    );
    
    if (gameIndex === -1) {
      console.log('[RPS] Partie non trouvée pour le socket', socket.id);
      return;
    }
    
    const game = games[gameIndex];
    const isPlayer1 = game.player1Socket && game.player1Socket.id === socket.id;
    
    // Enregistrer le choix
    if (isPlayer1) {
      game.rpsPlayer1Choice = choice;
      console.log(`[RPS] Player1 (${game.player1Pseudo}) a choisi: ${choice}`);
    } else {
      game.rpsPlayer2Choice = choice;
      console.log(`[RPS] Player2 (${game.player2Pseudo}) a choisi: ${choice}`);
    }
    
    // Informer l'adversaire que le joueur a fait son choix
    const opponentSocket = isPlayer1 ? game.player2Socket : game.player1Socket;
    if (opponentSocket) {
      opponentSocket.emit('rps.opponent.ready');
    }
    
    // Si les deux joueurs ont choisi, déterminer le gagnant
    if (game.rpsPlayer1Choice && game.rpsPlayer2Choice) {
      const result = determineRPSWinner(game.rpsPlayer1Choice, game.rpsPlayer2Choice);
      
      console.log(`[RPS] Résultat: ${game.player1Pseudo} (${game.rpsPlayer1Choice}) vs ${game.player2Pseudo} (${game.rpsPlayer2Choice}) = ${result}`);
      
      // Envoyer le résultat aux deux joueurs
      game.player1Socket.emit('rps.result', {
        playerChoice: game.rpsPlayer1Choice,
        opponentChoice: game.rpsPlayer2Choice,
        result: result
      });
      
      game.player2Socket.emit('rps.result', {
        playerChoice: game.rpsPlayer2Choice,
        opponentChoice: game.rpsPlayer1Choice,
        result: result === 'draw' ? 'draw' : (result === 'player1' ? 'opponent' : 'player')
      });
      
      if (result === 'draw') {
        // Égalité : recommencer
        console.log('[RPS] Égalité ! On recommence...');
        setTimeout(() => {
          game.rpsPlayer1Choice = null;
          game.rpsPlayer2Choice = null;
          
          game.player1Socket.emit('rps.restart');
          game.player2Socket.emit('rps.restart');
        }, 2500);
      } else {
        // Quelqu'un a gagné : définir qui commence
        game.gameState.currentTurn = result === 'player1' ? 'player:1' : 'player:2';
        game.rpsStarted = false;
        
        console.log(`[RPS] ${result === 'player1' ? game.player1Pseudo : game.player2Pseudo} commence !`);
        
        // Démarrer la partie après 2.5 secondes
        setTimeout(() => {
          game.player1Socket.emit('game.start', GameService.send.forPlayer.viewGameState('player:1', games[gameIndex]));
          game.player2Socket.emit('game.start', GameService.send.forPlayer.viewGameState('player:2', games[gameIndex]));

          updateClientsViewTimers(games[gameIndex]);
          updateClientsViewDecks(games[gameIndex]);
          updateClientsViewChoices(games[gameIndex]);
          updateClientsViewGrid(games[gameIndex]);

          // Démarrer le timer du jeu
          startOnlineGameTimer(gameIndex);
        }, 2500);
      }
    }
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
      
      // Supprimer la partie de la base de données
      try {
        const user = getUserByPseudoStmt.get(pseudo);
        if (user) {
          deleteSavedGameStmt.run(user.id);
          console.log(`[RESTORE] Sauvegarde supprimée pour "${pseudo}"`);
        }
      } catch (err) {
        console.error('[RESTORE ERROR]', err);
      }
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
      
      // Supprimer toute partie sauvegardée existante
      if (user) {
        deleteSavedGameStmt.run(user.id);
        console.log(`[NEW GAME] Sauvegarde supprimée pour "${pseudo}"`);
      }
    } catch (error) {
      console.error('Error handling vsbot.new:', error);
    }
    
    createGameVsBot(socket, pseudo, avatarKey);
  });
  
  socket.on('vsbot.abandon', (data) => {
    const pseudo = data?.pseudo || 'Anonymous';

    // Supprimer la partie active en mémoire si elle existe encore
    const gameIndex = GameService.utils.findGameIndexBySocketId(games, socket.id);
    if (gameIndex !== -1 && games[gameIndex].isVsBot) {
      if (games[gameIndex].gameInterval) {
        clearInterval(games[gameIndex].gameInterval);
      }
      games.splice(gameIndex, 1);
      console.log(`[ABANDON] Partie active de "${pseudo}" supprimée`);
    }

    // Supprimer la sauvegarde SQLite
    try {
      const user = getUserByPseudoStmt.get(pseudo);
      if (user) {
        deleteSavedGameStmt.run(user.id);
        console.log(`[ABANDON] Sauvegarde supprimée pour "${pseudo}"`);
      }
    } catch (error) {
      console.error('Error handling vsbot.abandon:', error);
    }
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

    const isDefiMode = games[gameIndex].gameState.choices.isDefiMode;

    if (games[gameIndex].gameState.deck.rollsCounter < games[gameIndex].gameState.deck.rollsMaximum) {
      // Si ce n'est pas le dernier lancé

      // Gestion des dés
      games[gameIndex].gameState.deck.dices = GameService.dices.roll(games[gameIndex].gameState.deck.dices);
      games[gameIndex].gameState.deck.rollsCounter++;

      if (isDefiMode) {
        // Mode défi actif : montrer d'abord l'animation des dés, puis traiter
        games[gameIndex].gameState.choices.defiRollCount = (games[gameIndex].gameState.choices.defiRollCount || 0) + 1;
        const currentDefiRoll = games[gameIndex].gameState.choices.defiRollCount;
        // Envoyer les dés lancés pour l'animation
        updateClientsViewTimers(games[gameIndex]);
        updateClientsViewDecks(games[gameIndex]);

        setTimeout(() => {
          if (!games[gameIndex]) return;
          const dices = games[gameIndex].gameState.deck.dices;
          // isSec est valable uniquement sur le 1er lancé du défi
          const isSec = currentDefiRoll === 1;
          const allCombos = GameService.choices.findCombinations(dices, false, isSec, games[gameIndex].gameState.grid);
          const hasNonBrelan = allCombos.some(c => !c.id.includes('brelan'));

          if (hasNonBrelan) {
            // DÉFI RÉUSSI
            console.log('[DEFI] ✅ Défi réussi !');
            const defiAvailable = isDefiCellAvailable(games[gameIndex].gameState.grid);
            games[gameIndex].gameState.choices.availableChoices = [{ value: 'Défi', id: 'defi', disabled: !defiAvailable }];
            games[gameIndex].gameState.choices.idSelectedChoice = 'defi';
            games[gameIndex].gameState.grid = GameService.grid.resetcanBeCheckedCells(games[gameIndex].gameState.grid);
            games[gameIndex].gameState.grid = GameService.grid.updateGridAfterSelectingChoice('defi', games[gameIndex].gameState.grid);
            // Cacher le bouton de lancer (rollsCounter > rollsMaximum)
            games[gameIndex].gameState.deck.rollsCounter = games[gameIndex].gameState.deck.rollsMaximum + 1;
            games[gameIndex].gameState.deck.dices = GameService.dices.lockEveryDice(games[gameIndex].gameState.deck.dices);
            games[gameIndex].gameState.timer = GameService.timer.getTurnDuration();
            updateClientsViewTimers(games[gameIndex]);
            updateClientsViewDecks(games[gameIndex]);
            updateClientsViewChoices(games[gameIndex]);
            updateClientsViewGrid(games[gameIndex]);
          } else {
            // Échec pour l'instant - le joueur peut encore lancer
            games[gameIndex].gameState.choices.availableChoices = [];
            games[gameIndex].gameState.timer = GameService.timer.getTurnDuration();
            updateClientsViewTimers(games[gameIndex]);
            updateClientsViewDecks(games[gameIndex]);
            updateClientsViewChoices(games[gameIndex]);
          }
        }, 2300);
      } else {
        // Lancer normal
        const dices = games[gameIndex].gameState.deck.dices;
        const isFirstRoll = games[gameIndex].gameState.deck.rollsCounter === 2;
        // 15% de chance que le mode défi soit disponible UNIQUEMENT après le 1er lancer
        // Pour les lancers suivants on conserve le flag déjà calculé
        let isDefi;
        if (isFirstRoll) {
          isDefi = Math.random() < 0.75 && isDefiCellAvailable(games[gameIndex].gameState.grid);
          games[gameIndex].gameState.choices.isDefi = isDefi;
        } else {
          // Le joueur a relancé sans sélectionner le défi : il disparaît
          isDefi = false;
          games[gameIndex].gameState.choices.isDefi = false;
        }
        const isSec = isFirstRoll;

        const combinations = GameService.choices.findCombinations(dices, isDefi, isSec, games[gameIndex].gameState.grid);
        games[gameIndex].gameState.choices.availableChoices = combinations;

        // Réinitialiser le timer à 30s (le joueur peut encore roller)
        games[gameIndex].gameState.timer = GameService.timer.getTurnDuration();

        // Gestion des vues
        updateClientsViewTimers(games[gameIndex]);
        updateClientsViewDecks(games[gameIndex]);
        updateClientsViewChoices(games[gameIndex]);
      }

    } else {
      // Si c'est le dernier lancer

      // Gestion des dés
      games[gameIndex].gameState.deck.dices = GameService.dices.roll(games[gameIndex].gameState.deck.dices);
      games[gameIndex].gameState.deck.rollsCounter++;

      if (isDefiMode) {
        // Dernier lancer en mode défi : montrer l'animation d'abord
        games[gameIndex].gameState.choices.defiRollCount = (games[gameIndex].gameState.choices.defiRollCount || 0) + 1;
        const currentDefiRollLast = games[gameIndex].gameState.choices.defiRollCount;
        updateClientsViewTimers(games[gameIndex]);
        updateClientsViewDecks(games[gameIndex]);

        setTimeout(() => {
          if (!games[gameIndex]) return;
          const dices = games[gameIndex].gameState.deck.dices;
          // isSec est valable uniquement sur le 1er lancé du défi
          const isSec = currentDefiRollLast === 1;
          const allCombos = GameService.choices.findCombinations(dices, false, isSec, games[gameIndex].gameState.grid);
          const hasNonBrelan = allCombos.some(c => !c.id.includes('brelan'));

          if (hasNonBrelan) {
            // DÉFI RÉUSSI au dernier lancer
            console.log('[DEFI] ✅ Défi réussi au dernier lancer !');
            const defiAvailable = isDefiCellAvailable(games[gameIndex].gameState.grid);
            games[gameIndex].gameState.choices.availableChoices = [{ value: 'Défi', id: 'defi', disabled: !defiAvailable }];
            games[gameIndex].gameState.choices.idSelectedChoice = 'defi';
            games[gameIndex].gameState.grid = GameService.grid.resetcanBeCheckedCells(games[gameIndex].gameState.grid);
            games[gameIndex].gameState.grid = GameService.grid.updateGridAfterSelectingChoice('defi', games[gameIndex].gameState.grid);
            games[gameIndex].gameState.deck.dices = GameService.dices.lockEveryDice(games[gameIndex].gameState.deck.dices);
            games[gameIndex].gameState.timer = GameService.timer.getTurnDuration();
            updateClientsViewTimers(games[gameIndex]);
            updateClientsViewDecks(games[gameIndex]);
            updateClientsViewChoices(games[gameIndex]);
            updateClientsViewGrid(games[gameIndex]);
          } else {
            // DÉFI ÉCHOUÉ - perte du tour
            console.log('[DEFI] ❌ Défi échoué - perte du tour');
            games[gameIndex].gameState.currentTurn = games[gameIndex].gameState.currentTurn === 'player:1' ? 'player:2' : 'player:1';
            games[gameIndex].gameState.timer = GameService.timer.getTurnDuration();
            games[gameIndex].gameState.deck = GameService.init.deck();
            games[gameIndex].gameState.choices = GameService.init.choices();
            games[gameIndex].gameState.grid = GameService.grid.resetcanBeCheckedCells(games[gameIndex].gameState.grid);
            updateClientsViewTimers(games[gameIndex]);
            updateClientsViewDecks(games[gameIndex]);
            updateClientsViewChoices(games[gameIndex]);
            updateClientsViewGrid(games[gameIndex]);
            // Si vs bot et c'est maintenant le tour du bot
            if (games[gameIndex] && games[gameIndex].isVsBot && games[gameIndex].gameState.currentTurn === 'player:2') {
              setTimeout(() => playBotTurn(gameIndex), 1000);
            }
          }
        }, 2300);
      } else {
        // Lancer normal (dernier)
        const dices = games[gameIndex].gameState.deck.dices;
        // Le joueur arrive au dernier lancer sans avoir sélectionné le défi : il disparaît
        const isDefi = false;
        games[gameIndex].gameState.choices.isDefi = false;
        const isSec = false;

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

    const choices = games[gameIndex].gameState.choices;

    // Si le joueur choisit "Défi" pour entrer en mode défi (pas encore actif)
    if (data.choiceId === 'defi' && choices.isDefi && !choices.isDefiMode) {
      // Vérifier si les dés actuels valident déjà le défi (figure non-brelan présente)
      // On utilise les availableChoices déjà calculées (avec le bon isSec) plutôt que de recalculer
      const alreadyValidates = choices.availableChoices.some(c => !c.id.includes('brelan') && c.id !== 'defi');

      if (alreadyValidates) {
        // Défi immédiatement validé (ex: le joueur avait déjà un Sec)
        console.log('[DEFI] ✅ Défi validé immédiatement (figure non-brelan déjà présente)');
        const defiAvailable = isDefiCellAvailable(games[gameIndex].gameState.grid);
        choices.isDefiMode = true;
        choices.defiRollCount = 0;
        choices.idSelectedChoice = 'defi';
        choices.availableChoices = [{ value: 'Défi', id: 'defi', disabled: !defiAvailable }];
        games[gameIndex].gameState.deck.rollsCounter = games[gameIndex].gameState.deck.rollsMaximum + 1;
        games[gameIndex].gameState.deck.dices = GameService.dices.lockEveryDice(games[gameIndex].gameState.deck.dices);
        games[gameIndex].gameState.grid = GameService.grid.resetcanBeCheckedCells(games[gameIndex].gameState.grid);
        games[gameIndex].gameState.grid = GameService.grid.updateGridAfterSelectingChoice('defi', games[gameIndex].gameState.grid);
        games[gameIndex].gameState.timer = GameService.timer.getTurnDuration();
        updateClientsViewTimers(games[gameIndex]);
        updateClientsViewDecks(games[gameIndex]);
        updateClientsViewChoices(games[gameIndex]);
        updateClientsViewGrid(games[gameIndex]);
      } else {
        // Le joueur doit encore lancer les dés pour valider
        choices.isDefiMode = true;
        choices.defiRollCount = 0;
        choices.idSelectedChoice = 'defi';
        choices.availableChoices = [{ value: 'Défi', id: 'defi', disabled: false }];
        games[gameIndex].gameState.grid = GameService.grid.resetcanBeCheckedCells(games[gameIndex].gameState.grid);
        updateClientsViewChoices(games[gameIndex]);
        updateClientsViewGrid(games[gameIndex]);
      }
      return;
    }

    games[gameIndex].gameState.choices.idSelectedChoice = data.choiceId;
    // Le joueur a choisi une combo normale - le défi n'est plus disponible
    games[gameIndex].gameState.choices.isDefi = false;

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

    if (!games[gameIndex].moves) games[gameIndex].moves = [];
    games[gameIndex].moves.push({
      turn: games[gameIndex].moves.length + 1,
      player: games[gameIndex].gameState.currentTurn,
      rowIndex: data.rowIndex,
      cellIndex: data.cellIndex,
      cellId: data.cellId,
      diceValues: games[gameIndex].gameState.deck.dices.map(d => d.value),
    });

    // Décrémenter le compteur de pions du joueur actif
    if (games[gameIndex].gameState.currentTurn === 'player:1') {
      games[gameIndex].gameState.player1PiecesLeft = Math.max(0, (games[gameIndex].gameState.player1PiecesLeft ?? 12) - 1);
    } else {
      games[gameIndex].gameState.player2PiecesLeft = Math.max(0, (games[gameIndex].gameState.player2PiecesLeft ?? 12) - 1);
    }

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

      // Sauvegarder dans l'historique
      const p1Score5 = GameService.grid.calculateScore(games[gameIndex].gameState.grid, 'player:1');
      const p2Score5 = GameService.grid.calculateScore(games[gameIndex].gameState.grid, 'player:2');
      saveGameToHistory(games[gameIndex], 'player:1', p1Score5, p2Score5, null, 'line-of-5');

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

      // Sauvegarder dans l'historique
      const p1Score5p2 = GameService.grid.calculateScore(games[gameIndex].gameState.grid, 'player:1');
      const p2Score5p2 = GameService.grid.calculateScore(games[gameIndex].gameState.grid, 'player:2');
      saveGameToHistory(games[gameIndex], 'player:2', p1Score5p2, p2Score5p2, null, 'line-of-5');

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

    // Étape 2 : Vérifier si un joueur n'a plus de pions OU si la grille est pleine
    const p1Pieces = games[gameIndex].gameState.player1PiecesLeft ?? 0;
    const p2Pieces = games[gameIndex].gameState.player2PiecesLeft ?? 0;
    const noPiecesLeft = p1Pieces === 0 || p2Pieces === 0;

    if (noPiecesLeft || GameService.grid.isFull(games[gameIndex].gameState.grid)) {
      
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

      // Sauvegarder dans l'historique
      saveGameToHistory(games[gameIndex], winner, games[gameIndex].gameState.player1Score, games[gameIndex].gameState.player2Score);

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

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.json({ status: 'WebSocket Server running', port: PORT }));

server.listen(PORT, function(){
  console.log(`listening on *:${PORT}`);
});
