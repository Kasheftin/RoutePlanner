define(["jquery","knockout","eventEmitter"],function($,ko,EventEmitter) {
	var Layer = function(options) {
		var self = this;
		this.name = ko.observable(options.name);
		this.isVisible = ko.observable(options.isVisible);
		this.isExpanded = ko.observable(options.isExpanded);
		this.shapes = ko.observableArray([]);
		this.settings2edit = ko.observable(null);
		this.isVisible.subscribe(function(b) {
			self.shapes().forEach(function(shape) {
				shape.isVisible(b);
				b ? shape.show() : shape.hide();
			});
			if (b) {
				self.isExpanded(true);
				self.emit("selectLayer");
			}
			else {
				self.isExpanded(false);
				self.emit("deselectLayer");
			}
		});
	}

	Layer.prototype.addShape = function(shape,toBottom) {
		toBottom ? this.shapes.push(shape) : this.shapes.unshift(shape);
	}

	Layer.prototype.deleteShape = function(shape) {
		var i = this.shapes().indexOf(shape);
		if (i>=0) this.shapes.splice(i,1);
	}

	Layer.prototype.editSettings = function() {
		this.settings2edit({
			name: ko.observable(this.name()),
			isVisible: ko.observable(this.isVisible())
		});
	}

	Layer.prototype.close = function() {
		this.settings2edit(null);
	}

	Layer.prototype.saveSettings = function() {
		this.name(this.settings2edit().name());
		this.isVisible(this.settings2edit().isVisible());
		this.settings2edit(null);
	}

	Layer.prototype.destroyLayer = function() {
		while (this.shapes().length > 0) {
			this.shapes()[0].emit("deleteShape");
		}
		this.emit("destroyLayer");
	}

	Layer.prototype.expand = function() {
		this.isExpanded(true);
	}

	Layer.prototype.contract = function() {
		this.isExpanded(false);
	}

	Layer.prototype.switchExpand = function() {
		if (this.isVisible()) {
			this.isExpanded(!this.isExpanded());
		}
		else {
			this.isExpanded(false);
		}
	}

	Layer.prototype.show = function() {
		this.isVisible(true);
	}

	Layer.prototype.hide = function() {
		this.isVisible(false);
	}

	Layer.prototype.exportLayer = function() {
		var exportData = {
			name: this.name(),
			isVisible: this.isVisible(),
			isExpanded: this.isExpanded(),
			shapes: []
		}
		this.shapes().forEach(function(shape) {
			exportData.shapes.push(shape.exportShape());
		});
		return exportData;
	}

	$.extend(Layer.prototype,EventEmitter.prototype);

	return Layer;
});