define(["jquery","knockout","eventEmitter"],function($,ko,EventEmitter) {
	var Layer = function(options) {
		this.name = ko.observable(options.name);
		this.isVisible = ko.observable(options.isVisible);
		this.isExpanded = ko.observable(options.isExpanded);
		this.shapes = ko.observableArray(options.shapes);
		this.settings2edit = ko.observable(null);
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
		this.emit("destroyLayer");
	}

	Layer.prototype.expand = function() {
		this.isExpanded(true);
	}

	Layer.prototype.contract = function() {
		this.isExpanded(false);
	}

	Layer.prototype.show = function() {
		this.isVisible(true);
	}

	Layer.prototype.hide = function() {
		this.isVisible(false);
	}

	$.extend(Layer.prototype,EventEmitter.prototype);

	return Layer;
});