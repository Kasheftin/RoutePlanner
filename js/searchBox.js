define(["jquery","knockout","gmaps","eventEmitter","config"],function($,ko,gmaps,EventEmitter,config) {
	var SearchBox = function(options) {
		this.input = options.input;
		this.map = options.map;
		this.searchResultsMarkers = [];
		this.initSearch();
	}

	SearchBox.prototype.initSearch = function() {
		var self = this;
		this.sb = new gmaps.places.SearchBox(this.input,{bounds:this.map().getBounds()});
		this.sb.addListener("places_changed",function() {
			var places = self.sb.getPlaces();
			self.clearSearchResults();
			self.appendSearchResults(places);
			self.fitMapToSearchResults(places);
		});
		this.map().addListener("bounds_changed",function() {
			self.sb.setBounds(self.map().getBounds());
		});
	}

	SearchBox.prototype.buildMarker = function(place) {
		var self = this;
		var image = {
		    url: place.icon,
		    size: new google.maps.Size(71, 71),
		    origin: new google.maps.Point(0, 0),
		    anchor: new google.maps.Point(17, 34),
		    scaledSize: new google.maps.Size(25, 25)
		}
		var marker = new gmaps.Marker({
			map: this.map(),
			title: place.name,
//			icon: image,
			position: place.geometry.location
		});
		marker.addListener("click",function() {
			self.emit("openSearchResultInfoWindow",place,marker);
		});
		return marker;
	}

	SearchBox.prototype.appendSearchResults = function(results) {
		var self = this;
		results.forEach(function(place) {
			self.searchResultsMarkers.push(self.buildMarker(place));
		});
	}

	SearchBox.prototype.clearSearchResults = function() {
		this.searchResultsMarkers.forEach(function(marker) {
			marker.setMap(null);
		});
		this.searchResultsMarkers = [];
	}

	SearchBox.prototype.fitMapToSearchResults = function(results) {
		var bounds = new gmaps.LatLngBounds();
		var resultsLength = 0, singleResult = null;
		results.forEach(function(place) {
			if (place.geometry.location) {
				bounds.extend(place.geometry.location);
				resultsLength++;
				singleResult = place;
			}
		});
		if (resultsLength == 1 && singleResult) {
			if (singleResult.geometry.viewport)	{
				console.log("single result & has viewport");
				this.map().fitBounds(singleResult.geometry.viewport);
			}
			else if (singleResult.geometry.location) {
				console.log("single result & has location & zoom 17");
				this.map().setCenter(singleResult.geometry.location);
				this.map().setZoom(config.defaultSearchZoom);
			}
		}
		else if (resultsLength > 0) {
			console.log("multiple results",resultsLength);
			this.map().fitBounds(bounds);
		}
	}

	$.extend(SearchBox.prototype,EventEmitter.prototype);

	return SearchBox;
});