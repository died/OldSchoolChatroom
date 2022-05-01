'use strict';
const port = process.env.PORT || 8080;
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "http://localhost:" + port,
    },
});

var users = [];

app.use(express.static('static'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

server.listen(port, () => {
    console.log('server listening on *:' + port);
});

io.use((socket, next) => {
    const header = socket.handshake.headers;
    if (!header.username) {
        //return next(new Error("invalid username"));
    } else {
        socket.username = header.username;
    }
    next();
});

io.on('connection', (socket) => {
    //user
    AddUser(socket);

    //login
    if (socket.username) {
        let loginMsg = socket.username + ' connected.';
        socket.join("chatroom");
        Chat(loginMsg, socket, true);
        console.log(socket.rooms);
    }

    socket.on("disconnecting", () => {
        RemoveUser(socket);
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            let logoutMsg = socket.username + ' disconnected.';
            Chat(logoutMsg, socket, true);
        }
    });

    //direct message
    socket.on("message", ({ msg, to }) => {
        Message(msg, socket, to);
    });

    //char board
    socket.on('chat', (msg) => {
        Chat(msg, socket);
    });
});

function Chat(msg, socket, isServer = false) {
    console.log('chat: ' + msg);
    var from = isServer ? null : socket.id;
    socket.broadcast.emit('board', { msg, from });
}

function Message(msg, socket, to) {
    console.log('message:' + msg);
    console.log('to: ' + to);
    console.log('from: ' + socket.id);
    //not sure why direct message not working
    //socket.to(to).emit("message", {
    //    msg: msg,
    //    from: socket.id
    //});
    socket.broadcast.emit("message", {
        msg: msg,
        from: socket.id,
        to: to
    });}

function RemoveUser(socket) {
    if(socket.username) users = users.filter(x => x.id !== socket.id);
    //broadcast user
    socket.broadcast.emit("users", users);
}

//user with name set in
function AddUser(socket) {
    if (socket.username) {
        users.push({
            id: socket.id,
            username: socket.username
        });
        console.log(users);
        console.log('username: ' + socket.username);
    }
    //broadcast user
    socket.emit("users", users);
    socket.broadcast.emit("users", users);
}