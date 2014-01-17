define(["jquery","knockout","gmaps","config","projectManager","project","infoWindow","searchBox","jquery.cookie","knockout.sortable","utils"],function($,ko,gmaps,config,ProjectManager,Project,InfoWindow,SearchBox) {

	var App = function() {
		var self = this;
		this.isReady = ko.observable(false);
		this.map = ko.observable(null);
		this.q = ko.observable("");

		this.cookiesEnabled = ko.observable($.cookie("cookiesEnabled")!=null?$.cookie("cookiesEnabled"):config.cookiesEnabled);
		this.cookiesEnabled.subscribe(function(b) {
			if (b) $.cookie("cookiesEnabled",true);
			else $.removeCookie("cookiesEnabled");
		});

		this.currentProject = ko.observable(null);
		this.projectManager = new ProjectManager({
			cookiesEnabled: this.cookiesEnabled
		});
		this.projectManager.on("setProject",function(data,index) {
			data.map = self.map;
			var project = new Project(data);
			project.on("change",function() {
				self.projectManager.saveProject(project,index);
			});
			project.on("close",function() {
				self.currentProject(null);
			});
			project.on("openInfoWindow",function(data) {
				self.infoWindow && self.infoWindow.openWithData(data);
			});
			self.currentProject(project);
		});

	}

	App.prototype.clearSearch = function() {
		this.q("");
		this.searchBox && this.searchBox.clearSearchResults();
	}

	App.prototype.restoreMapPosition = function() {
		if (this.map()) {
			var ar = ($.cookie("mapPosition")||"").split(/,/);
			this.map().setCenter(new gmaps.LatLng(ar[0]||config.startPosition.lat,ar[1]||config.startPosition.lng));
			this.map().setZoom(Math.floor(ar[2])||config.startPosition.zoom);
			this.map().setMapTypeId(ar[3]||config.startPosition.mapTypeId);
		}
	}

	App.prototype.saveMapPosition = function() {
		var self = this;
		if (this.map() && this.cookiesEnabled()) {
			if (this.savePositionTimeout) clearTimeout(this.savePositionTimeout);
			this.savePositionTimeout = setTimeout(function() {
				$.cookie("mapPosition",self.map().getCenter().lat()+","+self.map().getCenter().lng()+","+self.map().getZoom()+","+self.map().getMapTypeId());
			},1000);
		}
	}

	App.prototype.init = function() {
		var self = this;
		ko.applyBindings(this);
		var map = new gmaps.Map($("#map")[0]);
		map.setOptions({
			mapTypeControl: true,
			mapTypeControlOptions: {
				mapTypeIds: [gmaps.MapTypeId.ROADMAP,gmaps.MapTypeId.HYBRID,gmaps.MapTypeId.SATELLITE,gmaps.MapTypeId.TERRAIN],
				style: gmaps.MapTypeControlStyle.DROPDOWN_MENU,
				position: gmaps.ControlPosition.TOP_RIGHT
			},
			panControl: true,
			panControlOptions: {
				position: gmaps.ControlPosition.RIGHT_TOP
			},
			streetViewControl: true,
			streetViewControlOptions: {
				position: gmaps.ControlPosition.RIGHT_TOP				
			},
			zoomControl: true,
			zoomControlOptions: {
				position: gmaps.ControlPosition.RIGHT_TOP				
			},
			scaleControl: true,
			overviewMapControl: true,
			rotateControl: true
		});
		gmaps.event.addListenerOnce(map,"idle",function() {
			self.restoreMapPosition();
			self.isReady(true);
			self.infoWindow = new InfoWindow({
				map: self.map
			});
			self.searchBox = new SearchBox({
				input: $("#search")[0],
				map: self.map
			});
			self.searchBox.on("openSearchResultInfoWindow",function(place,marker) {
				self.infoWindow && self.infoWindow.openWithData({
					type: "searchResult",
					place: place,
					openAt: marker,
					addToMap: function(data) {
						self.currentProject() && self.currentProject().addToMap(data);
					}
				});
			});
		});
		gmaps.event.addListener(map,"bounds_changed",function() {
			self.saveMapPosition();
		});
		gmaps.event.addListener(map,"maptypeid_changed",function() {
			self.saveMapPosition();
		});
		this.map(map);
	}

	return App;
});