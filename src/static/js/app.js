var stubApp = angular.module('stubApp', []);

stubApp.controller('ResponseController', function ($scope, $http) {

    let currentResponse;

    $scope.verbs = ['GET', 'POST', 'PUT'];

    function getFormattedJSON(o) {
        return JSON.stringify(o, null, 4);
    }

    $scope.isEditing = function (response) {
        return currentResponse == response;
    };

    $scope.startEditing = function (response) {
        currentResponse = response;
        $scope.selectedResponse = response;
        $scope.editing = true;
    }

    $scope.endEditingAndSave = function () {
        // Update body from the json
        const json = $scope.selectedResponse.jsonText;
        const o = JSON.parse(json);

        $scope.selectedResponse.body = o;
        $scope.selectedResponse.jsonText = getFormattedJSON(o);

        updateResponse($scope.selectedResponse, function (err) {
            if (err) {
                console.error(err);
            }
            currentResponse = undefined;
        });
    };

    $scope.toggleJSONPreview = function () {
        console.log('yay');
        $scope.jsonPreview = !$scope.jsonPreview;
    };

    $scope.delete = function (response) {
        var payload = { uid: response.uid };
        $http.delete('/__response', payload).then(function (result) {
            //yay
        }).catch(function (err) {
            console.error(err);
        })
    };

    $scope.cancelEditing = function () {
        currentResponse = undefined;
        loadResponses();
    }

    function updateResponse(response, cb) {
        const payload = _.cloneDeep(response);
        delete payload['jsonText'];
        $http.post('/__response', payload).then(function (result) {
            cb(null);
        }).catch(function (err) {
            cb(err);
        });

    }

    function loadResponses() {
        $http.get('/__responses').then(response => {

            const responses = [];
            _.each(response.data, function (response) {
                response.jsonText = getFormattedJSON(response.body);
                responses.push(response);
            })

            $scope.responses = responses;;

        }).catch(err => {
            console.error(err);
        });
    }

    loadResponses();

});