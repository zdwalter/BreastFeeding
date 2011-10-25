var stat = {};
stat.side = 'left';
stat.feeding = false;

function log(msg) {
    try {
        console.log(msg);
    }
    catch(e) {
    }
}

function choose(side) {
    stat.side = side;
    $('#side').html(stat.side);
    log('change side:'+stat.side);
}

function feed() {
    if (stat.feeding) {
        end();
    }
    else {
        start();
    }
}

function start() {
    $('#timer').html('End');
    stat.feeding = true;
    stat.time = new Date();
    $('#stat').html('Start '+stat.side+' @ '+ stat.time.toLocaleTimeString());
    log('Start @ '+stat.time.toLocaleTimeString());
    setTimeout('update()', 1000);
}

function update() {
    stat.last = Math.floor((new Date() - stat.time)/1000);
    var min = Math.floor(stat.last / 60);
    var sec = stat.last % 60;
    var last = min + ':' + sec;
    if (sec < 10) {
        last = min + ':0'+sec;
    }

    $('#stat').html('Start '+stat.side+' @ '+ stat.time.toLocaleTimeString() + ' ['+last+']');
    if (stat.feeding) {
        setTimeout('update()', 1000);
    }
    log('Check update');
}

function end() {
    log('End @ '+stat.time.toLocaleTimeString());
    $('#timer').html('Start');
    stat.feeding = false;
}
