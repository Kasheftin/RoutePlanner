define(["jquery","knockout","eventEmitter","config","layer"],function($,ko,EventEmitter,config,Layer) {
	var Project = function(data) {
		var self = this;
		this.name = ko.observable(data.name);
		this.description = ko.observable(data.description);

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
		var exportFields = "name description layers".split(/ /);
		var data = ko.toJS(this);
		var exportData = {};
		exportFields.forEach(function(fieldName) {
			exportData[fieldName] = data[fieldName];
		});
		if (this.selectedLayer()) {
			exportData.selectedLayerId = this.layers().indexOf(this.selectedLayer());
		}
		this.exportData(ko.toJSON(exportData));
	}

	$.extend(Project.prototype,EventEmitter.prototype);

	return Project;
});