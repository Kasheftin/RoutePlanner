define(["jquery","knockout","gmaps","config"],function($,ko,gmaps,config) {
	var InfoWindow = function(options) {
		var self = this;
		this.map = options.map;
		this.type = ko.observable(null);
		this.shape = ko.observable(null);
		this.editData = {
			name: ko.observable(""),
			description: ko.observable("")
		};
		
		this.iw = new gmaps.InfoWindow({content:$("#infoWindowTemplate").html()});
		gmaps.event.addListener(this.iw,"domready",function() {
			ko.applyBindings(self,$("#infoWindow")[0]);
		});
	}

	InfoWindow.prototype.openWithData = function(data) {
		var self = this;
		if (data.type == "editShape" && data.shape) {
			if (data.shape.type() == "marker") {
				this.type("editMarkerShape");
				console.log("editMarkerShape",data.shape.name(),data.shape.description());
				this.editData.name(data.shape.name());
				this.editData.description(data.shape.description());
				this.saveShape = function() {
					data.shape.name(self.editData.name());
					data.shape.description(self.editData.description());
					self.close();
				}
				this.deleteShape = function() {
					self.close();
					data.shape.emit("deleteShape");
				}
			}
		}
		data.openAt && this.map() && this.iw.open(this.map(),data.openAt);
	}

	InfoWindow.prototype.saveShape = function() {
		console.error("InfoWindow.save is not defined");
	}

	InfoWindow.prototype.deleteShape = function() {
		console.error("InfoWindow.delete is not defined");
	}

	InfoWindow.prototype.close = function() {
		this.iw && this.iw.close();
	}

	return InfoWindow;
});