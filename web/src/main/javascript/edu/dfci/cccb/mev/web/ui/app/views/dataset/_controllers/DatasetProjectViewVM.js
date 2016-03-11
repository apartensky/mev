define(["ng", "lodash"], function(ng, _){ "use strict";
	var DatasetProjectViewVM=function DatasetViewVM($scope, $stateParams, $state, DatasetResourceService, dataset, project, AnalysisEventBus, AnalysisTypes, mevAnalysisTypes,
		mevPathwayEnrichmentAnalysisType, mevGseaAnalysisType, mevPcaAnalysisType, mevHclAnalysisType){
		var that=this;
		console.debug("DatasetProjectViewVM", dataset, project);
		this.project=project;		
		
		this.getProject=function(){
			return project;
		};
		this.getProjectName=function(){
			return project.name;
		};
		
		this.node={nodeName: "Dataset"};
		console.debug("***dataset", dataset, project);
//		this.annotations=annotations;	
		this.analysisTypes = mevAnalysisTypes.all();
		// this.PathwayEnrichmentAnalysisType = mevAnalysisTypes.get("pe");
		this.PathwayEnrichmentAnalysisType = mevPathwayEnrichmentAnalysisType;
		this.GseaAnalsyisType = mevGseaAnalysisType;
		project.generateView({
            viewType:'heatmapView', 
            note: "DatasetProjectViewVM",
            labels:{
                row:{keys:dataset.row.keys}, 
                column:{keys:dataset.column.keys}
            },
            expression:{
                min: dataset.expression.min,
                max: dataset.expression.max,
                avg: dataset.expression.avg,
            }
        });
		
		function isAnalysisInDashbaord(analysis){
			return _.find(project.dataset.dashboardItems, function(item){
				return item.name === analysis.name;
			});
			
		}
		function filterDatasetNames(datasetNames){
			return datasetNames.filter(function(item){
				return item.indexOf(that.parentDatasetName)===0;
			});
		}
		function switchDataset(){
			$state.go("root.dataset.home", {datasetId: that.curDatasetName});
		}
		DatasetResourceService.getAll();
		that.curDatasetName = dataset.id;		
		that.parentDatasetName = dataset.id.split("--")[0];
		that.switchDataset=switchDataset;
		$scope.$on("mev:datasets:list:refreshed", function($event, data){			
			that.datasetNames = filterDatasetNames(data);
		});

		$scope.$on("ui:projectTree:nodeSelected", function($event, node){
			// that.node=node;			
			
			// var params = node.nodeConfig.state.getParams(node);
			// if(node.nodeParent && node.nodeParent.nodeConfig){
			// 	ng.extend(params, node.nodeParent.nodeConfig.state.getParams(node.nodeParent));
			// }
			
			// var targetState = "root"+node.nodeConfig.state.name;
			// console.debug("ui:projectTree:nodeSelected $on", $event, node, $state, params, targetState);			
			// $state.go(targetState, params);
			if(node.nodeData.params && mevAnalysisTypes.all()[node.nodeData.params.analysisType])
				$state.go("root.dataset.analysisType"+"."+node.nodeData.params.analysisType, 
					{datasetId: node.nodeData.params.datasetName, analysisId: node.nodeData.name});
			else
				node.activate();
		});
		
		AnalysisEventBus.onAnalysisStarted($scope, function(type, name, data){
			console.debug("DatasetProjectViewVM onAnalysisStarted");
			var analysis = data.response;
			dataset.analyses.push(analysis);
			$scope.$broadcast("ui:projectTree:dataChanged");
		});
		
		AnalysisEventBus.onAnalysisSuccess($scope, function(type, name, data){
//			dataset.loadAnalyses().then(function(response){
				var analysis = data.response;
				var found = _.findIndex(dataset.analyses, function(analysis){ return analysis.name===name; });
				if(found > -1){
					dataset.analyses[found] = analysis;					
				}else {					
					dataset.analyses.push(analysis);
				}
				
//				if(!analysis.params)
//					analysis.params=data;
				
				console.debug("DatasetProjectViewVM onAnalysisSuccess", type, name, analysis);	
				if(isAnalysisInDashbaord(analysis))
					console.debug("dashbaord: analysis is in dashbaord - Refresh!!");
//				else
//					$state.go("root.dataset.analysis", {analysisType: AnalysisTypes.reverseLookup[type], analysisId: name});
				$scope.$broadcast("ui:projectTree:dataChanged");
//			});			
        });
        AnalysisEventBus.onAnalysisFailure($scope, function(type, name, data){
				var analysis = data.response;
				var found = _.findIndex(dataset.analyses, function(analysis){ return analysis.name===name; });
				if(found > -1){
					dataset.analyses[found] = analysis;					
				}else {					
					dataset.analyses.push(analysis);
				}
				$scope.$broadcast("ui:projectTree:dataChanged");
//			});			
        });
		AnalysisEventBus.onAnalysisLoadedAll($scope, function(){
			console.debug("DatasetProjectViewVM onAnalysisLoadedAll");	
			$scope.$broadcast("ui:projectTree:dataChanged");			
		});
		
		$scope.$on('SeletionAddedEvent', function(event, dimensionType){
      	    dataset.resetSelections(dimensionType);      	        	  
         });
		
		_.forEach(project.dataset.dashboardItems, function(item){
			if(item.launch && 
			!_.find(project.dataset.analyses, function(analysis){return analysis.name === item.launch.analysisName;})){
				var params = _.extend(item.launch, {datasetName: project.dataset.datasetName});
				console.debug("dashbaord: launching", item, params);
				project.dataset.analysis.put(params, {});
			}
		});

	};
	DatasetProjectViewVM.$inject=["$scope", "$stateParams", "$state", "DatasetResourceService", "dataset", "project", "AnalysisEventBus", "AnalysisTypes", "mevAnalysisTypes", 
	"mevPathwayEnrichmentAnalysisType", "mevGseaAnalysisType", "mevPcaAnalysisType", "mevHclAnalysisType"];
	return DatasetProjectViewVM;
});
