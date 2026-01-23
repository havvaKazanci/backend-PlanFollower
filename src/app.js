const express = require('express');
require('dotenv').config();
const http = require('http'); 
const { Server } = require('socket.io'); 
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" } //necessary for emulator or devices
});

const onlineUsers = new Map(); //map for actively using person searching getting

app.set('socketio', io);
app.set('onlineUsers', onlineUsers);
app.use(express.json());


io.on('connection', (socket) => {
    console.log('A new device connected. Socket ID:', socket.id);

    //User saved uuid here
    socket.on('register', (userId) => {
        onlineUsers.set(userId, socket.id);
        console.log(`User matched: ${userId} -> ${socket.id}`);
    });

    socket.on('disconnect', () => {
        for (let [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                console.log(`User gone: ${userId}`);
                break;
            }
        }
    });
});


//routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes); 

//server starting
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server and WebSocket running on ${PORT}. That is great!`);
});



