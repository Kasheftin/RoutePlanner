define(["jquery","knockout","gmaps","eventEmitter","config","layer","toolbar","shape"],function($,ko,gmaps,EventEmitter,config,Layer,Toolbar,Shape) {
	var Shape = function(options) {
		this.name = ko.observable(options.name);
		this.description = ko.observable(options.description);
		this.type = ko.observable(options.type);
		this.icon = ko.observable(options.icon);
		this.isVisible = ko.observable(options.isVisible);
		this.data = options.data || {};
		this.layer = options.layer || null;
		this.map = options.map;
	}

	Shape.prototype.redraw = function() {
		if (!this.isVisible() && this.model) return this.clear();
		if (!this.model) return this.draw();
	}

	Shape.prototype.clear = function() {
		if (this.model) {
			this.model.setMap(null);
			delete this.model;
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
			this.modelClickListener = gmaps.event.addListener(this.model,"click",function() {
				self.emit("editShape");
			});
		}
	}

	$.extend(Shape.prototype,EventEmitter.prototype);

	return Shape;
});