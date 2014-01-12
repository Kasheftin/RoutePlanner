require.config({
	paths: {
		"async": "../lib/async-0.1.1",
		"domReady": "../lib/domReady-2.0.1",
		"knockout": "../lib/knockout-3.0.0.min",
		"eventEmitter": "../lib/eventEmitter",
		"jquery": "../lib/jquery-1.8.2.min",
		"jquery.cookie": "../lib/jquery.cookie",
		"jquery.ui": "../lib/jquery-ui-1.10.3.custom.min",
		"jquery.ui.sortable": "../lib/jquery-ui-1.10.3.custom.min",
		"knockout.sortable": "../lib/knockout.sortable-0.8.4.min"
	}
});

require(["domReady!","app"],function(doc,App) {
	var app = new App();
	app.init();
});
