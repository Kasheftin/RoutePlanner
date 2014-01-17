define(["jquery","knockout","eventEmitter","config","layer","toolbar","shape"],function($,ko,EventEmitter,config,Layer,Toolbar,Shape) {
	var Project = function(data) {
		var self = this;
		this.name = ko.observable(data.name);
		this.description = ko.observable(data.description);
		this.map = data.map;

		this.layers = ko.observableArray([]);
		data.layers.forEach(function(layer) {
			self.layers.push(self.createLayer(layer));
		});

		this.selectedLayer = ko.observable(null);
		if (data.selectedLayerId>=0 && this.layers()[data.selectedLayerId]) {
			this.selectedLayer(this.layers()[data.selectedLayerId]);
		}

		this.settings2edit = ko.observable(null);
		this.exportData = ko.observable(null);

		this.q = ko.observable("");

		this.selectedShape = ko.observable(null);

		this.toolbar = new Toolbar({
			layer: this.selectedLayer,
			map: this.map
		});
		this.toolbar.on("addMarker",function(e) {
			if (!self.selectedLayer()) return;
			var shape = new Shape($.extend({},config.newMarker,{
				data: {
					lat: e.latLng.lat(),
					lng: e.latLng.lng()
				},
				isVisible: true,
				map: self.map,
				layer: self.selectedLayer()
			}));
			self.selectedLayer().addShape(shape);
			self.selectedShape(shape);
			shape.on("editShape",function() {
				self.editShape(shape);
			});
			shape.on("deleteShape",function() {
				shape.clear();
				shape.layer && shape.layer.deleteShape(shape);
			});
			shape.redraw();
			self.editShape(shape);
		});


		this.dragShapeCallback = function(data) {
			var draggedShape = data.item;
			var layerIndex = $(this).data("layer-index");
			if (draggedShape && layerIndex>=0)
				draggedShape.layer = self.layers()[layerIndex];
			console.log(draggedShape.layer,layerIndex);
		}
	}


	Project.prototype.addToMap = function(place) {
		var self = this;
		if (!this.selectedLayer()) return;
		console.log("place",place);
		var shape = new Shape($.extend({},config.newMarker,{
			name: place.name,
			description: place.description,
			data: {
				lat: place.marker.getPosition().lat(),
				lng: place.marker.getPosition().lng()
			},
			isVisible: true,
			map: self.map,
			layer: self.selectedLayer()
		}));
		self.selectedLayer().addShape(shape);
		self.selectedShape(shape);
		shape.on("editShape",function() {
			self.editShape(shape);
		});
		shape.on("deleteShape",function() {
			shape.clear();
			shape.layer && shape.layer.deleteShape(shape);
		});
		shape.redraw();
		self.editShape(shape);
	}


	Project.prototype.editShape = function(shape) {
		this.selectShape(shape);
		this.emit("openInfoWindow",{
			openAt: shape.model,
			type: "editShape",
			shape: shape
		});
	}

	Project.prototype.selectShape = function(shape) {
		this.selectedShape(shape);
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
		return l;
	}

	Project.prototype.selectLayer = function(data) {
		this.selectedLayer(data);
	}

	Project.prototype.deselectLayer = function() {
		this.selectedLayer(null);
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

	Project.prototype.exportProject = function() {
		var exportData = {
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
		this.exportData(ko.toJSON(exportData));
	}

	$.extend(Project.prototype,EventEmitter.prototype);

	return Project;
});