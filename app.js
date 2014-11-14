var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var boomo = require('./game.js');

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
    console.log("connection", socket.id);

    //socket.set('uuid', uuid);
    socket.on('connect', function(cb){
        // This is automatic when a socket connects
        // We don't use this because the client might not be ready to accept data
    });

    // User Joins
    socket.on('join', function(cb){
        // This is called manually when the client has loaded
        console.log("Player joined");
        boomo.join(socket.id, function(err, res){
            if (err) { socket.emit("alert", err); }
            else{
                socket.join(res.id);
                console.log("emitting to", res.id);
                io.to(res.id).emit('game', res );
            }
          cb({game: res, player: boomo.getPlayer(uuid) });

        });
    });

    // Player calls to start the game
    socket.on('start', function(cb){
        var gameId = boomo.playerToGame(socket.id);
        boomo.start(gameId, function(err, game){
            if(!err) {
                console.log("Starting game", gameId);
                io.to(gameId).emit('game', game);
            }
            return cb(err, game);
        });

    });

    // User Leaves
    socket.on('disconnect', function(){
        var gameId = boomo.playerToGame(socket.id);
        boomo.leave(socket.id, function(){

        });
        console.log("Player left", socket.id);
    });

    // User chooses a name
    socket.on('name', function(data, cb){
        boomio.setName(socket.id, data.name, cb)
    });

    socket.on('onHover', function(data){
        // Let the other players know what card they're hovering over

    })

    // User plays a card
    socket.on('playCard', function(data, cb){
        console.log("playCard");
        boomo.playCard(socket.id, data.card, function(err, game){
            if(!err) io.to(game.id).emit('game', game);
            cb(err);
        });
    });

});