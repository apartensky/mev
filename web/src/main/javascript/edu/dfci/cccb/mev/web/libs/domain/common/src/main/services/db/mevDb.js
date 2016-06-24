define(["lodash", "pouchdb"], function(_, PouchDB){"use strict";
    var service = function mevDbService(mevContext){
        var db = new PouchDB("mev", {adapter: 'worker'});
        function ensureDataset(){
            var dataset = mevContext.get("dataset");
            if(!dataset)
                throw new Error("Could not locate dataset for current context: "  + JSON.stringify(mevContext));
            return dataset;
        }
        function getDataset(datasetId){
            return db.get(datasetId);
        }
        function putDataset(dataset){
            return getDataset(dataset.id)
                .catch(function(e){
                    if(e.status === 404)
                        return _.assign(dataset, {
                          _id: dataset.id
                        });
                    else
                        throw new Error("Error updating db" + JSON.stringify(e));
                })
                .then(function(doc){
                    dataset._id = dataset.id;
                    dataset._rev = doc._rev;
                    var clean = JSON.parse(JSON.stringify(dataset));
                    clean.$promise = undefined;
                    clean._annotations = undefined;
                    clean.values=[];
                    clean.analyses=[];
                    return db.put(clean);
                })
                .catch(function(e){
                    if(e.status===409)
                        putDataset(dataset);
                    else{
                        console.error("Error saving dataset locally:", e, dataset);
                        throw e;
                    }
                })
        }
        function getDatasets(){
            // return db.allDocs({startKey: "dataset::", endKey: "dataset::\uFFFF;"});
            return db.allDocs().then(function(result){
                return _.uniq(result.rows.map(function(doc){
                    return doc.id.split("/")[0];
                }));
            });
        }
        function formatDocId(path, datasetId){
            datasetId = datasetId
                ? datasetId
                : ensureDataset().id;
            path = _.isArray(path)
                ? path.join("/")
                : path
            return datasetId + "/" + path;
        }
        function getDatasetValues(datasetId){
            return db.getAttachment(formatDocId("values", datasetId), "all");
        }
        function getDatasetValues64(datasetId){
            return db.getAttachment(formatDocId("values64", datasetId), "chunk0");
        }
        function putDatasetValues(blob){
            var doc = {
                _id: formatDocId("values"),
                _attachments: {
                    "all": {
                        data: blob,
                        type: "application/octet-stream",
                        content_type : "application/octet-stream"
                    }
                }
            };
            db.put(doc);
        }
        function getAnalyses(datasetId){
            return db.allDocs()
                .then(function(result){
                    return result.rows.filter(function(doc){
                        return doc.id.indexOf(formatDocId(["analysis"], datasetId))>-1;
                    });
                })
                .then(function(docs){
                    return docs.map(function(doc){
                        return doc.id.replace(formatDocId(["analysis"], datasetId), "").replace("/", "");
                    });
                });
            // db.get(formatDocId(["analysis"], datasetId))
            //     .then(function(docs){
            //         return docs.map(function(doc){
            //             return doc.name;
            //         });
            //     });
        }
        function getAnalysis(datasetId, analysisId){
            return db.get(formatDocId(["analysis", analysisId], datasetId));
        }
        function putAnalysis(datasetId, analysis){
            return getAnalysis(datasetId, analysis.name)
                .catch(function(e){
                    if(e.status === 404)
                        return _.assign(analysis, {
                            _id: formatDocId(["analysis", analysis.name], datasetId)
                        });
                    else
                        throw new Error("Error putting analysis" + JSON.stringify(e));
                })
                .then(function(doc){
                    analysis._rev = doc._rev;
                    return db.put(JSON.parse(JSON.stringify(analysis)));
                })
                .catch(function(e){
                    if(e.status===409)
                        putAnalysis(datasetId, analysis);
                    else{
                        console.error("Error saving analysis locally:" , datasetId, analysis, e);
                        throw e;
                    }
                });

        }
        function putAnnotations(datasetId, dimension, blob){
            var doc = {
                _id: formatDocId(["annotations", dimension], datasetId),
                _attachments: {
                    "all": {
                        data: blob,
                        type: "application/octet-stream",
                        content_type : "application/octet-stream"
                    }
                }
            };
            db.put(doc)
                .catch(function(e){
                    if(e.status===409)
                        putAnnotations(datasetId, dimension, blob);
                    else
                        throw e;
                });
        }
        function getAnnotations(datasetId, dimension){
            return db.getAttachment(formatDocId(["annotations", dimension], datasetId), "all");
        }
        return {
            getDataset: getDataset,
            putDataset: putDataset,
            getDatasets: getDatasets,
            getDatasetValues: getDatasetValues,
            putDatasetValues: putDatasetValues,
            getDatasetValues64: getDatasetValues64,
            getAnalysis: getAnalysis,
            putAnalysis: putAnalysis,
            getAnalyses: getAnalyses,
            putAnnotations: putAnnotations,
            getAnnotations: getAnnotations
        }
    };

    service.$name="mevDb";
    service.$provider="service";
    service.$inject=["mevContext"];
    return service;
});