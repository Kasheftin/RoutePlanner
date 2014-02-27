define(["jquery","knockout","gmaps","eventEmitter"],function($,ko,gmaps,EventEmitter) {

	var Destination = function(name) {
		var self = this;
		this.name = ko.observable(name);
		this.createAutocomplete = function(data,e) {
			this.autocomplete = new gmaps.places.Autocomplete(e.target);
			gmaps.event.addListener(this.autocomplete,"place_changed",function() {
				var place = self.autocomplete.getPlace();
				self.name(place.formatted_address);
			});
		}
		this.destroyAutocomplete = function(data,e) {			
		}
		this.name.subscribe(function(name) {
			console.log("name change",name);
			self.emit("change",name);
		});
	}
	$.extend(Destination.prototype,EventEmitter.prototype);

	return Destination;
});