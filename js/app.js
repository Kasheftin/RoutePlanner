define(["jquery","knockout","gmaps","config","projectManager","project","infoWindow","searchBox","notificationBar","jquery.cookie","knockout.sortable","utils"],function($,ko,gmaps,config,ProjectManager,Project,InfoWindow,SearchBox,NotificationBar) {

	var App = function() {
		var self = this;
		this.isReady = ko.observable(false);
		this.map = ko.observable(null);
		this.q = ko.observable("");

		this.notificationBar = new NotificationBar();

		this.cookiesEnabled = ko.observable($.cookie("cookiesEnabled")!=null?$.cookie("cookiesEnabled"):config.cookiesEnabled);
		this.cookiesEnabled.subscribe(function(b) {
			if (b) $.cookie("cookiesEnabled",true);
			else $.removeCookie("cookiesEnabled");
			self.notificationBar.send("Cookies have been " + (b?"enabled":"disabled"));
		});

		this.currentProject = ko.observable(null);
		this.projectManager = new ProjectManager({
			cookiesEnabled: this.cookiesEnabled
		});
		this.projectManager.on("setProject",function(data) {
			data.map = self.map;
			var project = new Project(data);
			project.on("close",function() {
				self.currentProject(null);
			});
			project.on("openInfoWindow",function(data) {
				self.infoWindow && self.infoWindow.openWithData(data);
			});
			project.on("closeInfoWindow",function(data) {
				self.infoWindow && self.infoWindow.close();
			});
			project.on("notify",function(notification) {
				self.notificationBar.send(notification);
			})
			project.on("setMapPosition",function(position) {
				self.setMapPosition(position);
			});
			project.on("save",function() {
				self.projectManager.saveProject(project);
			});
			project.initialize(data);
			self.currentProject(project);
			if (self.currentProject() && self.windowHeight) self.currentProject().restrictContainerHeight(self.windowHeight);
		});
		this.projectManager.on("notify",function(notification) {
			self.notificationBar.send(notification);
		});
	}

	App.prototype.clearSearch = function() {
		this.q("");
		this.searchBox && this.searchBox.clearSearchResults();
	}

	App.prototype.setMapPosition = function(position) {
		if (this.map()) {
			var ar = (position||"").split(/,/);
			this.map().setCenter(new gmaps.LatLng(ar[0]||config.startPosition.lat,ar[1]||config.startPosition.lng));
			this.map().setZoom(Math.floor(ar[2])||config.startPosition.zoom);
			this.map().setMapTypeId(ar[3]||config.startPosition.mapTypeId);
		}
	}

	App.prototype.restoreMapPosition = function() {
		if (this.map()) {
			this.setMapPosition($.cookie("mapPosition"));
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

	App.prototype.addDebugToPrototype = function(pr) {
	    for (var i in pr) { 
	        if (typeof pr[i] == "function") {
	            (function(i) {
	                var origMethod = pr[i];
	                pr[i] = function(a,b,c,d,e,f,g,h) { 
	                    console.log(i,arguments);
	                    return origMethod.apply(this,arguments);
	                }
	            })(i);
	        }
	    }
	}

	App.prototype.addPOIHook = function() {
		var self = this;
		var set = gmaps.InfoWindow.prototype.set;
		gmaps.InfoWindow.prototype.set = function(key,val) {
			var infoWindow = this;
			if (key == "map" && self.currentProject()) {
				var content = $(this.content);
				var contentHTML = content.html();
				var link = $("<a href='#'>add to map</a>");
				link.click(function() {
					var descr = [];
					descr.push(content.find("div.gm-addr").text());
					descr.push(content.find("div.gm-website a").attr("href"));
					descr.push(content.find("div.gm-phone").text());
					var data = {
						name: content.find("div.gm-title").text(),
						description: $.grep(descr,function(v) { return v && v.length>0; }).join("\n")
					} 
					self.currentProject() && self.currentProject().addMarkerToMap({
						name: data.name,
						description: data.description,
						lat: infoWindow.getPosition().lat(),
						lng: infoWindow.getPosition().lng()
					});
					infoWindow.close();
				});
				content.find("div.gm-rev").append($("<div style='float:right'></div>").append(link));
			}
			set.apply(this,arguments);
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
			self.addPOIHook();
			self.service = new gmaps.places.PlacesService(self.map());
			self.searchBox.on("openSearchResultInfoWindow",function(place,marker) {
				self.service.getDetails({
					reference: place.reference
				},function(result,status) {
					var descr = [];
					descr.push(result.formatted_address);
					descr.push(result.website);
					descr.push(result.formatted_phone_number);
					place.description = $.grep(descr,function(v) { return  v && v.length>0; }).join("\n");
					self.infoWindow && self.infoWindow.openWithData({
						type: "searchResult",
						place: place,
						openAt: marker,
						addToMap: function(data) {
							self.currentProject() && self.currentProject().addMarkerToMap({
								name: data.name,
								description: data.description,
								lat: data.marker.getPosition().lat(),
								lng: data.marker.getPosition().lng()
							});
						}
					});
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

		this.windowHeight = $(window).height();
		$(window).on("resize",function() {
			self.windowHeight = $(this).height();
			if (self.currentProject() && self.windowHeight) self.currentProject().restrictContainerHeight(self.windowHeight);
		});
	}

	return App;
});