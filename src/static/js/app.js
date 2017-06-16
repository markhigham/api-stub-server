var stubApp = angular.module('stubApp', []);

stubApp.controller('ResponseController', function ($scope, $http) {

    $scope.showResponseDetails = function(response){
        $scope.selectedResponse = response;
    }

    $http.get('/__responses').then(response => {
        $scope.responses = response.data;

    }).catch(err => {
        console.error(err);
    });

});