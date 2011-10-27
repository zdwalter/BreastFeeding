var stat = {};
stat.side = '';
stat.feeding = false;
var history = [];
var user = 'sophy';

function log(msg) {
    try {
        console.log(msg);
    }
    catch(e) {
    }
}

function choose(side) {
    //$('#side').html(stat.side);
    if (stat.side === '') {
        $('div#timer').html('<button id="timer" onclick="feed()">Start</button>');
    }
    if (stat.feeding === false) {
        stat.side = side;
        $('button#left').attr('style','');
        $('button#right').attr('style','');
        $('button#'+side).attr('style','color:yellow');
    }
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

function timeToStr(time) {
    var hour = time.getHours();
    var min = time.getMinutes();
    if (min < 10) { min = '0'+min; }
    var sec = time.getSeconds();
    if (sec < 10) { sec = '0'+sec; }
    return hour +':'+min+':'+sec;
}

function secondToStr(time) {
    var min = Math.floor(time / 60);
    var sec = time % 60;
    var last = min + ':' + sec;
    if (sec < 10) {
        last = min + ':0'+sec;
    }
    return last;

}

function start() {
    $('button#timer').html('End');
    stat.feeding = true;
    stat.time = new Date();
    stat.start = timeToStr(stat.time);
    stat.last = 0;
    $('#stat').html('Start @ '+ stat.start);
    log('Start @ '+stat.time.toLocaleTimeString());
    setTimeout('update()', 1000);
}

function update() {
    stat.last = Math.floor((new Date() - stat.time)/1000);
    var last = secondToStr(stat.last);

    $('#stat').html('Start @ '+ stat.start + ' ['+last+']');
    if (stat.feeding) {
        setTimeout('update()', 1000);
    }
    log('Check update');
}

function end() {
    log('End @ '+stat.time.toLocaleTimeString());
    $('button#timer').html('Start');
    stat.feeding = false;

    //TODO: push history
    history.push({time: stat.time, last:stat.last, side: stat.side});
}

var history = {};
history.data = [];

history.load = function() {
    $.ajax({
        url: '/'+user+'/history',
        success: function(data) {
            console.log(data);
            history.data = data;
            history.show();
        }
    });
};

history.show = function() {
    var html = '';
    var data = history.data;
    for (var i = data.length-1; i >=0; i--) {
        var record = data[i];
        var time = new Date(record.time);
        var start = time.getFullYear()+'-'+time.getMonth()+'-'+time.getDay() +' '+ timeToStr(time);
        var last = secondToStr(record.last);
        html += record.side +'@' + start + '['+last+']'+'<br/>';
    }
    console.log(html);
    $('div#history').html(html);
};

history.push = function(record) {
    history.data.push(record);
    history.show();
    $.ajax({
        type: 'POST',
        url: '/'+user+'/history',
        data: {data:JSON.stringify(record)}
    }).done(function(msg) {
        console.log(msg);
    });
};
