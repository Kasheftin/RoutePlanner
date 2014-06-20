define(["jquery","knockout","eventEmitter","config","layer","toolbar","shape"],function($,ko,EventEmitter,config,Layer,Toolbar,Shape) {
	var Project = function(data) {
		var self = this;
		this.id = ko.observable(data.id);
		this.name = ko.observable(data.name);
		this.description = ko.observable(data.description);
		this.map = data.map;
		this.layers = ko.observableArray([]);
		this.selectedLayer = ko.observable(null);
		this.settings2edit = ko.observable(null);
		this.exportData = ko.observable(null);
		this.q = ko.observable("");
		this.selectedShape = ko.observable(null);
		this.maxContainerHeight = ko.observable();
		this.toolbar = new Toolbar({
			layer: this.selectedLayer,
			map: this.map
		});

		data.layers.forEach(function(layer) {
			var l = self.createLayer(layer);
			self.layers.push(l);
			layer.shapes.forEach(function(shape) {
				if (shape.type == "marker") {
					self.addMarkerToMap({
						lat: shape.data.lat,
						lng: shape.data.lng,
						name: shape.name,
						description: shape.description,
						layer: l,
						toBottom: true
					});
				}
				if (shape.type == "directions") {
					var s = self.addDirectionsToMap({
						name: shape.name,
						layer: l,
						destinations: shape.destinations,
						avoidHighways: shape.avoidHighways,
						avoidTolls: shape.avoidTolls,
						preserveViewport: true,
						toBottom: true
					});
					s.done();
				}
			});
		});
		this.selectedShape(null);

		if (data.selectedLayerId>=0 && this.layers()[data.selectedLayerId]) {
			this.selectedLayer(this.layers()[data.selectedLayerId]);
		}

		this.selectedShape.subscribe(function(shape) {
			shape && shape.emit("deselectShape");
			self.emit("closeInfoWindow");
		},this,"beforeChange");

		this.toolbar.on("addMarker",function(e) {
			self.addMarkerToMap({
				lat: e.latLng.lat(),
				lng: e.latLng.lng(),
				openEditShape: true
			});
		});
		this.toolbar.on("addDirections",function() {
			self.addDirectionsToMap();
		});

		this.dragShapeCallback = function(data) {
			var draggedShape = data.item;
			var layerIndex = $(this).data("layer-index");
			if (draggedShape && layerIndex>=0) {
				draggedShape.layer = self.layers()[layerIndex];
				self.selectedLayer(draggedShape.layer);
			}
		}

		this.descriptionHTML = ko.computed(function() {
			var str = self.description();
			var html = (str||"").replace(/^[\r\n\t]+/,"").replace(/[\r\n\t]+$/,"").replace(/\n/g,"\n<br>\n").replace(/\bhttps?:\/\/[^\s]+/gi,function(v) {
				return "<a target='_blank' href='" + v + "'>" + v.replace(/\bhttps?:\/\//,"") + "</a>";
			});
			return html;
		});

		this.totalDistance = ko.observable();
		this.totalDuration = ko.observable();
		this.totalRecalc = ko.computed(function() {
			var totalDistance = 0;
			var totalDuration = 0;
			self.layers().forEach(function(layer) {
				layer.shapes().forEach(function(shape) {
					if (shape.type()=="directions" && shape.totalDistance()>0)
						totalDistance+=shape.totalDistance();
					if (shape.type()=="directions" && shape.totalDuration()>0)
						totalDuration+=shape.totalDuration();
				});
			});
			var printDistance = function(v) {
				var vKm = Math.floor(v/1000);
				if (vKm > 9) return vKm + " km";
				if (vKm > 0) return Math.floor(v/100)/10 + " km";
				return v + " m";
			}
			var printDuration = function(v) {
				var vHours = Math.floor(v/3600);
				if (vHours > 0) return vHours + " hours " + Math.floor(v%3600/60) + " mins"; 
				return Math.floor(v/60) + " mins";
			}
			self.totalDistance(printDistance(totalDistance));
			self.totalDuration(printDuration(totalDuration));
		});
	}

	Project.prototype.restrictContainerHeight = function(h) {
		console.log("restrictContainerHeight",h);
		if (h>0)
			this.maxContainerHeight((h-50).toString()+"px");
		else
			this.maxContainerHeight("auto");
	}

	Project.prototype.initialize = function(data) {
		if (data.mapPosition) {
			this.emit("setMapPosition",data.mapPosition);
		}
	}

	Project.prototype.addDirectionsToMap = function(options) {
		var self = this;
		if (!options) options = {};
		var layer = options.layer || this.selectedLayer();
		if (!options.destinations) options.destinations = ["",""];
		if (!layer) return;
		var shape = new Shape($.extend({},config.newDirections,{
			map: self.map,
			layer: layer,
			destinations: options.destinations,
			avoidHighways: options.avoidHighways,
			avoidTolls: options.avoidTolls,
			preserveViewport: options.preserveViewport,
			isVisible: layer.isVisible()
		}));
		shape.on("deselectShape",function() {
			shape.editing(false);
		});
		shape.on("deleteShape",function() {
			shape.clear();
			shape.layer && shape.layer.deleteShape(shape);
		});
		layer.addShape(shape,options.toBottom);
		self.selectedShape(shape);
		return shape;
	}

	Project.prototype.addMarkerToMap = function(options) {
		var self = this;
		if (!options) options = {};
		var layer = options.layer || this.selectedLayer();
		if (!layer) return;
		var shape = new Shape($.extend({},config.newMarker,{
			name: options.name,
			description: options.description,
			data: {
				lat: options.lat,
				lng: options.lng
			},
			isVisible: layer.isVisible(),
			map: this.map,
			layer: layer
		}));
		layer.addShape(shape,options.toBottom);
		this.selectedShape(shape);
		shape.on("editShape",function() {
			self.editShape(shape);
		});
		shape.on("showShape",function() {
			self.showShape(shape);
			if (shape.layer) { 
				self.selectedLayer(shape.layer);
			}
		});
		shape.on("deleteShape",function() {
			shape.clear();
			shape.layer && shape.layer.deleteShape(shape);
		});
		shape.redraw();
		if (options.openEditShape) {
			self.editShape(shape);
		}
		if (options.openShowShape) {
			self.showShape(shape);
		}
		return shape;
	}

	Project.prototype.editShape = function(shape) {
		this.selectShape(shape);
		this.emit("openInfoWindow",{
			openAt: shape.model,
			type: "editShape",
			shape: shape
		});
	}

	Project.prototype.showShape = function(shape) {
		this.selectShape(shape);
		this.emit("openInfoWindow",{
			openAt: shape.model,
			type: "showShape",
			shape: shape
		});
	}

	Project.prototype.selectShape = function(shape) {
		this.selectedShape(shape);
	}

	Project.prototype.checkSelectedShapeToBeInSelectedLayer = function() {
		if (this.selectedShape() && this.selectedShape().layer != this.selectedLayer())
			this.selectedShape(null);
	}

	Project.prototype.addLayer = function() {
		var l = this.createLayer(config.newLayer);
		this.layers.unshift(l);
		this.selectedLayer(l);
	}

	Project.prototype.createLayer = function(data) {
		var self = this;
		var l = new Layer(data);
		l.on("destroyLayer",function() {
			if (l == self.selectedLayer()) {
				self.selectedLayer(null);
			}
			if (self.layers().indexOf(l)>=0) {
				self.layers.splice(self.layers().indexOf(l),1);
			}
		});
		l.on("deselectLayer",function() {
			self.selectedLayer(null);
		});
		l.on("selectLayer",function() {
			self.selectedLayer(l);
		});
		return l;
	}

	Project.prototype.selectLayer = function(data) {
		this.selectedLayer(data.isVisible()?data:null);
		this.checkSelectedShapeToBeInSelectedLayer();
	}

	Project.prototype.deselectLayer = function() {
		this.selectedLayer(null);
		this.checkSelectedShapeToBeInSelectedLayer();
	}

	Project.prototype.isLayerSelected = function(data) {
		return this.selectedLayer() == data;
	}

	Project.prototype.editSettings = function() {
		this.settings2edit({
			name: ko.observable(this.name()),
			description: ko.observable(this.description())
		});
	}

	Project.prototype.close = function() {
		this.settings2edit(null);
		this.exportData(null);
	}

	Project.prototype.saveSettings = function() {
		this.name(this.settings2edit().name());
		this.description(this.settings2edit().description());
		this.settings2edit(null);
	}

	Project.prototype.closeProject = function() {
		this.emit("close");
	}

	Project.prototype.toJSON = function() {
		var exportData = {
			id: this.id(),
			name: this.name(),
			description: this.description(),
			layers: []
		}
		this.layers().forEach(function(layer) {
			exportData.layers.push(layer.exportLayer());
		});
		if (this.selectedLayer()) {
			exportData.selectedLayerId = this.layers().indexOf(this.selectedLayer());
		}
		exportData.mapPosition = this.map().getCenter().lat()+","+this.map().getCenter().lng()+","+this.map().getZoom()+","+this.map().getMapTypeId();
		return ko.toJSON(exportData);		
	}

	Project.prototype.exportProject = function() {
		this.exportData(this.toJSON());
	}

	Project.prototype.saveProject = function() {
		this.emit("save");
	}

	$.extend(Project.prototype,EventEmitter.prototype);

	return Project;
});