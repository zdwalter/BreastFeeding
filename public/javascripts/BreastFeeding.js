var stat = {};
stat.side = '';
stat.feeding = false;
stat.edit = false;
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
    var str = min + ':' + sec;
    if (sec < 10) {
        str = min + ':0'+sec;
    }
    return str;

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
    history.push({time: new Date(), last:stat.last, side: stat.side});
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
    if (stat.edit) { html += '<div><button style="width:20px" onclick="history.add.init()">+</button></br></div>';}
    for (var i = data.length-1; i >=0; i--) {
        var record = data[i];
        //alert(JSON.stringify(record.time));
        var time = new Date();
        time.setTime(record.time);
        //alert(JSON.stringify(time));
        var start = time.getFullYear()+'-'+(time.getMonth()+1)+'-'+time.getDate() +' '+ timeToStr(time);
        var last = secondToStr(record.last);
        if (stat.edit) { html += '<button style="width:20px" onclick="history.remove('+i+')">-</button>';}
        else {html += '<a style="width:20px;height:20px">&nbsp;&nbsp;&nbsp;&nbsp;</a>';}
        html += record.side +'@' + start + '['+last+']';

        if (stat.edit) { 
            //html += '<button>Edit</button>';
        }
        html += '<br/>';
    }
    console.log(html);
    $('div#history').html(html);
};

history.hide = function() {
    $('div#history').html('');
};

history.add = {};

history.add.init = function() {
    history.hide(); 
    var html = '';
    if (stat.side === '') {
        stat.side = 'left';
    }
    html += '<button onclick="history.add.side.change()">'+stat.side+'</button>';
    html  += ' End @ ';
    if (stat.time == null) {
        stat.time = new Date();
    }
    var time = stat.time;
    var start = time.getFullYear()+'-'+(time.getMonth()+1)+'-'+time.getDate();
    html += start;
    html += '<button onclick="history.add.date.pick()">Edit</button><br/>';

    html += timeToStr(time);
    html += '<button onclick="history.add.time.pick()">Edit</button><br/>';

    if (stat.last == null) {
        stat.last = 20*60;
    }
    html += 'Last '+ secondToStr(stat.last);
    html += '<button onclick="history.add.last.pick()">Edit</button><br/>';

    html += '<button onclick="history.add.save()">Save</button><br/>';
    html += '<button onclick="history.add.cancel()">Cancel</button><br/>';

    $('div#history').html(html);
    
    //TODO: push
};

history.add.cancel = function() {
    edit.start();
};

history.add.save = function() {
    history.push({time: stat.time, last:stat.last, side: stat.side});
};

history.add.date = {};

history.add.date.cancel = function () {
};

history.add.date.done = function() {
    var results = SpinningWheel.getSelectedValues();
    //alert(JSON.stringify(results));
    var keys = results.keys;
    var year = keys[0];
    var month = keys[1];
    var date = keys[2];
    stat.time.setFullYear(year);
    stat.time.setMonth(parseInt(month,10)-1);
    stat.time.setDate(date);
    //alert(stat.time);
    history.add.init();

};

history.add.date.pick = function() {
    var now = stat.time;
    var days = { };
    var years = { };
    var months = { 1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun', 7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec' };
    
    for( var i = 1; i < 32; i++ ) {
        days[i] = i;
    }

    for( i = now.getFullYear()-5; i <= now.getFullYear()+5; i++ ) {
        years[i] = i;
    }

    SpinningWheel.addSlot(years, 'right', now.getFullYear());
    SpinningWheel.addSlot(months, '', now.getMonth()+1);
    SpinningWheel.addSlot(days, 'right', now.getDate());
    
    SpinningWheel.setCancelAction(history.add.date.cancel);
    SpinningWheel.setDoneAction(history.add.date.done);
    
    SpinningWheel.open();
};

history.add.time = {};

history.add.time.pick = function() {
    var now = stat.time;
    var hours = { };
    var minutes = { };
    
    for( var i = 0; i < 24; i++ ) {
        hours[i] = i;
    }

    for( var i = 0; i < 60; i++ ) {
        minutes[i] = i;
    }
    SpinningWheel.addSlot(hours , '', now.getHours());
    SpinningWheel.addSlot({ separator: ':' }, 'readonly shrink');
    SpinningWheel.addSlot(minutes, '', now.getMinutes());
    SpinningWheel.addSlot({ separator: ':' }, 'readonly shrink');
    SpinningWheel.addSlot(minutes, '', now.getSeconds());
    
    SpinningWheel.setCancelAction(history.add.time.cancel);
    SpinningWheel.setDoneAction(history.add.time.done);
    
    SpinningWheel.open();
};

history.add.time.done = function() {
    var results = SpinningWheel.getSelectedValues();
    //alert(JSON.stringify(results));
    var keys = results.keys;
    var hour = keys[0];
    var minute = keys[2];
    var second = keys[4];
    stat.time.setHours(hour);
    stat.time.setMinutes(minute);
    stat.time.setSeconds(second);
    //alert(stat.time);
    history.add.init();
};

history.add.time.cancel = function() {
};

history.add.last = {};

history.add.last.pick = function() {
    var now = stat.last;
    var hours = { };
    var minutes = { };
    var seconds = {0:0};
    
    for( var i = 0; i < 24; i++ ) {
        hours[i] = i;
    }

    for( var i = 0; i < 60; i++ ) {
        minutes[i] = i;
    }
    var hour = Math.floor(now / 3600) ;
    var min = Math.floor((now - hour * 3600)/60) ;
    var sec = now % 60;
    SpinningWheel.addSlot(hours , '', hour );
    SpinningWheel.addSlot({ separator: ':' }, 'readonly shrink');
    SpinningWheel.addSlot(minutes, '', min );
    SpinningWheel.addSlot({ separator: ':' }, 'readonly shrink');
    SpinningWheel.addSlot(minutes, '', sec );
    
    SpinningWheel.setCancelAction(history.add.last.cancel);
    SpinningWheel.setDoneAction(history.add.last.done);
    
    SpinningWheel.open();
};

history.add.last.done = function() {
    var results = SpinningWheel.getSelectedValues();
    //alert(JSON.stringify(results));
    var keys = results.values;
    var hour = keys[0];
    var minute = keys[2];
    var second = keys[4];
    stat.last = (hour*60+minute)*60+second;
    //alert(stat.time);
    history.add.init();
};

history.add.last.cancel = function() {
};

history.add.side = {};
history.add.side.change = function() {
    if (stat.side === 'left') {
        stat.side = 'right';
    } else {
        stat.side = 'left';
    }
    history.add.init();
};

history.edit = function() {
    //TODO: remove;
    //TODO: push
};

history.push = function(record) {
    record.time = record.time.getTime();
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

history.remove = function(i) {
    console.log('remove:'+JSON.stringify(history.data[i]));
    var v = history.data.splice(i,1);
    history.show();
    console.log(v);
    $.ajax({
        type: 'GET',
        url: '/'+user+'/history/remove/'+v[0].time
    }).done(function(msg) {
        console.log(msg);
    });

};
var edit = {};
edit.start = function() {
    stat.edit = true;
    $('button#history_edit').html('Done');
    $('button#history_edit').attr('onclick','edit.done()');
    history.show();
};

edit.done = function() {
    stat.edit = false;
    $('button#history_edit').html('Edit');
    $('button#history_edit').attr('onclick','edit.start()');
    history.show();
};

$(function() {
    console.log('ready');
    history.load();
});
