var stubApp = angular.module('stubApp', ['LocalStorageModule']);

stubApp.controller('NavbarController', function ($rootScope, $scope, ConfigService) {

    $scope.toggleJSONPreview = function () {
        $scope.jsonPreview = !$scope.jsonPreview;
        ConfigService.set('jsonPreview', $scope.jsonPreview);
        emitJsonPreviewState();
    };

    $scope.createNew = function () {
        $rootScope.$broadcast('createNew');
    };

    $scope.upload = function () {
        console.verbose('work in progress');
    };

    $scope.download = function () {
        console.verbose('work in progress');
    };

    function emitJsonPreviewState() {
        $rootScope.$broadcast('showPreview', $scope.jsonPreview);
    }

    function init() {
        var preview = ConfigService.get('jsonPreview', true);
        console.log(preview);
        $scope.jsonPreview = preview;
    }

    init();

});

stubApp.service('ConfigService', function (localStorageService) {

    function setValue(key, value) {
        localStorageService.set(key, value);
    }

    function getValue(key, defaultValue) {
        console.log(key, defaultValue);
        var value = localStorageService.get(key);
        console.log(typeof value, value);

        if (typeof value !== 'undefined')
            return value;

        return defaultValue;
    }

    return {
        set: setValue,
        get: getValue
    };

});

stubApp.controller('ResponseController', function ($scope, $http, ConfigService) {

    $scope.responses = [];
    $scope.verbs = ['get', 'post', 'put', 'delete'];
    $scope.usageTypes = ['Persistent', 'Single Use'];

    function getFormattedJSON(o) {
        return JSON.stringify(o, null, 4);
    }

    $scope.$on('showPreview', function ($event, isVisible) {
        console.log('showpreview', isVisible);
        $scope.jsonPreview = isVisible;
    });

    $scope.$on('createNew', function ($event) {
        var response = {
            isEditing: true,
            isNew: true,
            method: 'get',
            body: {},
            jsonText: "{}"

        };

        $scope.responses.unshift(response);
    });

    $scope.isEditing = function (response) {
        return response.isEditing;
    };

    $scope.startEditing = function (response) {
        response.isEditing = true;
        //Not really the angular way - but seems to work ;)
        $scope.$$postDigest(function () {
            var el = document.getElementById('editor_' + response.uid);
            console.log(el);
            if (el) {
                el.focus();
            }
        });
    }

    function saveNew(response) {
        //Should probably do a little more validation here ...
        const json = response.jsonText;
        const body = JSON.parse(json);
        response.body = body;
        response.jsonText = getFormattedJSON(body);

        response.isEditing = false;
        response.isNew = false;

        createResponse(response, function (err) {
            if (err) {
                console.error(err);
            }
        });

    }

    function saveExisting(response) {
        // Update body from the json
        const json = response.jsonText;
        const o = JSON.parse(json);

        response.body = o;
        response.jsonText = getFormattedJSON(o);
        response.isEditing = false;

        updateResponse(response, function (err) {
            if (err) {
                console.error(err);
            }
        });
    };

    $scope.promptDelete = function (response) {
        response.confirmDelete = true;
    };

    $scope.cancelDelete = function (response) {
        delete response['confirmDelete'];
    };

    $scope.delete = function (response) {
        const uid = response.uid;
        $http.delete('/__response/' + uid).then(function (result) {
            _.remove($scope.responses, function (response) {
                return uid == response.uid;
            });
        }).catch(function (err) {
            console.error(err);
        })
    };

    function cancelExistingEdit(response) {
        response.isEditing = false;
        loadResponses();
    }

    $scope.jsonBodyKeyDown = function ($event, response) {
        if ($event.keyCode == 27) {
            $scope.cancel(response);
            return;
        }

        if (($event.metaKey || $event.ctrlKey) && $event.keyCode == 13) {
            $scope.save(response);
        }
    };

    $scope.save = function (response) {
        if (response.isNew) {
            saveNew(response);
            return;
        }

        saveExisting(response);
    };

    $scope.cancel = function (response) {
        if (response.isNew) {
            //Remove this from the array
            _.remove($scope.responses, function (eachResponse) {
                return eachResponse.uid == response.uid;
            });

            return;
        }

        // Existing - so cancel
        cancelExistingEdit(response);
    };

    function createResponse(response, cb) {
        var payload = removeClientSideState(response);

        $http.post('/__response', payload).then(function (result) {
            setCssClassName(response);
            cb(null);
        }).catch(function (err) {
            cb(err);
        });
    }

    function removeClientSideState(response) {
        const payload = _.cloneDeep(response);
        delete payload['jsonText'];
        delete payload['cssClassName'];
        return payload;
    }

    function updateResponse(response, cb) {
        var payload = removeClientSideState(response);

        $http.put('/__response', payload).then(function (result) {
            setCssClassName(response);
            cb(null);
        }).catch(function (err) {
            cb(err);
        });
    }

    function setCssClassName(response) {
        switch (response.method) {
            case 'delete':
                response.cssClassName = 'text-danger';
                break;

            case 'get':
                response.cssClassName = 'text-success';
                break;

            default:
                delete response['cssClassName'];
                break;

        }
    }

    function loadResponses() {
        $http.get('/__responses').then(response => {

            const responses = [];
            _.each(response.data, function (response) {
                response.jsonText = getFormattedJSON(response.body);
                response.isEditing = false;
                setCssClassName(response);
                responses.push(response);
            })

            $scope.responses = responses;;

        }).catch(err => {
            console.error(err);
        });
    }

    function restoreDefaults() {
        $scope.jsonPreview = ConfigService.get('jsonPreview', true);
    }

    restoreDefaults();
    loadResponses();

});