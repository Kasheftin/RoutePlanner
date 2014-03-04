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
			self.message(null);
/*			
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
*/
		});
	}

	ProjectManager.prototype.createProject = function() {
		var data = config.newProject;
		this.emit("setProject",data);
		this.emit("notify","New map has been created");
	}

	ProjectManager.prototype.loadProject = function(projectId) {
		try {
			var data = JSON.parse(this.loadProjectData());
		}
		catch(e) {
			this.message(e);
			return;
		}
		if (projectId) {
			data.id = projectId;
		}

		this.emit("setProject",data);
		this.emit("notify","Map has been loaded");
		this.page(null);
		this.loadProjectData(null);
	}

	ProjectManager.prototype.getProjectsList = function(silent) {
		var self = this;
		$.ajax({
			url: config.server.baseUrl,
			type: "post",
			dataType: "json",
			data: {
				action: "getProjectsList"
			},
			success: function(result) {
				if (result.error) self.emit("notify",{text:result.error,type:"alert"});
				else if (result.success && !silent) self.emit("notify",result.success);
				self.projects(result.data);
				self.page("projectsList");
			},
			error: function(jqXHR,textStatus,errorThrown) {
				self.emit("notify",{text:textStatus+errorThrown,type:"alert"});
			}
		});
	}

	ProjectManager.prototype.getProject = function(id) {
		var self = this;
		$.ajax({
			url: config.server.baseUrl,
			type: "post",
			dataType: "json",
			data: {
				action: "getProject",
				id: id
			},
			success: function(result) {
				if (result.error) self.emit("notify",{text:result.error,type:"alert"});
				else if (result.success) {
					self.emit("notify",result.success);
					self.loadProjectData(result.data);
					self.loadProject(result.id);
				}
			},
			error: function(jqXHR,textStatus,errorThrown) {
				self.emit("notify",{text:textStatus+errorThrown,type:"alert"});
			}
		});
	}

	ProjectManager.prototype.deleteProject = function(id) {
		var self = this;
		$.ajax({
			url: config.server.baseUrl,
			type: "post",
			dataType: "json",
			data: {
				action: "deleteProject",
				id: id
			},
			success: function(result) {
				if (result.error) self.emit("notify",{text:result.error,type:"alert"});
				else if (result.success) {
					self.emit("notify",result.success);
					self.getProjectsList(true);
				}
			},
			error: function(jqXHR,textStatus,errorThrown) {
				self.emit("notify",{text:textStatus+errorThrown,type:"alert"});
			}
		});
	}

	ProjectManager.prototype.saveProject = function(project) {
		var self = this;
		$.ajax({
			url: config.server.baseUrl,
			type: "post",
			dataType: "json",
			data: {
				action: "saveProject",
				id: project.id(),
				jsonData: project.toJSON()
			},
			success: function(result) {
				if (result.error) self.emit("notify",{text:result.error,type:"alert"});
				else if (result.success) self.emit("notify",result.success);
				project.id(result.id);
			},
			error: function(jqXHR,textStatus,errorThrown) {
				self.emit("notify",{text:textStatus+errorThrown,type:"alert"});
			}
		});
	}

	ProjectManager.prototype.setVar = function(i,v) {
		if (!this[i]) return;
		ko.isObservable(this[i])?this[i](v):this[i]=v;
	}

	$.extend(ProjectManager.prototype,EventEmitter.prototype);

	return ProjectManager;
});