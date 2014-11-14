var _ = require('underscore')
  , fs = require('fs')
var EventEmitter = require('events').EventEmitter;

exports.eventEmitter = new EventEmitter();


var games=[];
var players = [];
var playerToGame = {};

// BLKNODE Settings
// var maxPlayers = 4;
// var boardWidth = 20;
// var boardHeight = 20;
// var names;
// var questions;

// BOOMOIO Settings
var maxPlayers = 6;
var startHand = 7;
var startTime = 60;
var startLives = 5;

// var newBoard = function(){
//     var r = []; while(r.push(null) < boardWidth); // Make a row of 20 0's
//     var a = []; while(a.push(r.slice(0)) < boardHeight); // Make 20 rows
//     return a;
// }

var newDeck = function(){
    // 24 “Ticking Time Bomb” Cards 
    // (with explosions on back) 
    // 10 HOLD
    // 20 Five
    // 20 Ten
    // 6 Reverse
    // 6 Skip
    // 4 Up to 60 Seconds (:60)
    // 4 Go to 30 Seconds (:30)
    // 3 Reset to Zero (:0)
    // 2 Everybody Draw 1 (+1)
    // 2 Everybody Draw 2 (+2)
    // 2 Trade Hands
    // 2 Double Play
    // 3 BOMB
    deck = [
        'HOLD', 'HOLD', 'HOLD', 'HOLD', 'HOLD', 'HOLD', 'HOLD', 'HOLD', 'HOLD', 'HOLD',
        '5','5','5','5','5','5','5','5','5','5','5','5','5','5','5','5','5','5','5','5',
        '10','10','10','10','10','10','10','10','10','10','10','10','10','10','10','10','10','10','10','10',
        'REVERSE','REVERSE','REVERSE','REVERSE','REVERSE','REVERSE',
        'SKIP','SKIP','SKIP','SKIP','SKIP','SKIP',
        ':0',':0',':0',':0',
        ':30',':30',':30',':30',
        ':60',':60',':60',
        'DRAW1','DRAW1',
        'DRAW2','DRAW2',
        'TRADE','TRADE',
        'DOUBLE','DOUBLE',
        'BOMB','BOMB','BOMB'
    ];
    return _.shuffle(deck);
};

var init = function(cb){
    fs.readFile('names.txt', function(err, data) {
        if(err) throw err;
        names = data.toString().split("\n");
    });
};

var newGame = function(cb){
    var game = {
        id:games.length,
        timer:startTime,
        deck:newDeck(),
        discard:[],
        players:[],
        turn:null,
        direction:1,
        state:"prep"
    };
    games.push(game);
    return game;
};

var nextPlayer = function(gameId){
    var game = games[gameId];
    console.log("game", game);
    // Find the current player index
    var currentPlayer = game.players[game.turn];
    // var currentPlayer = _.findWhere(game.players, {id:game.turn});
    var playerIndex = game.players.indexOf(currentPlayer);
    for(var i = 0; i < game.players.length; i++){
        game.turn = (game.turn + game.direction) % game.players.length;
        while (game.turn < 0) game.turn += game.players.length; // How do I loop the number?
        console.log("game.turn",game.turn);
        if(game.players[game.turn].state == 'active') {
            games[gameId] = game;
            return;
        }
    }
    
};

var drawCards = function(game, player, num){
    for(var i=0; i < num; i++)
        player.hand.push(game.deck.pop());

};

exports.playerToGame = function(playerId, cb){
    console.log("playerToGame", playerId, playerToGame[playerId]);
    return playerToGame[playerId];
};

exports.join = function(uuid, cb){
    if(uuid === undefined) {
        cb("UUID not found");
        return;
    }
    var game = _.find(games, function(game){ return game.state == "prep" });
    if(typeof game == "undefined") {
        game = newGame();
        // games.push(game);
    }
    // game.now = new Date().getTime()
    var player = _.findWhere( game.players, {id: uuid} )
    if( typeof player === 'undefined'){
        var player = {
            id: uuid
            , name: names.shift() || uuid
            , hand: [] 
            , lives: startLives
            , state: 'active'
            , position:-1
            , score: 0
        }
        // Take a hand of cards from the deck
        drawCards(game, player, startHand);
        playerToGame[player.id] = game.id;
    }
    if(_.where(game.players, {state:'active'}).length >= maxPlayers) player.state = 'spectating';

    players.push(player); // All players
    game.players.push(player); // Players for the game
    
    cb(null, game);
};

exports.start = function(gameId, cb){
    var game = games[gameId];
    if(!game) return cb("game not found", null);
    // var activePlayers = _.find(game.players, function(player){(player.state=="active")});
    // if(!activePlayers || activePlayers.length < 2) return cb("Not enough players to start", null);
    if(game.players.length < 2) return cb("Not enough players to start", null);
    
    game.state = 'active';
    for( var i in game.players){
        var player = game.players[i];
        if(player.state == 'active'){
            game.turn = i;
            break;
        }
    }
    cb(null, game);
};

exports.leave = function(gameId, uuid, cb){
    var game = games[gameId];
    if(!game) return;
    // Remove their player
    var player = _.findWith(game.players, {id:uuid});
    if(player){
        if(player.state != "spectating") player.state = "disconnect";
        // If only one active player left, end the round
        if(game.state == "active"){
            if(_.where(game.players, {state:'active'}).length <= 1)
                game.state = "ended";
            else {
                while(_.findWhere(game.players, {position:game.turn}).state != 'active'){
                    game.turn = (game.turn + game.direction) % game.players.length;
                }
            }
        } else if(game.state == "prep") {
            // Remove players from games that haven't started
            game.players = _.without(game.players, player);
        }
        cb(null, {players: game.players, state: game.state, turn: game.turn});
    }
    // game.players = _.without(game.players, player)
};

exports.getGame = function(){ return game }

exports.getScores = function(){
    return _.map(game.players, function(val, key){ return { id:val.id, name:val.name, score:val.score }; })
}

exports.getPlayers = function(){ return players }

exports.getPlayer = function(uuid){ return _.find(players, function(player){ return player.id == uuid })}

exports.getState = function(){ return game.state }

exports.getTitle = function(){ return game.title }

exports.getRound = function(){ return game.round }


exports.getWinner = function(){ return game.winner }

exports.getScoreboard = function(){
    return {
        title: game.title
        , scores: _.map(game.players, function(val, key){ return { id:val.id, name:val.name, score:val.score }; })
        , players: game.players.length
    }

}

exports.setName = function(id, name, cb){
    var p = _.find(game.players, function(player){ return player.id == id })
    if(p) p.name = name
    cb(null, { players: game.players })
}

exports.playCard = function(playerId, cardIndex, cb){
    var gameId = playerToGame[playerId];
    var game = games[gameId];
    var player = _.findWhere( game.players, {id: playerId} ); // game.players[id];
    var card = player.hand[cardIndex];

    if(game.state != "active"){
        cb ("The game has not yet started. Get more friends.", null)
        return;
    } 

    else if( game.players[game.turn].id != player.id ){
        cb ("It is not your turn", null)
        return;
    }

    // Make sure the player owns that piece
    if(player.hand.indexOf(card) == -1){
        cb("Player does not have that card", null)
        return;
    }

    // All checks have passed, manipulate the board based on the card
    player.hand.splice(cardIndex, 1);

    switch(card){
        case "HOLD":
            // Business as usual
            break;
        case "5":
            // Subtract 5 from the timer
            game.timer -= 5;
            break;
        case "10":
            // Subtract 10 from the timer
            game.timer -= 10;
            break;
        case "REVERSE":
            // Reverse the order
            game.direction = -1 * game.direction;
            break;
        case "SKIP":
            // Skip the next player
            nextPlayer(game.id);
            break;
        case ":0":
            game.timer = 0;
            break;
        case ":30":
            game.timer = 30;
            break;
        case ":60":
            game.timer = 60;
            break;
        case "DRAW1":
            // Everyone still alive who isn't the current player draws
            for (var i in game.players){
                var p = game.players[i];
                if(p != player && player.state == 'active'){
                    drawCards(game, player, 1);
                }
                game.players[i] = p;
            }
            break;
        case "DRAW2":
            for(var i in game.players){
                var p = game.players[i];
                if(p != player && player.state == 'active'){
                    drawCards(player, 2);
                }
                game.players[i] = p;
            }
            break;
        case "TRADE":
            // Trade hands with a selected player

            break;
        case "DOUBLE":
            // The next person must play a number card, then another card

            break;
        case "BOMB":
            // Each person must play a HOLD from their hand or lose a life
            // If everyone else plays a HOLD, the current player loses a life

            break;
    }

    // Place the card in the discard
    game.discard.push(card);

    // Determine win conditions

    // If a player has a hand of 0 cards, everyone else

    // No winner, advance play
    nextPlayer(game.id);

    cb(null, game);

}

/* BLKNODE functions
function hasFacingTile(game, tile){
    var x = tile.x;
    var y = tile.y;
    console.log("(" + x + "," + y + ")" + (x+y) );

    // Above
    if(y < boardHeight-1 && game.board[x][y+1] === game.turn ) return true;
    // Below
    if(y > 0 && game.board[x][y-1] === game.turn ) return true;
    // Right
    if(x < boardWidth-1 && game.board[x+1][y] === game.turn ) return true;
    // Right
    if(x > 0 && game.board[x-1][y] === game.turn ) return true;
    return false;
}

function findDiagonalConnector(game, tile){
    var x = tile.x;
    var y = tile.y;

    // Starting positions
    if( game.turn == 0 && x == 0             && y == 0 )  return true;
    if( game.turn == 1 && x == boardWidth-1  && y == 0)  return true;
    if( game.turn == 2 && x == boardWidth-1  && y == boardHeight-1  )              return true;
    if( game.turn == 3 && x == 0             && y == boardHeight-1  )              return true;

    // Above right
    if( x < boardWidth-1 && y < boardHeight-1 && game.board[x+1][y+1] === game.turn ) return true;
    // Above left
    if( x > 0 && y < boardHeight-1 && game.board[x-1][y+1] === game.turn ) return true;
    // Below left
    if( x > 0  && y > 0 && game.board[x-1][y-1] === game.turn ) return true;
    // Below right
    if( x < boardWidth-1 && y > 0 && game.board[x+1][y-1] === game.turn ) return true;
    return false;
}
*/

/* BLKNode main function
exports.addPiece = function(gameId, id, placement, piece, cb){
    // cb(err, res)
    var game = games[gameId];
    var player = _.findWhere(game.players, {position:game.turn})

    if(game.state != "active"){
        cb ("The game has not yet started. Get more friends.", null)
        return;
    } 
    else if( player.id !== id ){
        cb ("It is not your turn", null)
        return;
    }

    // Make sure the player owns that piece
    if(player.pieces.indexOf(piece) == -1){
        cb("Player has already used that piece", null)
        return;
    }
    
    // Verify the suggested tile on the board
    var hasDiagonalConnector = false;
    for( var i in placement){
        var tile = placement[i]
        if(typeof tile.x == "undefined" || typeof tile.y== "undefined"){
            cb("Tile does not have a valid x and y coordinate", null)
            return;
        }
        // Check for impossible values
        if( tile.x<0 || tile.y < 0 || tile.x >= boardWidth || tile.y >= boardHeight  ){
            cb("Tile is not on the game board", null)
            return;
        }


        if ( hasFacingTile(game, tile ) == true) {
            cb("This placement has a facing tile at " + tile.x + tile.y, null)
            return;
        };
        hasDiagonalConnector = hasDiagonalConnector || findDiagonalConnector(game, tile);

        // Make sure each position is open
        if(game.board[tile.x][tile.y] !== null){
            cb("This piece is overlapping at " + tile.x + tile.y, null)
            return;
        }

    }
    if ( !hasDiagonalConnector ){
        cb("This placement has no connecting tile diagonal from it", null);
        return;
    }

    // Add the piece to the board
    
    for(var i in placement){
        var position = placement[i];
        var column = game.board[position.x]
        column[position.y] = game.turn;
        // game.board[piece.x][piece.y] = game.turn;
        player.score++;
    }

    // Remove the piece from the user's bag
    player.pieces = _.without(player.pieces, piece)
    if(player.pieces.length == 0){ // Used all pieces
        player.score += 15; // Score bonus
        if(placement.length == 1) player.score += 5; // If the last piece was a monomino
    }
    // player.pieces = _.reject(player.pieces, function(testPiece){
    //     return (_.difference(piece, testPiece).length == 0)
    // }) 

    do{
        game.turn = (game.turn+1) % maxPlayers;
    } while( _.findWhere(game.players, {position:game.turn}).state != "active" )

    cb(null, {board: game.board, players: game.players, turn: game.turn});
}
*/

exports.reset = function(cb){
    init()
    cb(null, game)
}

init()