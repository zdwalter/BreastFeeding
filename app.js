
/**
 * Module dependencies.
 */

var express = require('express');
var mongodb = require('mongodb');
var winston = require('winston');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.mongodb = {
    pool: false,
    host: 'localhost',
    port: 27017
  };
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Functions

app.logger = new winston.Logger({
    transports: [
        new (winston.transports.Console)({level: app.loglevel, colorize: true}),
    ]
});

app.logger.meta = {
    pid: process.pid
};

app.mongodb.queue = [];
app.mongodb.createClient = function() {
    var db;
    if (app.mongodb.queue.length === 0) {
        var Db = mongodb.Db,
            Connection = mongodb.Connection,
            Server = mongodb.Server;
        db = new Db('BF', new Server(app.mongodb.host, app.mongodb.port, {}), {});
        app.logger.info('create mongo client', app.logger.meta);
    }
    else {
        db = app.mongodbClientQueue.shift();
    }
    return db;
};

app.mongodb.releaseClient = function(client, err) {
    if (app.mongodb.pool && client.state === 'connected' && !err && app.mongodb.queue.length < 10) {
        app.mongodb.queue.push(client);
        app.logger.info('release mongo client:length is '+app.mongodb.queue.length, app.logger.meta);
    }
    else {
        app.logger.info('release mongo client:err:'+err, app.logger.meta);
        if (client.state === 'connected') {
            client.close();
        }
    }
};

app.mongodb.collection = function(mongo, collectionName, callback) {
    function getCollection(db) {
        return db.collection(collectionName, function(err, collection) {
            if (err) {
                app.logger.error(err, app.logger.meta);
                app.logger.error(err.stack, app.logger.meta);
                return callback(err, null);
            }
            return callback(err, collection);
        });
    }

    if (mongo.state !== 'connected' ) {
        app.logger.info('connect mongodb', app.logger.meta);
        return mongo.open(function(err, db) {
            if (err) {
                return callback(err, null);
            }
            mongo = db;
            return getCollection(mongo);
        });
    }
    else {
        return getCollection(mongo);
    }
};

app.mongodb.insert = function(collectionName, data, callback) {
    var mongo = app.mongodb.createClient();
    return app.mongodb.collection(mongo, collectionName, function(err, collection) {
        if (err) {
            app.mongodb.releaseClient(mongo);
            app.logger.error(err, app.logger.meta);
            return callback(err, null);
        }
        return collection.insert(data, {safe: true},
            function(err, objects) {
                app.mongodb.releaseClient(mongo);
                if (err) {
                    app.logger.error(err, app.logger.meta);
                    return callback(err, null);
                }
                return callback(null, null);
            });
    }); 
};

app.mongodb.loadAll = function(collectionName, callback) {
    var mongo = app.mongodb.createClient();
    return app.mongodb.collection(mongo, collectionName, function(err, collection) {
        if (err) {
            app.logger.error(err, app.logger.meta);
            app.mongodb.releaseClient(mongo);
            return callback(null);
        }
        return collection.find(function(err, cursor) {
            if (err) {
                app.logger.error(err, app.logger.meta);
                app.mongodb.releaseClient(mongo);
                return callback(null);
            }
            return cursor.toArray(function(err, objects) {
                app.mongodb.releaseClient(mongo);
                return callback(err, objects);
            });
        });
    });
};

app.response = function(res, result) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf8');
    if (typeof result !== 'undefined') {
        res.write(JSON.stringify(result));
    }
    res.end();
};

// Routes

app.get('/', function(req, res){
    res.render('index', {
        title: 'BreastFeeding',
        feeding: false
    });
});

app.get('/:user/history', function(req, res) {
    var user = req.params.user;
    return app.mongodb.loadAll(user, function(err, data) {
        console.log(user+':'+JSON.stringify(data));
        return app.response(res, data); 
    });
});

app.post('/:user/history', function(req, res) {
    var data = JSON.parse(req.body.data);
    var user = req.params.user;
    console.log(user+':'+JSON.stringify(data));
    return app.mongodb.insert(user, data, function(err) {
        return app.response(res, err); 
    });
});

app.listen(80);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
