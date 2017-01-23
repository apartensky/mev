define(["lodash", "jquery", "notific8"], function(_, $, notific8){
    var directive = function(){
        return {
            restrict: "AE",
            controller: ["$scope", function($scope){
                var config = {
                    success: {
                        theme: 'lime'
                    },
                    info: {
                        theme: 'ebony'
                    },
                    error: {
                        theme: 'ruby'
                    }
                }
                var deregisterListener = $scope.$on("mev:alert", function($event, alert){
                    $.notific8(alert.message,
                        _.defaults(                    {
                            heading: alert.heading,
                            life: 5000
                        }, config[alert.level])
                    );
                });
                $scope.$on("$destroy") (function(){
                    deregisterListener()
                });
            }]
        }
    };
    directive.$name="mevNotificAlert";
    directive.$inject=[];
    directive.$provider="directive";
    return directive;
});