var fs = require('fs');


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
	} else {
		this.min   = min || still;
		this.still = still;
		this.max   = max;
	}


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
	};
};

var Controller = function() {
	this.dials = new Dials({
		"ABS_X"     : new Dial(3, 0, 0, 32767, -32768),
		"ABS_Y"     : new Dial(3, 1, 0, 32767, -32768),

		"ABS_RX"    : new Dial(3, 3, 0, 32767, -32768),
		"ABS_RY"    : new Dial(3, 4, 0, 32767, -32768),

		"ABS_HAT0X" : new Dial(3, 16, 0, 1, 0),
		"ABS_HAT0Y" : new Dial(3, 17, 0, 1, 0),

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

	this.dialsByEvent = function(e) {
		var self = this;
		var d = self.dials.byType(e.type).byCode(e.code);
		return d;
	};
};


var r = fs.createReadStream('/dev/input/event17');

var ohjain = new Controller();

r.on('data', function(d) {
	console.log(d);
	var e = new Event(d);
	console.log(e.toString());

	var d = ohjain.dialsByEvent(e);
	console.log(d.toString());

});