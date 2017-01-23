define([], function(){
    var service = function ($rootScope) {
      function raiseAlert(level, message, heading){
        $rootScope.$broadcast("mev:alert", {
          message: message,
          heading: heading,
          level: level
        });
      }
      return {
        success : function (message, header, callback, params) {
          raiseAlert("success", message, header)
        },
        error : function (message, header, callback, params) {
          raiseAlert("error", message, header)
        },
        info : function (message, header, callback, params) {
          raiseAlert("info", message, header)
        }
      };
    }
    service.$inject=["$rootScope"];
    service.$name="mevAlertService";
    service.$provider="service";
    return service;
});