define(["jquery","knockout","eventEmitter","config"],function($,ko,EventEmitter,config) {
	var NotificationBar = function() {
		this.isVisible = ko.observable(false);
		this._style = ko.observable(null);
		this._text = ko.observable(null);
	}

	NotificationBar.prototype.send = function(options) {
		var self = this;
		this._timeout && clearTimeout(this._timeout);
		(typeof options == "string") && (options = {text:options});
		(!options.type) && (options.type = "info");
		this._text(options.text);
		this._style("alert-"+options.type);
		this.isVisible(true);
		this._timeout = setTimeout(function() {
			self.close();
		},2000);
	}

	NotificationBar.prototype.close = function() {
		this.isVisible(false);
	}

	return NotificationBar;
});