
app.controller("thingController", function ($scope, WoTService) {
	$scope.baseurl = "http://localhost/CNB/H110/RoomAutomation/";
	$scope.tdurl = $scope.baseurl + ".td";

	$scope.readTD = function () {
	    WoTService.readJsonData($scope.tdurl, $scope.tdurl, readTDCallback);
	}

	$scope.readInteraction = function (interaction) {
	    var href = $scope.thing.uris[1] + "/" + interaction.hrefs[1];
	    WoTService.readJsonData(href, interaction, readDataCallback);
	}

	function readTDCallback(data, tag) {
	    $scope.thing = data;
	    for (var i = 0; i < $scope.thing.properties.length; i++) {
	        var property = $scope.thing.properties[i];
	        if (property.valueType['$ref']) {
	            property.schema = {"value":"unresolved"};
	        }
	    }           

		var contexts = $scope.thing['@context'];

		for (var c = 0; c < contexts.length; c++) {
		    var context = contexts[c];
		    var props = Object.keys(context);
		    if (props.length == 1) {
		        var url = context[props[0]];
		        WoTService.readJsonData(url, props[0], readContextCallback);
		    }
		}	

		/*var promises = jsonld.promises;
		var promise = promises.expand(data);
		promise.then(function(expanded) {
		    console.log(expanded[0]);
		    $scope.expandedThing = expanded[0];
		}, function(err) {console.log(err);})
        */
	}

	var recursiveResolveSchemaType = function recursiveResolveSchemaType(type, namespace, schemaData) {
	    if(type['$ref']){
	        var referredSchema = type['$ref'];
	        var parts = referredSchema.split(":");
	        var prefix = parts[0];
	        var typename = parts[1];
	        if (referredSchema.startsWith("#/")) {
	            prefix = namespace;
	            typename = referredSchema.split("/")[1];
	        }
	        if(prefix == namespace){
	            if (schemaData[typename]) {
	                var containedType = schemaData[typename];
	                if (containedType.properties) {
	                    for (var p in containedType.properties) {
	                        var t = containedType.properties[p];
                            if(t['$ref'])
	                            containedType.properties[p] = recursiveResolveSchemaType(t, namespace, schemaData);
	                    }
	                }                  
	                return containedType;
	            }
	            else {
	                return "Error!";
	            }
	        } else {
	            return null;
	        }
	    }
	    else{
	        return type;
	    }
	} 

	function readContextCallback(data, ns) {
	    //console.log(data);
	    for (var i = 0; i < $scope.thing.properties.length; i++) {
	        var p = $scope.thing.properties[i];
	        var vt = p.valueType;
	        var resolvedType = recursiveResolveSchemaType(vt, ns, data);
            if(resolvedType)
	            p.schema = resolvedType;
	        p.model = {};
	    }
	    for (var i = 0; i < $scope.thing.actions.length; i++) {
	        var a = $scope.thing.actions[i];
	        var vt = a.inputData.valueType;
	        var resolvedType = recursiveResolveSchemaType(vt, ns, data);
	        if (resolvedType)
	            a.schema = resolvedType;
	        a.model = {};
	    }
	    for (var i = 0; i < $scope.thing.events.length; i++) {
	        var e = $scope.thing.events[i];
	        var vt = e.inputData.valueType;
	        var resolvedType = recursiveResolveSchemaType(vt, ns, data);
	        if (resolvedType)
	            e.schema = resolvedType;
	        e.model = {};
	    }
	}
	
	function readDataCallback(data, interaction) {
		//console.log(data);
	    interaction.value = data;
	    interaction.model = data;
	}		
});


app.service('WoTService', ['$http', '$q', function($http, $q){

	this.readJsonData = function readJsonData(url, tag, callback) {
		$http.get(url).then( function (res) {
			callback(res.data, tag);
		});
	}

	this.putJsonData = function putJsonData(url, value, tag, callback) {
	    $http.put(url, value).then(function (res) {
	        callback(res, tag);
	    });
	}

	this.postJsonData = function postJsonData(url, value, tag, callback) {
	    $http.post(url, value).then(function (res) {
	        callback(res, tag);
	    });
	}
}]);

app.controller('FormController', function ($scope, WoTService) {
    $scope.schema = {
        type: "object",
        properties: {
            name: { type: "string", minLength: 2, title: "Name", description: "Name or alias" },
            title: {
                type: "string",
                enum: ['dr', 'jr', 'sir', 'mrs', 'mr', 'NaN', 'dj']
            }
        }
    };


    $scope.form = [
      "*",
      {
          "type": "submit",
          "style": "btn-info",
          "title": "Write"
      }
    ];

    $scope.model = {};

    function putDataCallback(res, property) {
        console.log(res);
        property.updateResponse = res.statusText;
        //property.value = data;
    }

    $scope.onSubmit = function (form, property) {
        // First we broadcast an event so all fields validate themselves
        $scope.$broadcast('schemaFormValidate');

        if (form.$valid) {
            console.log(property.model);
            var href = $scope.thing.uris[1] + "/" + property.hrefs[1];
            WoTService.putJsonData(href, property.model, property, putDataCallback);
        }
    }
});