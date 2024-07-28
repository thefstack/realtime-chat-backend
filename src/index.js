'use strict';


module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {
    if (strapi.io) {
      console.log('Socket.io is already initialized.');
      return;
    }
    const io = require('socket.io')(strapi.server.httpServer, {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
      }
    });
    const activeUsers =  new Map();

    io.on('connection', (socket) => {

      socket.on('joinRoom', ({ username }) => {
        if (!activeUsers.has(socket.id)) {
          activeUsers.set(socket.id, username);
          console.log(`${username} has joined the room`);
          io.emit('message', { username: 'System', message: `${username} has joined` });
          io.emit('activeUsers', Array.from(activeUsers.values()));
        }
      });
      
      socket.on('sendMessage', ({ Data }) => {
        const { user, msg } = Data;
        console.log(`${user} sent a message: ${msg}`);
        io.emit('message', { username: user, message: msg });
      });
  
      socket.on('disconnect', () => {
        const username = activeUsers.get(socket.id);
        if (username) {
          activeUsers.delete(socket.id);
          io.emit('message', { username: 'System', message: `${username} has left the chat` });
          io.emit('activeUsers', Array.from(activeUsers.values()));
        }
        activeUsers.delete(socket.id);
      });
    });
  
    strapi.io = io;
  },
  
};
