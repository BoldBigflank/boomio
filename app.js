var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var game = require('./game.js');

var port = process.env.PORT || 3000;
server.listen(port);

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

// Socket variables
var availableUUID = 1;

io.on('connection', function (socket) {
  // socket.emit('news', { hello: 'world' });
  // socket.on('my other event', function (data) {
  //   console.log(data);
  // });

    // No persistence
    uuid = socket.id;
    console.log("id", socket.id);

    //socket.set('uuid', uuid);
    socket.on('connect', function(cb){
        // This is automatic when a socket connects
        // We don't use this because the client might not be ready to accept data
    });

    // User Joins
    socket.on('join', function(cb){
        // This is called manually when the client has loaded
        console.log("Player joined");
        game.join(socket.id, function(err, res){
            if (err) { socket.emit("alert", err); }
            else{
                socket.join(res.id);
                console.log("emitting to", res.id);
                socket.to(res.id).emit('game', res );
            }
          cb({game: res, player: game.getPlayer(uuid) });

        });
    });

    // Player calls to start the game
    socket.on('start', function(){
        game.start(game.playerToGame[socket.id]);

    });

    // User Leaves
    socket.on('disconnect', function(){

    });

    // User chooses a name
    socket.on('name', function(data){

    });

    // 

});