'use strict';

const icq = new Audio("/assets/icq-message.wav");
const msgType = Object.freeze({ "chat": 1, "message": 2 });
const systemUser = Object.freeze({ id: null, username: "System" });

var socket = null;
var messages = document.getElementById('messages');
var input = document.getElementById('input');

const vue = Vue.createApp({
    props: {
        
    },
    data() {
        return {
            overlay: true,
            name: null,
            text: null,
            selectedUser: null,
            chats: [],
            users: [],
            filtered: [],
            fixedUser: ['user001', 'user002', 'user003', 'user004']
        }
    },
    mounted: function(){
        socket = io();
        this.Init();
    },
    methods: {
        Submit() {
            if (this.selectedUser) {
                this.SendMessage();
            } else {
                this.Send();
            }
        },
        Send() {
            var msg = this.text;
            console.log(msg);
            if (socket && msg) {
                socket.emit('chat', msg);                
                this.text = null;
            }
        },
        Chat(msg, user, isSelf = false) {
            vue.chats.push({ type: msgType.chat, message: msg, user: user, isSelf: isSelf });
            window.scrollTo(0, document.body.scrollHeight);
        },
        //deal with message
        Message(msg, user, isSelf = false) {
            console.log(msg, user);
            if (isSelf) {
                msg = 'to ' + user.username + ': ' + msg;
                //set user to self
                user = this.GetUser(socket.id);
            } else {
                icq.play();
            }
            vue.chats.push({ type: msgType.message, message: msg, user: user, isSelf: isSelf });
            window.scrollTo(0, document.body.scrollHeight);
        },
        //send message
        SendMessage() {
            let msg = this.text;
            let user = this.selectedUser;
            if (user) {
                this.Message(msg, user, true);
                socket.emit("message", { msg, to: user.id });
                this.selectedUser = null;
                this.text = null;
            }
        },
        SetName() {
            if (vue.name) {
                //TODO check name
                console.log('Name set: ' + vue.name);
                socket = io({
                    extraHeaders: {
                        "username": vue.name
                    }
                });
                socket.connect();
                this.overlay = false;
            }
            else {
                alert("Please input name");
            }
        },
        GetUser(id) {
            return vue.users.find(x => x.id === id);
        },
        FilterUser() {
            let names = vue.users.map(x => x.username);
            vue.filtered = vue.fixedUser.filter(x => { return !names.includes(x) });
        },
        SelectUser(id) {
            if (id == socket.id) return;
            var user = this.GetUser(id);
            if (user) {
                console.log(user);
                this.selectedUser = user;
            }
        },
        Cancel() {
            this.selectedUser = null;
        },
        Init() {
            socket.on("connection", (socket) => {
                console.log(socket.id);
            });

            socket.on("disconnect", () => {
                //console.log(socket.id); // undefined
            });

            //user list
            socket.on('users', function (list) {
                console.log(list);
                vue.users = list;
                vue.FilterUser();
            });

            socket.on("connect_error", (err) => {
                alert(err.message);
                if (err.message === "invalid username") {
                    console.log(err);
                    alert(err.message);
                }
            });

            socket.on("message", ({ msg, from, to }) => {
                console.log('got message');
                console.log('Message from ' + from + ': ' + msg);
                var user = this.GetUser(from);
                if (user && to==socket.id) {
                    this.Message(msg, user);
                }
            });

            socket.on('board', ({ msg, from }) => {
                console.log("board: [" + from + "]" + msg);
                var user = this.GetUser(from);
                if (user) {
                    this.Chat(msg, user, user.id === socket.id);
                } else if (from===null) {
                    this.Chat(msg, systemUser);
                }
            });
        }
    }
}).mount('#app')