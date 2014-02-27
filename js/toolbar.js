define(["jquery","knockout","gmaps","eventEmitter","config"],function($,ko,gmaps,EventEmitter,config) {

	var Tool = function(options) {
		for (var i in options) {
			this[i] = options[i];
		}
	}

	var Toolbar = function(options) {
		var self = this;
		this.layer = options.layer;
		this.map = options.map;

		this.moveTool = new Tool($.extend({},config.tools.moveTool,{
			isEnabled: ko.computed(function() {
				return true;
			})
		}));

		this.addMarkerTool = new Tool($.extend({},config.tools.addMarkerTool,{
			isEnabled: ko.computed(function() {
				return !!self.layer();
			}),
			onSelect: function() {
				self.map().setOptions({draggableCursor:"crosshair"});
				self.addMarkerToolClickListener = gmaps.event.addListener(self.map(),"click",function(e) {
					self.emit("addMarker",e);
					self.deselectTool();
				});
			},
			onDeselect: function() {
				self.map().setOptions({draggableCursor:null});
				gmaps.event.removeListener(self.addMarkerToolClickListener);
				console.log("addMarkerTool deselected");
			}
		}));

		this.addLineTool = new Tool($.extend({},config.tools.addLineTool,{
			isEnabled: ko.computed(function() {
				return !!self.layer();
			})
		}));

		this.addDirectionTool = new Tool($.extend({},config.tools.addDirectionTool,{
			isEnabled: ko.computed(function() {
				return !!self.layer();
			}),
			onClick: function() {
				self.emit("addDirections");
			}
		}));

//		this.tools = [this.moveTool,this.addMarkerTool,this.addLineTool,this.addDirectionTool];
		this.tools = [this.moveTool,this.addMarkerTool,this.addDirectionTool];
		this.currentTool = ko.observable(null);
		this.layer.subscribe(function(layer) {
			if (!layer) self.deselectTool();
		});
		this.currentTool.subscribe(function(tool) {
			tool && tool.onDeselect && tool.onDeselect();
		},this,"beforeChange");
		this.deselectTool();
	} 

	Toolbar.prototype.selectTool = function(tool) {
		if (this.map() && tool.isEnabled()) {
			if (tool.isSelectable) {
				this.currentTool(tool);
				tool.onSelect && tool.onSelect();
			}
			else {
				tool.onClick && tool.onClick();
			}
		}
	}

	Toolbar.prototype.deselectTool = function() {
		this.currentTool(this.moveTool);
	}

	$.extend(Toolbar.prototype,EventEmitter.prototype);

	return Toolbar;
});