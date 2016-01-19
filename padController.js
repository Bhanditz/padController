module.exports = function(ds) {
	this.dials = new module.exports.Dials(ds);

	this.dial = function(n) { return this.dials.get(n); }

	this.dialsByEvent = function(e) {
		var self = this;
		var d = self.dials.byType(e.type).byCode(e.code);
		return d;
	}



	this.events = {};

	this.addEvent = function(n, fn) {
		var self = this;
		if (typeof self.events[n] === "undefined") self.events[n] = [];
		self.events[n].push(fn);
	}

	this.callEvent = function(n) {
		var self = this;
		console.log("Running event for '"+n+"'");
		if (typeof self.events[n] === "undefined") console.log("No events added");
		else for(var i in self.events[n])
			self.events[n][i](self.dials.get(n));
	}
};
module.exports.Event = function(d) {
	this.type  = d.readInt16LE(16);
	this.code  = d.readInt16LE(18);
	this.value = d.readInt16LE(20);

	this.toString = function() {
		return this.type+"/"+this.code+" => "+this.value;
	}
};

module.exports.Dial = function(type, code, still, max, min) {
	this.type = type;
	this.code = code;

	if (this.type == 1) {
		this.min   = 0;
		this.still = 0;
		this.max   = 1;
	}
	this.min   = this.min   || (min || still);
	this.still = this.still || still;
	this.max   = this.max   || max;


	this.value = null;

	this.set = function(val) {
		this.value = val;
	}

	this.toString = function() {
		return this.type+"/"+this.code+" => "+this.value+"@["+this.min+","+this.max+"]";
	}
};

module.exports.Dials = function(dials) {
	this.dials = dials;

	this.get = function(n) {
		var self = this;
		return this.dials[n];
	}
	this.set = function(val) {
		var self = this;
		for(var n in self.dials) self.dials[n].set(val);
		return this;
	}

	this.byField = function(field, val) {
		var self = this, d = {};
		for(var n in self.dials) {
			if (self.dials[n][field] == val)
				d[n] = self.dials[n];
		}
		return new module.exports.Dials(d);
	}

	this.byType  = function(a) { return this.byField("type",  a); }
	this.byCode  = function(a) { return this.byField("code",  a); }
	this.byValue = function(a) { return this.byField("value", a); }

	this.toString = function() {
		var self = this, d = {}, ret = "";
		for(var n in self.dials) ret += n + " => " + self.dials[n].toString() + "\n";
		return ret;
	}
};