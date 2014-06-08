define(["jquery","knockout","gmaps","eventEmitter","config","layer","toolbar","shape","destination"],function($,ko,gmaps,EventEmitter,config,Layer,Toolbar,Shape,Destination) {

	var Shape = function(options) {
		var self = this;

		this.name = ko.observable(options.name);
		this.description = ko.observable(options.description);
		this.type = ko.observable(options.type);
		this.icon = ko.observable(options.icon);
		this.isVisible = ko.observable(options.isVisible);
		this.data = options.data || {};
		this.layer = options.layer || null;
		this.map = options.map;

		if (this.type() == "directions") {
			this.destinations = ko.observableArray([]);
			this.editing = ko.observable(options.editing);
			this.preserveViewport = options.preserveViewport;
			this.totalDistance = ko.observable(0);
			this.totalDuration = ko.observable(0);
			this.avoidHighways = ko.observable(options.avoidHighways);
			this.avoidTolls = ko.observable(options.avoidTolls);

			this.toggleAvoidHighways = function() {
				self.avoidHighways(!self.avoidHighways());
			}
			this.toggleAvoidTolls = function() {
				self.avoidTolls(!self.avoidTolls());
			}
			this.totalDistancePrint = ko.computed(function() {
				var v = self.totalDistance();
				var vKm = Math.floor(v/1000);
				if (vKm > 9) return vKm + " km";
				if (vKm > 0) return Math.floor(v/100)/10 + " km";
				return v + " m";
			});
			this.totalDurationPrint = ko.computed(function() {
				var v = self.totalDuration();
				var vHours = Math.floor(v/3600);
				if (vHours > 0) return vHours + " hours " + Math.floor(v%3600/60) + " mins"; 
				return Math.floor(v/60) + " mins";
			});
			this.paramsPrint = ko.computed(function() {
				var ar = [];
				ar.push(self.totalDistancePrint());
				ar.push(self.totalDurationPrint());
				ar.push(self.avoidHighways()?"no hways":"");
				ar.push(self.avoidTolls()?"no tolls":"");
				return ar.filter(function(str) { return str.length>0}).join(", ");
			});
			this.generateShapeName = function() {
				var l = self.destinations().length;
				if (l>=2) {
					var firstName = self.destinations()[0].name();
					var lastName = self.destinations()[l-1].name();
					self.name(firstName && lastName ? firstName + " - " + lastName:"");
				}
				else
					self.name("");
			}
			this.addDestination = function(destinationName) {
				var d = new Destination(destinationName);
				d.on("change",self.generateShapeName);
				self.destinations.push(d);
			}
			this.removeDestination = function(destination) {
				var i = self.destinations().indexOf(destination);
				if (i>=0) self.destinations.splice(i,1);
			}
			this.editDirections = function() {
				self.editing(true);
			}
			this.buildDirections = function(callback) {
				var ar = self.destinations();
				var ar1 = [];
				for (var i = 1; i < ar.length-1; i++)
					ar1.push({location:ar[i].name()});
				console.log("buildDirections, destinations.length=",self.destinations().length);
				var directionsService = new gmaps.DirectionsService();
				directionsService.route({
					origin: ar[0].name(),
					destination: ar[ar.length-1].name(),
					waypoints: ar1,
					travelMode: gmaps.TravelMode.DRIVING,
					avoidHighways: self.avoidHighways(),
					avoidTolls: self.avoidTolls()
				},function(response,status) {
					if (status == gmaps.DirectionsStatus.OK) {
						self.data = response;
						var totalDistance = 0;
						var totalDuration = 0;
						response.routes.forEach(function(route) {
							route.legs.forEach(function(leg) {
								totalDistance+=leg.distance.value;
								totalDuration+=leg.duration.value;
							});
						});
						self.totalDistance(totalDistance);
						self.totalDuration(totalDuration);
					}
					else {
						console.error("gmaps.DirectionsService error",response,status);
					}
					self.directionsDataIsReady = true;
					callback && callback();
				});
			}
			this.done = function() {
				if (self.isVisible()) {
					self.buildDirections(function() {
						self.redraw();
					});
				}
				self.editing(false);
			}
			options.destinations.forEach(function(destinationName) {
				self.addDestination(destinationName);
			});
			this.generateShapeName();
		}
	}

	Shape.prototype.redraw = function() {
		this.clear();
		if (!this.isVisible()) return;
		this.draw();
	}

	Shape.prototype.clear = function() {
		if (this.model) {
			this.model.setMap(null);
			delete this.model;
		}
		if (this.directionsModel) {
			this.directionsModel.setMap(null);
			delete this.directionsModel;
		}
		if (this.modelDragendListener) {
			gmaps.event.removeListener(this.modelDragendListener);
			delete this.modelDragendListener;
		}
		if (this.modelClickListener) {
			gmaps.event.removeListener(this.modelClickListener);
			delete this.modelClickListener;
		}
	}

	Shape.prototype.draw = function() {
		var self = this;
		if (this.type() == "marker" && this.map() && this.data.lat && this.data.lng) {
			this.model = new gmaps.Marker({
				position: new gmaps.LatLng(this.data.lat,this.data.lng),
				map: this.map(),
				draggable: true
			});
			this.modelDragendListener = gmaps.event.addListener(this.model,"dragend",function() {
				var position = self.model.getPosition();
				self.data.lat = position.lat();
				self.data.lng = position.lng();
			});
			this.modelClickListener = gmaps.event.addListener(this.model,"mousedown",function() {
				self.emit("showShape");
			});
		}
		if (this.type() == "directions" && this.map()) {
			var callback = function() {
				self.directionsModel = new gmaps.DirectionsRenderer();
				if (self.preserveViewport) self.directionsModel.setOptions({preserveViewport:self.preserveViewport});
				self.directionsModel.setMap(self.map());
				self.directionsModel.setDirections(self.data);				
			}
			if (this.directionsDataIsReady) callback();
			else this.buildDirections(callback);
		}
	}

	Shape.prototype.hide = function() {
		if (this.type() == "marker" && this.model) {
			this.model.setMap(null);
		} 
		if (this.type() == "directions" && this.directionsModel) {
			this.directionsModel.setMap(null);
		}
	}

	Shape.prototype.show = function() {
		if (!this.map()) return;
		if (this.type() == "marker") {
			this.model ? this.model.setMap(this.map()) : this.redraw();
		}
		if (this.type() == "directions") {
			if (this.directionsModel) {
				this.directionsModel.setOptions({
					preserveViewport: true
				});
				this.directionsModel.setMap(this.map());				
			}
			else {
				this.preserveViewport = true;
				this.redraw();
			}
		}
	}

	Shape.prototype.deleteShape = function() {
		this.emit("deleteShape");
	}

	Shape.prototype.exportShape = function() {
		var exportData = {
			name: this.name(),
			description: this.description(),
			type: this.type()
		}
		if (this.type() == "marker") {
			exportData.data = {lat:this.data.lat,lng:this.data.lng};
		}
		if (this.type() == "directions") {
			exportData.destinations = [];
			this.destinations().forEach(function(destination) {
				exportData.destinations.push(destination.name());
			});
			exportData.avoidHighways = this.avoidHighways();
			exportData.avoidTolls = this.avoidTolls();
		}
		console.log("exportData",exportData);
		return exportData;
	}

	$.extend(Shape.prototype,EventEmitter.prototype);

	return Shape;
});