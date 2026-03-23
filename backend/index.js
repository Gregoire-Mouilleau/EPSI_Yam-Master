const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const socketIo = require('socket.io');
var uniqid = require('uniqid');
const GameService = require('./services/game.service');
const authRoutes = require('./routes/auth.routes');
const db = require('./db');

const getUserByPseudoStmt = db.prepare('SELECT id, pseudo, avatar_key FROM users WHERE pseudo = ?');

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
  game.player2Socket.emit('game.timer', GameService.send.forPlayer.gameTimer('player:2', game.gameState));
};

const updateClientsViewDecks = (game) => {
  setTimeout(() => {
    game.player1Socket.emit('game.deck.view-state', GameService.send.forPlayer.deckViewState('player:1', game.gameState));
    game.player2Socket.emit('game.deck.view-state', GameService.send.forPlayer.deckViewState('player:2', game.gameState));
  }, 200);
};

const updateClientsViewChoices = (game) => {
  setTimeout(() => {
    game.player1Socket.emit('game.choices.view-state', GameService.send.forPlayer.choicesViewState('player:1', game.gameState));
    game.player2Socket.emit('game.choices.view-state', GameService.send.forPlayer.choicesViewState('player:2', game.gameState));
  }, 200);
};

const updateClientsViewGrid = (game) => {
  setTimeout(() => {
    game.player1Socket.emit('game.grid.view-state', GameService.send.forPlayer.gridViewState('player:1', game.gameState));
    game.player2Socket.emit('game.grid.view-state', GameService.send.forPlayer.gridViewState('player:2', game.gameState));
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

  games.push(newGame);

  const gameIndex = GameService.utils.findGameIndexById(games, newGame.idGame);

  games[gameIndex].player1Socket.emit('game.start', GameService.send.forPlayer.viewGameState('player:1', games[gameIndex]));
  games[gameIndex].player2Socket.emit('game.start', GameService.send.forPlayer.viewGameState('player:2', games[gameIndex]));

  updateClientsViewTimers(games[gameIndex]);
  updateClientsViewDecks(games[gameIndex]);
  updateClientsViewChoices(games[gameIndex]);
  updateClientsViewGrid(games[gameIndex]);

  // On execute une fonction toutes les secondes (1000 ms)
  const gameInterval = setInterval(() => {

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

  // On stocke l'intervalle dans l'objet game pour pouvoir le nettoyer plus tard
  games[gameIndex].gameInterval = gameInterval;

  // On prévoit de couper l'horloge
  // pour le moment uniquement quand le socket se déconnecte
  player1Socket.on('disconnect', () => {
    clearInterval(gameInterval);
  });

  player2Socket.on('disconnect', () => {
    clearInterval(gameInterval);
  });
};

const removePlayerFromQueue = (socket) => {
  const index = queue.findIndex(item => item.socket.id === socket.id);
  if (index !== -1) {
    queue.splice(index, 1);
  }
};

const findGameBySocket = (socket) => {
  return games.find(game => 
    game.player1Socket.id === socket.id || 
    game.player2Socket.id === socket.id
  );
};

const removeGameBySocket = (socket) => {
  const gameIndex = games.findIndex(game => 
    game.player1Socket.id === socket.id || 
    game.player2Socket.id === socket.id
  );
  
  if (gameIndex !== -1) {
    const game = games[gameIndex];
    
    // Nettoyer l'intervalle du timer
    if (game.gameInterval) {
      clearInterval(game.gameInterval);
    }
    
    if (game.player1Socket.id === socket.id) {
      game.player2Socket.emit('opponent.disconnected', { message: 'Votre adversaire s\'est déconnecté' });
    } else {
      game.player1Socket.emit('opponent.disconnected', { message: 'Votre adversaire s\'est déconnecté' });
    }
    
    games.splice(gameIndex, 1);
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

      const combinations = GameService.choices.findCombinations(dices, isDefi, isSec);
      games[gameIndex].gameState.choices.availableChoices = combinations;

      // Réinitialiser le timer à 30s
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

      const combinations = GameService.choices.findCombinations(dices, isDefi, isSec);
      games[gameIndex].gameState.choices.availableChoices = combinations;

      // Si on a des combinaisons possibles, on laisse 30s, sinon 4s
      if (combinations.length > 0) {
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

    // TODO: Ici calculer le score
    // TODO: Puis check si la partie s'arrête (lines / diagonales / no-more-gametokens)

    // Sinon on finit le tour
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
