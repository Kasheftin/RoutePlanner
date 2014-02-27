define(["jquery","knockout","eventEmitter","config"],function($,ko,EventEmitter,config) {
	var ProjectManager = function(options) {
		var self = this;
		for (var i in options) 
			if (options.hasOwnProperty(i))
				this[i] = options[i];
		this.page = ko.observable(null);
		this.projects = ko.observableArray([]);
		this.message = ko.observable(null);
		this.loadProjectData = ko.observable("");

		this.page.subscribe(function(page) {
			if (page == "projectsList") {
				if (localStorage) {
					try {
						var projects = JSON.parse(localStorage.getItem("ro.projects"));
					}
					catch(e) {
						self.message(e);
					}
					if (projects && projects.length > 0) {
						self.projects(projects);
					}
					else {
						self.projects([]);
						self.message("There are not any saved projects in browser cache.");
					}
				}
				else {
					self.message("LocalStorage is not supported by Your browser, saving and loading projects in browser cache is not available.");
				}
			}
			else {
				self.message(null);
			}
		});
	}

	ProjectManager.prototype.createProject = function() {
		var data = config.newProject;
		this.projects.push(data);
		this.emit("setProject",data,this.projects().length-1);
		this.emit("notify","New project has been created");
	}

	ProjectManager.prototype.loadProject = function() {
		try {
			var data = JSON.parse(this.loadProjectData());
		}
		catch(e) {
			this.message(e);
			return;
		}
		this.projects.push(data);
		this.emit("setProject",data,this.projects().length-1);
		this.emit("notify","Project has been loaded");
		this.page(null);
	}

	ProjectManager.prototype.setVar = function(i,v) {
		if (!this[i]) return;
		ko.isObservable(this[i])?this[i](v):this[i]=v;
	}

	$.extend(ProjectManager.prototype,EventEmitter.prototype);

	return ProjectManager;
});