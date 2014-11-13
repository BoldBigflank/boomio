
// Socket.io
var socket = io.connect('http://localhost:3000');
console.log("id", socket);

// Angular
angular.module('boomioApp', [])
    .controller('GameCtrl', ['$scope', function($scope) {
        $scope.playerId = 0;

        $scope.loadGame = function(gameData){
            $scope.game = gameData;
            console.log("Game is now", $scope.game);
            for( var x in $scope.game.players){
                p = $scope.game.players[x];
                if(p.id == $scope.playerId){
                    $scope.player = p;
                }
            }
            $scope.$digest();
        };

        $scope.loadPlayer = function(playerData){
            $scope.player = playerData;
            console.log("Player is now", $scope.player);
            $scope.$digest();
        };
    
        // Used to iterate each life
        $scope.range = function(n) {
            return new Array(n);
        };

        $scope.startGame = function(){
            console.log("startGame");
            socket.emit('start', function(err, game){
                    console.log(err, game);

            });
        };

        $scope.playCard = function(i){
            // Get the card
            var card = $scope.player.hand[i];
            console.log("Play card", i, card);
            socket.emit('playCard', {card:i}, function(err, game){
                if(err) console.log(err);
                else $scope.loadGame(game);
            });
            
        };
    
        socket.emit('join', function(data){
            // Join the game, get our player id back
            console.log("joined", data);
            $scope.playerId = data.player.id;
            $scope.loadGame(data.game);
            // $scope.loadPlayer(data.player);
        });

        socket.on('game', function(gameData){
            console.log("gameData received");
            $scope.loadGame(gameData);
        });
    }]);