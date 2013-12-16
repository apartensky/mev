define(
		[ 'angular', 'd3' ],
		function(angular, d3) {

			return angular
					.module('myApp.services', [])
					.value('appVersion', '0.1')
					.value('appName', 'MEV: Multi-Experiment Viewer')
					.factory('mainMenuBarOptions', [ function() {
						return [ {
							value : "About",
							url : "#"
						}, {
							value : "Contact",
							url : "#"
						} ];
					} ])
					.factory('analysisOptions', function() {

					})
					.factory(
							'pseudoRandomStringGenerator',
							function() {

								return function(length) {

									var text = "";
									var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

									for ( var i = 0; i < length; i++) {
										text += possible.charAt(Math.floor(Math
												.random()
												* possible.length));
									}

									return text;

								}

							})
					.factory(
							'alertService',
							[ function() {

								return {
									success : function(message, header,
											callback, params) {

										alert(header + '\n' + message);
										// Fix this later with something
										// interesting

									},
									error : function(message, header, callback,
											params) {

										alert(header + '\n\n' + 'Issue: \n'
												+ message);
										// Fix this later with something
										// interesting

									}
								};

							} ])
					.factory('heatmapGenerator', [ function() {
						return null;
					} ])
					.factory('QHTTP', [ '$http', '$q', function($http, $q) {

						return function(params, callback_fn, error_fn) {
							var deferred = $q.defer();

							$http(params).success(function(data, status) {

								deferred.resolve(callback_fn(data, status));

							}).error(function(data, status) {

								deferred.reject(error_fn(data, status));

							});

							return deferred.promise;
						};

					} ])
					.factory(
							'API',
							[
									'QHTTP',
									'alertService',
									function(QHTTP, alertService) {

										return {

											user : {
												datasets : {
													get : function() {
														// Pulls list of
														// Datasets for the user
														var params = {
															method : 'GET',
															url : '/dataset?format=json'
														};
														return QHTTP(
																params,
																function(d, s) {
																	return d;
																},
																function(d, s) {
																	var message = "Could not pull your dataset list If "
																			+ "problem persists, please contact us."

																	var header = "Could Not Pull List Of Datasets (Error Code: "
																			+ s
																			+ ")"
																	alertService
																			.error(
																					message,
																					header);
																});

													}
												}
											},
											dataset : {
												get : function(url) {
													// Pulls specific dataset
													// with given name
													var params = {
														method : 'GET',
														url : '/dataset/'
																+ url
																+ '/data'
																+ '?format=json'
													};

													return QHTTP(
															params,
															function(d, s) {
																return d;
															},
															function(d, s) {
																var message = "Could not pull dataset "
																		+ url
																		+ ". If "
																		+ "problem persists, contact us."

																var header = "Could Not Pull Dataset (Error Code: "
																		+ s
																		+ ")"
																alertService
																		.error(
																				message,
																				header);
															});

												},
												analysis : {
													list : function(url) {
														// Pulls previous
														// analysis list for
														// given heatmap
														var params = {
															method : 'GET',
															url : '/dataset/'
																	+ url
																	+ '/analysis'
																	+ '?format=json'
														};

														return QHTTP(
																params,
																function(d, s) {
																	return d;
																},
																function(d, s) {
																	var message = "Could not pull dataset "
																			+ url
																			+ "'s previous "
																			+ "analysis. If problem persists, contact us."

																	var header = "Could Not Pull Dataset Analysis List (Error Code: "
																			+ s
																			+ ")"
																	alertService
																			.error(
																					message,
																					header);
																});

													}

												},
											},
											analysis : {
												hcl : {
													update : function(q) {
														// Updates dataset's
														// reordering using
														// clustering order
														var params = {
															method : 'POST',
															url : '/dataset/'
																	+ q.dataset
																	+ '/analysis/'
																	+ q.name
																	+ '?format=json'
														};

														return QHTTP(
																params,
																function(d, s) {
																	return d;
																},
																function(d, s) {
																	var message = "Could not pull HCL analysis "
																			+ q.name
																			+ ". "
																			+ "If problem persists, contact us."

																	var header = "Could Not Pull Previous Analysis (Error Code: "
																			+ s
																			+ ")"
																	alertService
																			.error(
																					message,
																					header);
																});

													},
													get : function(q) {
														// Pulls previous
														// analysis by name
														// q.name
														var params = {
															method : 'GET',
															url : '/dataset/'
																	+ q.dataset
																	+ '/analysis/'
																	+ q.name
																	+ '?format=newick'
														};

														return QHTTP(
																params,
																function(d, s) {
																	return d;
																},
																function(d, s) {
																	var message = "Could not pull HCL analysis "
																			+ q.name
																			+ ". "
																			+ "If problem persists, contact us."

																	var header = "Could Not Pull Previous Analysis (Error Code: "
																			+ s
																			+ ")"
																	alertService
																			.error(
																					message,
																					header);
																});

													},
													create : function(q) {
														// Create a new HCL
														// analysis

														var params = {

															method : 'POST',
															url : 'dataset/'
																	+ q.dataset
																	+ '/analyze/hcl/'
																	+ q.name
																	+ '('
																	+ q.dimension.value
																	+ ','
																	+ q.metric
																	+ ','
																	+ q.algorithm
																	+ ')',
															callback : q.callback

														};

														return QHTTP(
																params,
																function(d, s) {
																	alertService
																			.success(
																					name
																							+ ' clustering complete.',
																					'Clustering Complete');
																	params
																			.callback();
																},
																function(d, s) {
																	var message = "Could not begin analysis on "
																			+ q.dataset
																			+ ". If "
																			+ "problem persists, please contact us."

																	var header = "Could Not Start Clustering (Error Code: "
																			+ s
																			+ ")"
																	alertService
																			.error(
																					message,
																					header);
																});

													}
												}
											}
										}

									} ]);

		});