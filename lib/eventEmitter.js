define(function(){
	var EventsEmitter = function(){
	};

	EventsEmitter.prototype.listeners = function(type){
		if(!this._listeners || !this._listeners[type])
			return [];
		return this._listeners[type];
	};

	EventsEmitter.prototype.removeListener = function(type, proc, undefined) {
		if(!this._listeners || !this._listeners[type])
			return this;
		if (proc === undefined) {
			delete this._listeners[type];
			return this;
		}
		var listeners = this._listeners[type];
		var i = listeners.indexOf(proc);
		if(i != -1)
			listeners.splice(i, 1);
		return this;
	};

	EventsEmitter.prototype.on = function(type, proc){
		if(!this._listeners)
			this._listeners = {};
		if(!this._listeners[type])
			this._listeners[type] = [];
		this._listeners[type].push(proc);
		return this;
	};

	EventsEmitter.prototype.off = function(type, proc) {
		return this.removeListener(type, proc);
	};

	EventsEmitter.prototype.emit = function(type){
		if(this._listeners && this._listeners[type]){
			var listeners = this._listeners[type];
			var args = Array.prototype.slice.call(arguments, 1);
			for(var i = 0; i < listeners.length; i++)
				listeners[i].apply(this, args);
		}
		return this;
	};

	return EventsEmitter;
});
