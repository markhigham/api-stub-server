var stubApp = angular.module("stubApp", ["LocalStorageModule"]);

stubApp.directive("inlineUpload", function () {
  return {
    restrict: "A",
    scope: {
      select: "&onSelect",
    },

    link: function (scope, element, attr) {
      element.bind("change", function () {
        scope.select({ files: element[0].files });
      });
    },
  };
});

stubApp.controller(
  "NavbarController",
  function ($rootScope, $scope, ConfigService, $http) {
    $scope.toggleJSONPreview = function () {
      $scope.jsonPreview = !$scope.jsonPreview;
      ConfigService.set("jsonPreview", $scope.jsonPreview);
      emitJsonPreviewState();
    };

    $scope.clientUpload = function () {
      $("#inlineUpload").click();
    };

    $scope.handleFileSelect = function (files) {
      if (!files.length) return;

      var reader = new FileReader();
      reader.onloadend = function (e) {
        uploadJson(e.target.result)
          .then(function () {
            location.reload();
          })
          .catch(function (err) {
            console.error(err);
            alert("something went wrong check the console");
          });
      };

      reader.readAsText(files[0]);
    };

    function uploadJson(json) {
      return $http.post("/__response/upload", json);
    }

    function emitJsonPreviewState() {
      $rootScope.$broadcast("showPreview", $scope.jsonPreview);
    }

    function init() {
      const preview = ConfigService.get("jsonPreview", true);
      console.log(preview);
      $scope.jsonPreview = preview;

      $http.get("/__info").then((response) => {
        $scope.version = response.data.buildNumber;
        document.title = `${response.data.appName} ${response.data.buildNumber}`;
      });
    }

    init();
  }
);

stubApp.service("ConfigService", function (localStorageService) {
  function setValue(key, value) {
    localStorageService.set(key, value);
  }

  function getValue(key, defaultValue) {
    const value = localStorageService.get(key);
    if (!value) return defaultValue;
    return value;
  }

  return {
    set: setValue,
    get: getValue,
  };
});

stubApp.controller(
  "ResponseController",
  function ($scope, $http, ConfigService) {
    $scope.responses = [];
    $scope.verbs = ["get", "post", "put", "delete", "patch"];
    $scope.usageTypes = ["persistent", "single"];

    function getFormattedJSON(o) {
      return JSON.stringify(o, null, 4);
    }

    $scope.$on("showPreview", function ($event, isVisible) {
      console.log("showpreview", isVisible);
      $scope.jsonPreview = isVisible;
    });

    $scope.purge = function () {
      if (!confirm("Clear everything?")) return;

      $http
        .delete("/__response/")
        .then(function () {
          $scope.responses = [];
        })
        .catch(function (err) {
          console.error(err);
        });
    };

    $scope.createNew = function () {
      var response = {
        isEditing: true,
        usageType: "persistent",
        isNew: true,
        method: "get",
        body: {},
        jsonText: "{}",
      };

      $scope.responses.unshift(response);
    };

    $scope.isEditing = function (response) {
      return response.isEditing;
    };

    $scope.startEditing = function (response) {
      response.isEditing = true;
      //Not really the angular way - but seems to work ;)
      $scope.$$postDigest(function () {
        var el = document.getElementById("editor_" + response.uid);
        if (el) {
          el.focus();
        }
      });
    };

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
    }

    $scope.promptDelete = function (response) {
      response.confirmDelete = true;
    };

    $scope.cancelDelete = function (response) {
      delete response["confirmDelete"];
    };

    $scope.delete = function (response) {
      const uid = response.uid;
      $http
        .delete("/__response/" + uid)
        .then(function (result) {
          _.remove($scope.responses, function (response) {
            return uid == response.uid;
          });
        })
        .catch(function (err) {
          console.error(err);
        });
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

      $http
        .post("/__response", payload)
        .then(function (result) {
          setCssClassName(response);
          cb(null);
        })
        .catch(function (err) {
          cb(err);
        });
    }

    function removeClientSideState(response) {
      const payload = _.cloneDeep(response);
      delete payload["jsonText"];
      delete payload["cssClassName"];
      delete payload["isEditing"];
      delete payload["isNew"];
      return payload;
    }

    function updateResponse(response, cb) {
      var payload = removeClientSideState(response);

      $http
        .put("/__response", payload)
        .then(function (result) {
          setCssClassName(response);
          cb(null);
        })
        .catch(function (err) {
          cb(err);
        });
    }

    function setCssClassName(response) {
      switch (response.method) {
        case "delete":
          // response.cssClassName = 'text-danger';
          break;

        case "get":
          // response.cssClassName = 'text-success';
          break;

        default:
          delete response["cssClassName"];
          break;
      }
    }

    function loadResponses() {
      $http
        .get("/__response")
        .then((response) => {
          const responses = response.data
            .map((response) => {
              response.jsonText = getFormattedJSON(response.body);
              response.isEditing = false;
              setCssClassName(response);

              return response;
            })
            .sort((a, b) => {
              const first = a.url.toLocaleLowerCase();
              const second = b.url.toLocaleLowerCase();

              return first.localeCompare(second);
            });

          $scope.responses = responses;
        })
        .catch((err) => {
          console.error(err);
        });
    }

    function restoreDefaults() {
      $scope.jsonPreview = ConfigService.get("jsonPreview", true);
    }

    restoreDefaults();
    loadResponses();
  }
);
