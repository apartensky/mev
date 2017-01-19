define(["lodash"], function(_){
    var SelectionRest = function ($resource, $routeParams, $http, datasetResource, $rootScope, $q, mevWorkspace, mevDb) {

        var resource = $resource('/dataset/:datasetName/:dimension/selection', {
            'format': 'json'
        }, {
            'getAll': {
                'url': '/dataset/:datasetName/:dimension/selections',
                'method': 'GET'
            },
            'get': {
                'method': 'GET',
                'url': '/dataset/:datasetName/:dimension/selection/:selectionName'
            },
            'post': {
                'method': 'POST',
                'url': "/dataset/:datasetName/:dimension/selection/",
            },
            'put': {
                'method': 'PUT',
                'url': "/dataset/:datasetName/:dimension/selection/",
            },
            'export': {
                'method': 'POST',
                'url': "/dataset/:datasetName/:dimension/selection/export",
            },
            'delete': {
                'method': 'DELETE',
                'url': '/dataset/:datasetName/:dimension/selection/:selectionName'
            }

        });

//    	return resource;
        var SelectionResource = Object.create(resource);
        SelectionResource.post = function (params, data, callback) {
            var result = resource.post(params, data, callback);
            result.$promise.then(function (response) {
                $rootScope.$broadcast("mui:dataset:selections:added", params.dimension, params, data, response);
            });
            return result;
        };
        SelectionResource.put = function (params, data, callback) {
            var result = resource.put(params, data, callback);
            result.$promise.then(function (response) {
                $rootScope.$broadcast("mui:dataset:selections:added", params.dimension, params, data, response);
            });
            return result;
        };
        SelectionResource.getAll = function (params, callback) {
            var deferred = $q.defer();
            var cache = {
                $promise: deferred.promise,
                $resolved: false
            };
            mevWorkspace.getDataset(params.datasetName)
                .then(function (dataset) {
                    if (dataset && dataset.isActive) {
                        return resource.getAll(params).$promise
                            .then(function (response) {
                                return response.selections.map(function (selection) {
                                    selection.type = params.dimension;
                                    return selection;
                                });
                            });
                    } else {
                        return [];
                    }
                })
                .then(function (remote) {
                    return mevDb.getDataset(params.datasetName)
                        .catch(function(e){
                            if(e.status === 501)
                                return undefined;
                            else
                                throw e;
                        })
                        .then(function (dataset) {
                            var remoteAndLocal = dataset
                                ? _.unionBy(
                                remote,
                                dataset[params.dimension].selections,
                                function (selection) {
                                    return selection.name;
                                })
                                : remote;
                            if(callback)
                                callback({selections: remoteAndLocal})
                            deferred.resolve(remoteAndLocal);
                            return remoteAndLocal;
                        })
                })
                .catch(function (e) {
                    console.error("Error fetching selection list: ", params, e);
                    deferred.reject(e);
                    throw e;
                });

            return cache;
        };
        SelectionResource.export = function (params, data, callback) {
            data.name = params.datasetName + "--" + data.name;
            var result = resource.export(params, data, callback);
            result.$promise.then(function (response) {
                $http({
                    method: "POST",
                    url: "/annotations/" + params.datasetName + "/annotation/row"
                    + "/export?destId=" + data.name
                });
                $http({
                    method: "POST",
                    url: "/annotations/" + params.datasetName + "/annotation/column"
                    + "/export?destId=" + data.name
                });
                datasetResource.getAll();
            })
        }
        SelectionResource.delete = function(params, data, callback){
            var deferred = $q.defer();
            var cache = {
                $promise: deferred.promise,
                $resolved: false
            };
            mevWorkspace.getDataset(params.datasetName)
                .then(function (dataset) {
                    if (dataset && dataset.isActive) {
                        return resource.delete(params, data, callback).$promise
                            .then(function (response) {
                                return response;
                            })
                            .catch(function(e){
                                if(e.status === 404)
                                    return e;
                                else
                                    throw e;
                            });
                    } else {
                        return {
                            status: 200
                        };
                    }
                })
                .then(function (remote) {
                    if(remote.status && (remote.status===200 || remote.status===404))
                        return mevDb.getDataset(params.datasetName)
                            .then(function (dataset) {
                                _.remove(dataset[params.dimension].selections, function(selection){
                                    return selection.name===params.selectionName;
                                });
                                return mevDb.putDataset(dataset)
                                    .then(function(local){
                                        if(callback)
                                            callback(remote)
                                        deferred.resolve(remote);
                                        return remote;
                                    });
                            })
                    else {
                        throw new Error("Failed to delete selection");
                    }
                })
                .then(function(response){
                    $rootScope.$broadcast("mui:dataset:selections:deleted", params.dimension, params, response);
                })
                .catch(function (e) {
                    console.error("Error fetching selection list: ", params, e);
                    deferred.reject(e);
                    throw e;
                });
            return cache;
        };
        return SelectionResource;
    }
    SelectionRest.$inject=['$resource', '$routeParams', '$http', 'mevDatasetRest', '$rootScope',
        '$q', 'mevWorkspace', 'mevDb'];
    SelectionRest.$name="mevSelectionRest";
    SelectionRest.$provider="service";
    return SelectionRest;

});