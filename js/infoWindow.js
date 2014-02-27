define(["jquery","knockout","gmaps","config"],function($,ko,gmaps,config) {
	var InfoWindow = function(options) {
		var self = this;
		this.map = options.map;
	}

	InfoWindow.prototype.close = function() {
		if (this.iw) {
			this.iw.close();
			delete this.iw;
		}
	}

	InfoWindow.prototype.openWithData = function(data) {
		var self = this;
		this.close();
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
			var html = (data.place.description||"").replace(/^[\r\n\t]+/,"").replace(/[\r\n\t]+$/,"").replace(/\n/g,"\n<br>\n").replace(/\bhttps?:\/\/[^\s]+/gi,function(v) {
				return "<a target='_blank' href='" + v + "'>" + v.replace(/\bhttps?:\/\//,"") + "</a>";
			});
			if (html.length == 0) html = "-- Empty description --";
			var tmpHTML = $("<div></div>").html($("#searchResultInfoWindowTemplate").html())
				.find("#searchResultInfoWindow-content").append(html).end()
				.find("#searchResultInfoWindow-name").append(data.place.name).end()
				.html();
			self.iw = new gmaps.InfoWindow({content:tmpHTML});
			gmaps.event.addListenerOnce(self.iw,"domready",function() {
				$("#searchResultInfoWindow")
					.find("#searchResultInfoWindow-add").on("click",function() {
						self.iw.close();
						delete self.iw;
						data.addToMap && data.addToMap({
							name: data.place.name,
							description: data.place.description,
							marker: data.openAt
						});
					}).end();
			});
			data.openAt && self.map() && self.iw.open(self.map(),data.openAt);
		}
		if (data.type == "showShape" && data.shape) {
			var html = (data.shape.description()||"").replace(/^[\r\n\t]+/,"").replace(/[\r\n\t]+$/,"").replace(/\n/g,"\n<br>\n").replace(/\bhttps?:\/\/[^\s]+/gi,function(v) {
				return "<a target='_blank' href='" + v + "'>" + v.replace(/\bhttps?:\/\//,"") + "</a>";
			});
			if (html.length == 0) html = "-- Empty description --";
			var tmpHTML = $("<div></div>").html($("#showMarkerShapeInfoWindowTemplate").html())
				.find("#showMarkerShapeInfoWindow-content").append(html).end()
				.find("#showMarkerShapeInfoWindow-name").append(data.shape.name()).end()
				.html();
			self.iw = new gmaps.InfoWindow({content:tmpHTML});
			gmaps.event.addListenerOnce(self.iw,"domready",function() {
				$("#showMarkerShapeInfoWindow")
					.find("#showMarkerShapeInfoWindow-edit").on("click",function() {
						self.iw.close();
						delete self.iw;
						data.shape.emit("editShape");
					}).end()
					.find("#showMarkerShapeInfoWindow-delete").on("click",function() {
						self.iw.close();
						delete self.iw;
						data.shape.emit("deleteShape");
					}).end();
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