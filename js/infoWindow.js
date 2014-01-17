define(["jquery","knockout","gmaps","config"],function($,ko,gmaps,config) {
	var InfoWindow = function(options) {
		var self = this;
		this.map = options.map;
	}

	InfoWindow.prototype.openWithData = function(data) {
		var self = this;
		if (this.iw) { 
			this.iw.close();
			delete this.iw;
		}
		if (data.type == "editShape" && data.shape) {
			self.iw = new gmaps.InfoWindow({content:$("#editMarkerShapeInfoWindowTemplate").html()});
			self.currentModel = {
				name: ko.observable(data.shape.name()),
				description: ko.observable(data.shape.description()),
				saveShape: function() {
					data.shape.name(self.currentModel.name());
					data.shape.description(self.currentModel.description());
					self.currentModel.close();
				},
				deleteShape: function() {
					self.currentModel.close();
					data.shape.emit("deleteShape");
				},
				close: function() {
					self.iw.close();
					delete self.iw;
				}
			}
			gmaps.event.addListenerOnce(self.iw,"domready",function() {
				ko.applyBindings(self.currentModel,$("#editMarkerShapeInfoWindow")[0]);
			});
			data.openAt && self.map() && self.iw.open(self.map(),data.openAt);
		}
		if (data.type == "searchResult" && data.place) {
			self.iw = new gmaps.InfoWindow({content:$("#searchResultInfoWindowTemplate").html()});
			self.currentModel = {
				name: ko.observable(data.place.name),
				description: ko.observable(data.place.formatted_address),
				addToMap: function() {
					self.currentModel.close();
					data.addToMap && data.addToMap({
						name: self.currentModel.name(),
						description: self.currentModel.description(),
						marker: data.openAt
					});
				},
				close: function() {
					self.iw.close();
					delete self.iw;
				}
			}
			gmaps.event.addListenerOnce(self.iw,"domready",function() {
				ko.applyBindings(self.currentModel,$("#searchResultInfoWindow")[0]);
			});
			data.openAt && self.map() && self.iw.open(self.map(),data.openAt);
		}
/*




		else if (data.type == "searchResult" && data.place) {
			this.type("searchResult");
			this.editData.name(data.place.name);
			this.editData.description(data.place.formatted_address);
			this.addToMap = function() {
			}
		}
		data.openAt && this.map() && this.iw.open(this.map(),data.openAt);
*/
	}

	return InfoWindow;
});