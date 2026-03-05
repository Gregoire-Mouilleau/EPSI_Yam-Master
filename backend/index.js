const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const socketIo = require('socket.io');
var uniqid = require('uniqid');
const GameService = require('./services/game.service');
const authRoutes = require('./routes/auth.routes');

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

const newPlayerInQueue = (socket) => {

  removePlayerFromQueue(socket);

  queue.push(socket);

  if (queue.length >= 2) {
    const player1Socket = queue.shift();
    const player2Socket = queue.shift();
    createGame(player1Socket, player2Socket);
  }
  else {
    socket.emit('queue.added', GameService.send.forPlayer.viewQueueState());
  }
};

const createGame = (player1Socket, player2Socket) => {

  const newGame = GameService.init.gameState();
  newGame['idGame'] = uniqid();
  newGame['player1Socket'] = player1Socket;
  newGame['player2Socket'] = player2Socket;

  games.push(newGame);

  const gameIndex = GameService.utils.findGameIndexById(games, newGame.idGame);

  games[gameIndex].player1Socket.emit('game.start', GameService.send.forPlayer.viewGameState('player:1', games[gameIndex]));
  games[gameIndex].player2Socket.emit('game.start', GameService.send.forPlayer.viewGameState('player:2', games[gameIndex]));
};

const removePlayerFromQueue = (socket) => {
  const index = queue.findIndex(s => s.id === socket.id);
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

  socket.on('queue.join', () => {
    newPlayerInQueue(socket);
  });

  socket.on('queue.leave', () => {
    removePlayerFromQueue(socket);
    socket.emit('queue.left', { success: true, message: 'You left the queue' });
  });

  socket.on('get.state', () => {
    const inQueue = queue.some(s => s.id === socket.id);
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
