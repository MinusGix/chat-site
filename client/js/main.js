var ws = new WebSocket('ws://127.0.0.1:8080');

var YOU = {};
function connect(channel) {

    ws.onmessage = function(message) {
        console.log(message.data);
        var args = JSON.parse(message.data);
        var cmd = args.cmd.toLowerCase();
        if (COMMANDS[cmd] !== undefined) {
            COMMANDS[cmd](args);
        }
    };
    ws.onopen = function(data) {
        //console.log(data);
        var nameyname = prompt('Name: ');
        console.log(nameyname);
        if(typeof(nameyname) === 'number'){ //just in case
            nameyname = '' + nameyname + ''; //turn it into a string.
        }
        if(nameyname === undefined || nameyname === '' || nameyname === null || nameyname === NaN){
            alert('Your name is not allowed to be blank.');
        }else if(!(/^[a-zA-Z0-9_]{1,24}$/.test(nameyname))){
            alert('Please remove anything that is not a letter, number or underscore.');
        }else{
            send({
                cmd: 'join',
                name: nameyname,
                room: channel.replace(/\?/, '')
            });
        }

    };
    ws.onclose = function(data) {
        console.log('Connection closed reason: ' + data.reason + '\nCode: ' + data.code);
        $('#userlist > p[usernick="' + YOU.name.toLowerCase() + '"]').remove();

    };
    ws.onerror = function(data) {
        console.log(data);
    };
    o_wsend = ws.send;
    ws.send = send;
}

function send(msg) {
    msg.DATA = {};
    msg.DATA.name = YOU.name;
    msg.DATA.room = YOU.room;
    o_wsend.call(ws, JSON.stringify(msg));
}
var COMMANDS = {
    chat: function(args){
        console.log(args);
        addText(args.from, args.text);
    },
    ping: function(args) {
        if (args.ask !== undefined) {
            if (args.ask.toLowerCase() === 'name') {
                send({
                    cmd: 'data',
                    name: prompt('What is your name: ')
                });
            }
        }
    },
    info: function(args) {
        if (args.text === 'connected') {
            console.log('You connected.');
            console.log(args);
            Object.defineProperty(YOU, 'name', {
                value: args.name,
                writable: false,
                enumerable: true,
                configurable: false
            });
            Object.defineProperty(YOU, 'room', {
                value: args.room,
                writable: false,
                enumerable: true,
                configurable: false
            });
            setInterval(function() {
                send({
                    cmd: 'ping',
                    data: 'alive'
                });
            }, 10000);
            var aTextVariable = 'Current online users: ';
            for(var i = 0; i < args.users.length; i++){
                $('#userlist').append('<p usernick="' + args.users[i].toLowerCase() + '">' + args.users[i] + '</p>');

                aTextVariable += args.users[i] + ', ';
                if(i === (args.users.length-1)){
                    aTextVariable += YOU.name + '.';
                }
            }
            addText('*', aTextVariable);
            $('#userlist').append('<p usernick="' + YOU.name.toLowerCase() + '">' + YOU.name + '</p>');

        }else if(args.text === 'userjoined'){
            console.log(args);
            addText('*', args.name + ' joined!');
            $('#userlist').append('<p usernick="' + args.name.toLowerCase() + '">' + args.name + '</p>');
        }else if(args.text === 'userleft'){
            console.log(args);
            addText('*', args.name + ' left!');
            $('#userlist > p[usernick="' + args.name.toLowerCase() + '"]').remove();
        }
    },
    error: function(args) {
        alert(args.text);
        console.log('error');
        console.log(args.text);
    },
    update: function(args) {

    }
};
function sendText(){
    if($('#chatbox').val().length > 1040){//maxlength
        alert('Please shorten your message by: ' + ($('#chatbox').val().length-1040) + ' letters.');
        return;
    }
    send({
        cmd: 'chat',
        text: $('#chatbox').val()
    });
    $('#chatbox').val('');
}
function addText(username, text){
    $('#chat').append('<div class="message' + ((username === '*') ? ' server':'') + ((username.toLowerCase() === YOU.name.toLowerCase()) ? ' me':'') + '">' +
    '<span class="nick"></span>' +
    '<span class="text"></span>' +
    '</div>');

    $('#chat > .message:nth-child(' + $('#chat > .message').length + ')')
        .children('span.nick').text(username + ' ')
        .parent()
        .children('span.text').text(text)
        .html($('#chat > .message:nth-child(' + $('#chat > .message').length + ')').children('span.text').html().replace(/\n/g, '<br>'));
}
$('html').on('keydown', function(e){
    console.log(e);
    if(e.which === 13 && !e.shiftKey){//enter
        if($('#chatbox').is(':focus')){
            e.preventDefault();
            sendText();
        }
    }else if(e.which === 13 && e.shiftKey){//shift+enter

    }
});
if(window.location.search === ''){
    window.location.search = '?programming';
}else{
    connect(window.location.search);
}
