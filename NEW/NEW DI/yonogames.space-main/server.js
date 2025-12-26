const express = require('express');
const socketio = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Connected users ko track karega
const users = {};

io.on('connection', (socket) => {
  console.log('New user aaya:', socket.id);

  // New user ko add karo
  users[socket.id] = { socket, paired: false };

  // Random partner dhundho
  const partnerId = Object.keys(users).find(
    id => id !== socket.id && !users[id].paired
  );

  if (partnerId) {
    // Dono ko connect karo
    users[socket.id].paired = true;
    users[partnerId].paired = true;

    // Dono ko batao ki connection ho gaya
    socket.emit('chat-start', { partnerId });
    users[partnerId].socket.emit('chat-start', { partnerId: socket.id });

    // Message forwarding
    socket.on('send-message', (msg) => {
      users[partnerId].socket.emit('receive-message', msg);
    });

    // Agar koi disconnect kare
    socket.on('disconnect', () => {
      if (users[partnerId]) {
        users[partnerId].socket.emit('partner-disconnected');
      }
      delete users[socket.id];
    });
  } else {
    socket.emit('waiting', 'Partner dhundha ja raha hai...');
  }
});

// Static files serve karo
app.use(express.static('public'));

// Server chalao
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server chalu hai: http://localhost:${PORT}`);
});