var fs = require('fs');
var exec = require('child_process').exec;


var Event = function(d) {
	this.type  = d.readInt16LE(16);
	this.code  = d.readInt16LE(18);
	this.value = d.readInt16LE(20);

	this.toString = function() {
		return this.type+"/"+this.code+" => "+this.value;
	}
};

var Dial = function(type, code, still, max, min) {
	this.type = type;
	this.code = code;

	if (this.type == 1) {
		this.min   = 0;
		this.still = 0;
		this.max   = 1;
	} else
	this.min   = this.min   || (min || still);
	this.still = this.still || still;
	this.max   = this.max   || max;


	this.value = null;

	this.set = function(val) {
		this.value = val;
	}

	this.toString = function() {
		return this.type+"/"+this.code+" => "+this.value+"@["+this.min+","+this.max+"]";
	};
};

var Dials = function(dials) {
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

	this.byType = function(type) {
		var self = this, d = {};
		for(var n in self.dials) if (self.dials[n].type == type) d[n] = self.dials[n];
		return new Dials(d);
	}
	this.byCode = function(code) {
		var self = this, d = {};
		for(var n in self.dials) if (self.dials[n].code == code) d[n] = self.dials[n];
		return new Dials(d);
	}

	this.toString = function() {
		var self = this, d = {}, ret = "";
		for(var n in self.dials) ret += n + " => " + self.dials[n].toString() + "\n";
		return ret;
	};
};

var Controller = function() {
	this.dials = new Dials({
		"ABS_X"     : new Dial(3, 0, 0, 32767, -32768),
		"ABS_Y"     : new Dial(3, 1, 0, 32767, -32768),

		"ABS_RX"    : new Dial(3, 3, 0, 32767, -32768),
		"ABS_RY"    : new Dial(3, 4, 0, 32767, -32768),

		"ABS_HAT0X" : new Dial(3, 16, 0, 1, -1),
		"ABS_HAT0Y" : new Dial(3, 17, 0, 1, -1),

		"ABS_Z"     : new Dial(3, 2, 0, 255),
		"ABS_RZ"    : new Dial(3, 5, 0, 255),

		"BTN_TL"    : new Dial(1, 310),
		"BTN_TR"    : new Dial(1, 311),

		"BTN_NORTH" : new Dial(1, 308),
		"BTN_SOUTH" : new Dial(1, 304),
		"BTN_EAST"  : new Dial(1, 305),
		"BTN_WEST"  : new Dial(1, 307),

		"BTN_SELECT": new Dial(1, 314), 
		"BTN_START" : new Dial(1, 315),
		"BTN_MODE"  : new Dial(1, 316),

		"BTN_THUMBL": new Dial(1, 317),
		"BTN_THUMBR": new Dial(1, 318),
	});

	this.dial = function(n) { return this.dials.get(n); }

	this.dialsByEvent = function(e) {
		var self = this;
		var d = self.dials.byType(e.type).byCode(e.code);
		return d;
	};



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



var r = fs.createReadStream('/dev/input/event17');
var ohjain = new Controller();

r.on('data', function(d) {

	var dtime, stime = process.hrtime();

	var e = new Event(d);
	var ds = ohjain.dialsByEvent(e).set(e.value);
	for(var n in ds.dials) ohjain.callEvent(n);


	dtime = process.hrtime();

	console.log("Aika: "+((dtime[0] * 1e9 + dtime[1]) - (stime[0] * 1e9 + stime[1]))+"ns");

});



var aanenvoimakkuus_timer = null;

ohjain.addEvent("ABS_HAT0Y", function(d){
	if (d.value == -1) {
		aanenvoimakkuus_timer = setInterval(function(){ exec("amixer sset 'Master' 1%+") }, 200);
	} else if (d.value == 1) {
		aanenvoimakkuus_timer = setInterval(function(){ exec("amixer sset 'Master' 1%-") }, 200);
	} else clearInterval(aanenvoimakkuus_timer);
});

ohjain.addEvent("BTN_TL", function(d){
	if (d.value != 1) return;
	exec("amixer sset 'Master' 100%");
});