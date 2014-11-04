
// Socket.io
var socket = io.connect('http://localhost:3000');
console.log("id", socket);

// Angular
angular.module('boomioApp', [])
    .controller('GameCtrl', ['$scope', function($scope) {
        $scope.playerName = "Alex";

        $scope.loadGame = function(gameData){
            $scope.game = gameData;
            console.log("Game is now", $scope.game);
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

        socket.on('game', function(gameData){
            console.log("gameData received");
            $scope.loadData(gameData);
        });
    
        socket.emit('join', function(data){
            // Join the game, get our player id back
            console.log("joined", data);
            $scope.loadGame(data.game);
            $scope.loadPlayer(data.player);
            // player = data.player;
        });
    }]);
    