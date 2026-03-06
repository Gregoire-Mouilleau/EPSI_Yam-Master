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

  socket.on('disconnect', reason => {
    removePlayerFromQueue(socket);
    removeGameBySocket(socket);
  });
});

app.get('/', (req, res) => res.json({ status: 'WebSocket Server running', port: 3000 }));

server.listen(3000, function(){
  console.log('listening on *:3000');
});
