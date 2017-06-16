var stubApp = angular.module('stubApp', []);

stubApp.controller('ResponseController', function ($scope, $http) {

    $scope.editing = false;

    const previousValues = {};

    $scope.verbs = ['GET', 'POST', 'PUT'];

    $scope.showResponseDetails = function (response) {
        response.jsonText = JSON.stringify(response.body, null, 4);

        previousValues.url = response.url;
        previousValues.method = response.method;
        previousValues.body = response.body;

        $scope.selectedResponse = response;
    }

    $scope.startEditing = function () {
        $scope.editing = true;
    }

    $scope.endEditingAndSave = function(){
        $scope.editing = false;
    };

    $scope.cancelEditing = function () {
        
        $scope.editing = false;
        if(!$scope.selectedResponse)
            return;

        $scope.selectedResponse.method = previousValues.method;
        $scope.selectedResponse.url = previousValues.url;
        $scope.selectedResponse.body = previousValues.body;
    }

    $http.get('/__responses').then(response => {
        $scope.responses = response.data;

    }).catch(err => {
        console.error(err);
    });

});