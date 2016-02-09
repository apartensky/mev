"use strict";
define(["angular", "d3", "lodash", "crossfilter"], function(angular, d3, _, crossfilter){	
	var ScatterPlotDirective = function ScatterPlotDirective(){
		return {
			restrict: "EC",
			scope: {
				inputData: "=",
				labelX: "=",
				labelY: "=",
				logScaleX: "=",
				logScaleY: "=",
				zoomEnabled: "&",
				useCrossfilter: "@"
			},
			controller: "scatterCtrl",
			template: "<nvd3 options='options' data='data' config='config' api='api'></nvd3>",
			link: function(scope, elm, attrs, ctrl){				
				var _self = this;
				scope.api=undefined;
				scope.config={
					// deepWatchDataDepth: 0,
					// refreshDataOnly: false
					// debounce: 100
				};
				scope.zoomEnabled = scope.zoomEnabled || true;
				scope.vm = {
					refresh: function(){
						scope.api.updateWithOptions(getOptions());
						// scope.api.refrsh();
					},
					getZoomEnabled: function (){
						return scope.zoomEnabled();
					}
				};
				var _svg, _brush, _chart;
				function _addBrush(){
					if(_svg && _brush)
						// if(_svg.selectAll(".brush").size()===0)
						_svg.selectAll(".brush").remove();
						_svg.insert('g', ":first-child")
						.attr('class', 'brush')					
						.call(_brush);
				}
				
				if(scope.inputData === "random"){					
					scope.inputData = ctrl.generateData(2,3);					
				}	
				var xf, xfxDim, xfyDim;			
				function setData(newData){
					scope.data = newData;	
					var values = _.flatten(_.map(scope.data, function(series){
						return series.values;
					}));
					if(scope.useCrossfilter){
						xf = crossfilter(values);
						xfxDim = xf.dimension(function(d) { return d.x; });
	    				xfyDim = xf.dimension(function(d) { return d.y; });	
					}					
				}

				
				scope.options = getOptions();
				scope.$watch("inputData", function(newVal){										
					// scope.api.updateWithOptions(getOptions());
					if(newVal){
						setData(scope.inputData);
						console.debug("domain data", scope.inputData);
						scope.options = getOptions();						
					}					
				});

				scope.$watch("logScaleX", function(newVal, oldVal){					
					if(typeof newVal !== "undefined" && typeof oldVal !== "undefined"){
						scope.options = getOptions();
						// scope.api.updateWithOptions(scope.options);
					}
				});

				scope.$watch("logScaleY", function(newVal, oldVal){					
					if(typeof newVal !== "undefined" && typeof oldVal !== "undefined"){
						scope.options = getOptions();
						// scope.api.updateWithOptions(scope.options);
					}
				});

				scope.$watch(function(){return scope.zoomEnabled();}, function(newVal, oldVal){					
					if(typeof newVal !== "undefined" && typeof oldVal !== "undefined"){
						scope.options = getOptions();
						scope.api.updateWithOptions(scope.options);
						// scope.api.updateWithOptions(scope.options);
					}
				});

				function updateOptions(){
					scope.options = getOptions();
				}


				function getDomain(dim){
					var theDomain = [Infinity, -Infinity];
					if(scope.inputData){						
						_.map(scope.inputData, function(group){
							var domain = d3.extent(group.values, function(d){
		                    	return d[dim];
		                    });
							theDomain[0] = theDomain[0]>domain[0] ? domain[0] : theDomain[0];
							theDomain[1] = theDomain[1]<domain[1] ? domain[1] : theDomain[1];
						});						
						console.debug("theDomain "+dim, theDomain);
						return theDomain.map(function(v){
							if(dim==="x" && scope.logScaleX)
								return Math.abs(v) * 1.1;
							else if(dim==="y" && scope.logScaleY)
								return Math.abs(v) * 1.1;
							else
								return v * 1.1;
						});
					}
				}


				function getScale(isLog){
					if(isLog)
						return d3.scale.log();
					else 
						return d3.scale.linear();
				}
				
				function getValue(dim, isLog){
					if(isLog)
						return function(d){
							return Math.abs(d[dim]);
						};
					else 
						return function(d){
							return d[dim];
						};					
				}

				function getOptions(){
					return {
						chart: {
			                type: 'scatterChart',
			                showVoronoi: false,
			                interactive: true,
			                pointSize: 64,
			                pointScale: d3.scale.identity(),			                
			                callback: function(chart){
			                	// console.debug("chart", chart);                	
			                	chart.dispatch.on('renderEnd', function(){
			                		_chart = chart;                    	
			                        // console.log('render complete', arguments, chart);
			                        
			                        var svgDom = angular.element("svg");
			                		console.debug(".nvd3-svg", svgDom.height());
			                		
			                		_svg = d3.select(".nvd3.nv-wrap.nv-scatter");
			                		console.debug("_svg", _svg);
			                		
			                		//define brush
			                		_brush = d3.svg.brush()
			                	    .x(chart.scatter.xScale())
			                	    .y(chart.scatter.yScale());
			                		
			                		//add brush (only if graph is in unclickable mode)
			                		//~ if(!_chart.interactive())
			                		if(!scope.zoomEnabled())
			                			_addBrush();
			                		
			                		var selection = [];
			                		function raiseEventSelectionUpdated(selection){
			                			scope.$apply(function(){
			        	        			scope.$emit("mev.scatterPlot.selection", _.clone(selection, true));
										});
			                		}
			                		function clearSelection(){
			                			var node = _svg.selectAll('.nv-group > path.nv-point');
				                		console.debug("node", node);                    		
				            			node.classed("selected", false);
			                			selection.length=0;
			                		}
			                		function getBrushExtent(){
			                			var extent = _brush.extent();
			                			extent.x = [extent[0][0], extent[1][0]];
			                			extent.y = [extent[0][1], extent[1][1]];

			                			return extent;
			                		}
			                		function updateSelection(){
						                			
			                			var extent = getBrushExtent();
			                			

			                			if(scope.useCrossfilter){
											xfxDim.filterRange(extent.x);
			                				xfyDim.filterRange(extent.y);
			                				selection = xfxDim.top(Infinity);	
										}else{
											var node = _svg.selectAll('.nv-group > path.nv-point');		            			
					                		console.debug("node", node.size(), node);                    						            			
											var count = 0;
					            			node.classed("selected", function(d){
			//		            				console.debug("d", d, d.length);
												console.debug("count", count++, d, d.length);
					            				if(d.length===2){	            	
					            					var datum = d[0];
					            					var x = _chart.x()(datum);
					            					var y = _chart.y()(datum);
					            					var select = extent[0][0] <= x && x < extent[1][0] &&				            					
					            					extent[0][1] <= y && y < extent[1][1];	            					
					            					if(select){		            						
					            						// console.debug("selected x range", extent[0][0],  x, extent[1][0]);
					            						// console.debug("selected y range", extent[0][1], y, extent[1][1]);
					            						// console.debug("selected", select);
					            						selection.push(datum);
					            					}else{
														// console.debug("not x range", extent[0][0],  x, extent[1][0]);
					         //    						console.debug("not  y range", extent[0][1], y, extent[1][1]);
					            					}
					            					return select;
					            				}else{
													console.debug("bad datum", d, d.length);
					            					return false;
					            				}
					            				
					            			});
										}
			                			// selection = xfSelection;			                			
			                			// console.debug("brushend selection", selection);
										raiseEventSelectionUpdated(selection);
			                		}

			                		function getSelectedData(){

			                		}
			                		
			                		_brush.on('brush', function() {
		//	                			console.debug("brush", _brush.extent(), arguments);
		//	                		    var extent = _brush.extent(),
		//	                		        xExtent = [extent[0][0], extent[1][0]],
		//	                		        yExtent = [extent[0][1], extent[1][1]];
		//	                		    xDim.filterRange(xExtent);
		//	                		    yDim.filterRange(yExtent);
		//	                		    updateDots();
		//	                			updateSelection();
			                		});
			                		_brush.on('brushstart', function(){
			                			console.debug("brushstart", _brush.extent(), arguments);			                			
			                			//chart.interactive(false);
				            			clearSelection();				            			
			                		});
			                		_brush.on('brushend', function(){
			                			console.debug("brushend", _brush.extent(), arguments);
			                			updateSelection();
										
		//	                			updateSelection(selection);
				            			//chart.interactive(true);
			                		});
		   	  
			                    });
			                	                	
			                },
			                height: 450,
			                color: d3.scale.category10().range(),
		//	                pointSize: function(d){
		//	                	console.debug("pca.pointSize", d);
		//	                	return 32;
		//	                },							
			                scatter: {								
			                	x: getValue("x", scope.logScaleX),
								y: getValue("y", scope.logScaleY),
			                    xScale: getScale(scope.logScaleX),
			                	yScale: getScale(scope.logScaleY),
			                	forceX: getDomain("x"),
			                	forceY: getDomain("y"),
			                    onlyCircles: true,	                    	                    
			                    dispatch: {
			                    	elementClick: function(){
			                    		console.debug("click", arguments);
			                    	},
			                    	brushend: function(){
			                    		console.debug("brush", arguments);
			                    	}
			                    },
			                    // xDomain: [_.min(scope.data[0].values, function(v){return v.x}), _.max(scope.data[0].values, function(v){return v.x})],
			                 //		xDomain: getDomain("x"),//.map(function(d){ return Math.log(Math.abs(d));}),
			                 //		yDomain: getDomain("y"),//.map(function(d){ return Math.log(Math.abs(d));})
			                },	 
			                //tooltip: {
			                //	contentGenerator: function (obj) {
			                // 		console.debug("tooltip", obj, _chart);			                		
			                // 		return obj.point.id + "<br>" +
			                // 		_chart.xAxis.axisLabel() + ": " + obj.point.x + "<br>" +
			                // 		_chart.yAxis.axisLabel() + ": " + obj.point.y + "<br>" + 
			                // 		"Group: " + obj.series[0].key + "<div class='series-color' style='background-color: "+obj.series[0].color+";'></div>";
			                //	}
			                //},	
			                tooltip: {
			                	contentGenerator: function(d) {
			                		// Format function for the tooltip values column.
								    var valueFormatter = function(d, i) {
								        return _chart.xAxis.axisLabel() + ": " + d;
								    };

								    // Format function for the tooltip header value.
								    var headerFormatter = function(d) {
								        return _chart.yAxis.axisLabel() + ": " + d;
								    };

								    var keyFormatter = function(d, i) {
								        return d;
								    };

							        if (d === null) {
							            return '';
							        }

							        var table = d3.select(document.createElement("table"));
						            var theadEnter = table.selectAll("thead")
						                .data([d])
						                .enter().append("thead");

						            theadEnter.append("tr")
						                .append("td")
						                .attr("colspan", 3)
						                .append("strong")
						                .classed("id", true)
						                .html(d.point.id);

						            theadEnter.append("tr")
						                .append("td")
						                .attr("colspan", 3)
						                .classed("x-value", true)
						                .html(headerFormatter(d.series[0].value));
						        

							        var tbodyEnter = table.selectAll("tbody")
							            .data([d])
							            .enter().append("tbody");

							        var trowEnter = tbodyEnter.selectAll("tr")
							                .data(function(p) { return p.series;})
							                .enter()
							                .append("tr")
							                .classed("highlight", function(p) { return p.highlight;});

							        trowEnter.append("td")
							            .classed("legend-color-guide",true)
							            .append("div")
							            .style("background-color", function(p) { return p.color;});

							        trowEnter.append("td")
							            .classed("key",true)
							            .classed("total",function(p) { return !!p.total;})
							            .html(function(p, i) { return keyFormatter(p.key, i);});

							        trowEnter.append("td")
							            .classed("value",true)
							            .html(function(p, i) { return valueFormatter(d.value, i);});

							        trowEnter.selectAll("td").each(function(p) {
							            if (p.highlight) {
							                var opacityScale = d3.scale.linear().domain([0,1]).range(["#fff",p.color]);
							                var opacity = 0.6;
							                d3.select(this)
							                    .style("border-bottom-color", opacityScale(opacity))
							                    .style("border-top-color", opacityScale(opacity))
							                ;
							            }
							        });

							        var html = table.node().outerHTML;
							        if (d.footer !== undefined)
							            html += "<div class='footer'>" + d.footer + "</div>";
							        return html;
							    }
			                },
			                showDistX: true,
			                showDistY: true,
			                duration: 350,
			                xAxis: {
			                    axisLabel: scope.labelX,
			                    tickFormat: function(d){
			                        return d3.format('.02f')(d);
			                    }
			                },
			                yAxis: {
			                    axisLabel: scope.labelY,
			                    tickFormat: function(d){
			                        return d3.format('.02f')(d);
			                    },
			                    axisLabelDistance: -5
			                },
			                padData: false,
			                zoom: {
			                    //NOTE: All attributes below are optional
			                    enabled: scope.zoomEnabled(),
			                    scaleExtent: [1, 10],
			                    useFixedDomain: false,
			                    useNiceScale: false,
			                    horizontalOff: false,
			                    verticalOff: false,
			                    unzoomEventType: 'dblclick.zoom'
			                }
			            }
					};
				}
			}
		};
	};
	ScatterPlotDirective.$inject=[];
	ScatterPlotDirective.$name="mevScatterPlot";
	ScatterPlotDirective.$provider="directive";
	ScatterPlotDirective.provider="directive";				
	return ScatterPlotDirective;
});