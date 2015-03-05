define(["ng"], function(ng){
	var DatasetProjectViewVM=function DatasetViewVM($scope, $stateParams, $state, dataset, project, AnalysisEventBus, AnalysisTypes){
		that=this;
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
		
		$scope.$on("ui:projectTree:nodeSelected", function($event, node){
			that.node=node;			
			
			var params = node.nodeConfig.state.getParams(node);
			if(node.nodeParent && node.nodeParent.nodeConfig){
				ng.extend(params, node.nodeParent.nodeConfig.state.getParams(node.nodeParent));
			}
			
			var targetState = "root"+node.nodeConfig.state.name;
			console.debug("ui:projectTree:nodeSelected $on", $event, node, $state, params, targetState);			
			$state.go(targetState, params);
		});
		
		AnalysisEventBus.onAnalysisSuccess($scope, function(type, name, data){
			dataset.loadAnalyses().then(function(){
				console.debug("DatasetProjectViewVM onAnalysisSuccess", type, name, data);				
				$state.go("root.dataset.analysis", {analysisType: AnalysisTypes.reverseLookup[type], analysisId: name});
			});			
        });
		AnalysisEventBus.onAnalysisLoadedAll($scope, function(){
			$scope.$broadcast("ui:projectTree:dataChanged");			
		});
	};
	DatasetProjectViewVM.$inject=["$scope", "$stateParams", "$state", "dataset", "project", "AnalysisEventBus", "AnalysisTypes"];
	return DatasetProjectViewVM;
});