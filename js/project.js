define(["jquery","knockout","eventEmitter","config"],function($,ko,EventEmitter,config) {
	var Project = function(data) {
		this.name = ko.observable(data.hasOwnProperty("name")?data.name:config.project.defaultName);
		this.description = ko.observable(data.hasOwnProperty("description")?data.description:config.project.defaultDescription);
	}

	$.extend(Project.prototype,EventEmitter.prototype);

	return Project;
});