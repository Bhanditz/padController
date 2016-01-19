var fs         = require('fs'),
    exec       = require('child_process').exec,
    Controller = require("./padController.js");

var r = fs.createReadStream('/dev/input/event17');

var ohjain = new Controller({
		"ABS_X"     : new Controller.Dial(3, 0, 0, 32767, -32768),
		"ABS_Y"     : new Controller.Dial(3, 1, 0, 32767, -32768),

		"ABS_RX"    : new Controller.Dial(3, 3, 0, 32767, -32768),
		"ABS_RY"    : new Controller.Dial(3, 4, 0, 32767, -32768),

		"ABS_HAT0X" : new Controller.Dial(3, 16, 0, 1, -1),
		"ABS_HAT0Y" : new Controller.Dial(3, 17, 0, 1, -1),

		"ABS_Z"     : new Controller.Dial(3, 2, 0, 255),
		"ABS_RZ"    : new Controller.Dial(3, 5, 0, 255),

		"BTN_TL"    : new Controller.Dial(1, 310),
		"BTN_TR"    : new Controller.Dial(1, 311),

		"BTN_NORTH" : new Controller.Dial(1, 308),
		"BTN_SOUTH" : new Controller.Dial(1, 304),
		"BTN_EAST"  : new Controller.Dial(1, 305),
		"BTN_WEST"  : new Controller.Dial(1, 307),

		"BTN_SELECT": new Controller.Dial(1, 314), 
		"BTN_START" : new Controller.Dial(1, 315),
		"BTN_MODE"  : new Controller.Dial(1, 316),

		"BTN_THUMBL": new Controller.Dial(1, 317),
		"BTN_THUMBR": new Controller.Dial(1, 318),
	});

r.on('data', function(d) {

	var dtime, stime = process.hrtime();

	var e = new Controller.Event(d);
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