var WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({
        port: 8080
    });

var clients = {};
var rooms = {};

function Room(name) {
    this.name = name;
    this.users = [];
}

function User(name, modoradmin, ws) {
    this.name = name;
    this.modoradmin = modoradmin;
    this.ws = ws;
    // 0 is normal users
    // 1 is mod
    // 2 is admin
}

function sendAll(room, data) {

    //console.log('bloop');
    for (var i = 0; i < rooms[room.toLowerCase()].users.length; i++) {
        //console.log(rooms[room.toLowerCase()].users[i]);
        send(rooms[room.toLowerCase()].users[i].ws, data);
    }

}
var COMMANDS = {
    chat: function(args, ws) {
        if (args.text === undefined || args.text === '') {
            send(ws, {
                cmd: 'error',
                text: 'chat error: text is empty'
            });
            return;
        }


        //console.log(args);
        /*send(ws, {
            text: args.text,
            from: args.DATA.name
        });*/
        if (args.text.length > 1040) {

        } else {
            sendAll(args.DATA.room, {
                cmd: 'chat',
                text: args.text,
                from: args.DATA.name
            });
        }

    },
    update: function(args, ws) {

    },
    join: function(args, ws) {
        if (args.name === undefined || args.name === '') {
            send(ws, {
                cmd: 'error',
                text: 'join error: name is undefined or blank.'
            });
            return;
        }
        var nameyname = args.name;
        if (typeof(nameyname) === 'number') { //just in case
            nameyname = '' + nameyname + ''; //turn it into a string.
        }
        if (nameyname === undefined || nameyname === '' || nameyname === null || nameyname === NaN) {
            //alert('Your name is not allowed to be blank.');
        } else if (!(/^[a-zA-Z0-9_]{1,24}$/.test(nameyname))) {
            //alert('Please remove anything that is not a letter, number or underscore.')
        } else {

            var name = args.name;
            var allowed = true;
            var room = args.room;
            if (rooms[room.toLowerCase()] === undefined) {
                rooms[room.toLowerCase()] = new Room(room.toLowerCase());
            } else {
                for (var i = 0; i < rooms[room.toLowerCase()].users.length; i++) {
                    if (rooms[room.toLowerCase()].users[i].name === undefined) {
                        continue;
                    }
                    if (args.name.toLowerCase() === rooms[room.toLowerCase()].users[i].name.toLowerCase()) {
                        allowed = false;
                    }
                }
            }


            if (allowed) {
                var usersArr = [];
                for (var oo = 0; oo < rooms[room.toLowerCase()].users.length; oo++) {
                    usersArr.push(rooms[room.toLowerCase()].users[oo].name);
                }
                send(ws, {
                    cmd: 'info',
                    text: 'connected',
                    name: name,
                    room: room,
                    users: usersArr
                });

                console.log('client joined');

                sendAll(room, {
                    cmd: 'info',
                    text: 'userjoined',
                    name: name
                });
                ws.on('close', function() {
                    for (var o = 0; o < rooms[this.room.toLowerCase()].users.length; o++) {
                        console.log(rooms[this.room.toLowerCase()].users[o]);
                        console.log('-------');
                        console.log(this.name);
                        if (this.name.toLowerCase() === rooms[this.room.toLowerCase()].users[o].name.toLowerCase()) {
                            console.log('&&&&&&&&&&&&&&');
                            sendAll(this.room, {
                                cmd: 'info',
                                text: 'userleft',
                                name: rooms[this.room.toLowerCase()].users[o].name
                            });
                            rooms[this.room.toLowerCase()].users.splice(o, 1);
                        }
                    }
                }.bind({
                    name: name,
                    room: room,
                    ws: ws
                }));
                rooms[room.toLowerCase()].users.push(new User(name, 0, ws));
                ws.on('message', function(data) {
                    var args = JSON.parse(data);
                    var cmd = args.cmd.toLowerCase();
                    if (COMMANDS[cmd] !== undefined) {
                        COMMANDS[cmd](args, ws);
                    }
                });
            } else {
                send(ws, {
                    cmd: 'error',
                    text: 'join error: that name is already taken.'
                });
                return;
            }
        }
    },
    ping: function(args, ws) {
        //they are alive
    }
};

setInterval(function() {

}, 3000);
wss.on('connection', function(ws) {

    console.log('client connected');



    ws.on('message', function(data) {

        //console.log('received: %s', data);
        var args = JSON.parse(data);
        var cmd = args.cmd.toLowerCase();
        if (cmd === 'join') {
            COMMANDS[cmd](args, ws);
        }
    });
});
wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {

        client.send(JSON.stringify(data));
    });
};


function send(WSO, msg) {
    if (WSO === undefined) {
        return;
    }
    WSO.send(JSON.stringify(msg), function(er) {
        console.log(er);
    });
}
