define(["jquery","knockout"],function($,ko) {

	ko.bindingHandlers.fade = {
		init: function(element,valueAccessor) {
			var value = ko.utils.unwrapObservable(valueAccessor());
			$(element).toggle(value);
		},
		update: function(element,valueAccessor) {
			ko.utils.unwrapObservable(valueAccessor()) ? $(element).fadeIn() : $(element).fadeOut();
		}
	}
	
});