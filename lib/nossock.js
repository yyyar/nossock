/**
 * nossock.js - Message-based TCP/TLS socket wrapper
 * @author Yaroslav Pogrebnyak
 */

var net = require('net'),
    tls = require('tls'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    _ = require('lodash'),
    shortId = require('shortid'),
    Parser = require('./parser');

/**
 * Secure Evented Socket Wrapper
 */
var Nossock = function(socket) {

    var self = this;

    this.socket = socket;

    /* Default config */
    this.config = _.merge({
        reqTimeout: 5000 // request timeout, ms
    }, {});

    /* Expose underlying socket events */
    ['connect', 'end', 'timeout', 'error', 'close'].forEach(function (e) {
        socket.on(e, function() {
            Array.prototype.unshift.call(arguments, e);
            self.emit.apply(self, arguments);
        });
    });

    /* Expose underlying socket methods */
    ['end', 'destroy', 'ref', 'unref', 'pause', 'resume'].forEach(function (f) {
        self[f] = (Object.getPrototypeOf(socket)[f] || function() { throw Error('not implemented'); })
            .bind(socket);
    });

    /* Create parser & emit message once got one */
    var parser = new Parser()
            .add(1, 'type', function(msg, b) {
                return b.toString();
            })
            .add(1, 'nameLen', function(msg, b) {
                return b[0];
            })
            .add('%nameLen', 'name', function(msg, b) {
                return b.toString();
            })
            .add(4, 'bodyLen', function(msg, b) {
                return b.readUInt32BE(0);
            })
            .add('%bodyLen', 'body', function(msg, b) {
                return msg.type === 'j' ? JSON.parse(b.toString()) : new Buffer(b);
            });

    /**
     * On next msg
     */
    parser.on('next', function(msg) {
        self.emit('next', msg);
        self.emit(msg.name, msg.body);
    });

    /**
     * Feed parser with incoming data
     */
    socket.on('data', parser.feed);


    /**
     * Send message
     */
    this.send = function(name, body) {

        var isJson = ! (body instanceof Buffer);
        body = isJson ? new Buffer(JSON.stringify(body)) : body;

        if (body.length > Math.pow(2, 8*4)) {
            throw Error('Too big message, should be < ' + 8*4 + ' bytes');
        }

        // type ::= Buffer(b | j)
        socket.write(new Buffer(isJson ? 'j' : 'b'));

        // nameLen ::= Buffer(1)
        socket.write(new Buffer([name.length]));

        // name ::= Buffer(nameLen)
        socket.write(new Buffer(name));

        // bodyLen ::= Buffer(4)
        var b = new Buffer(4);
        b.writeUInt32BE(body.length, 0);
        socket.write(b);

        // body ::= Buffer(bodyLen)
        socket.write(body);
    };


    /**
     * Request handler
     */
    this.onReq = function(name, callback) {
        parser.on('next', function(msg) {
            var pattern = new RegExp(/^req:(.+):(\w+)$/g),
                match = null;
            if ((match = pattern.exec(msg.name)) !== null) {
                var gotName = match[1],
                    id = match[2];
                if (gotName === name) {
                    callback(msg.body, function(err, respBody) {
                        self.send('resp:' + name + ':' + id, [err, respBody]);
                    });
                }
            }

        });
    };

    /**
     * Send request and avait response
     */
    this.sendReq = function(name, body, callback) {

        var reqId = shortId.generate(),
            reqName = 'req:' + name + ':' + reqId,
            respName = 'resp:' + name + ':' + reqId;

        var isGotResponse = false;

        self.once(respName, function (resp) {
            clearTimeout(timeout);
            isGotResponse = true;
            callback(resp[0], resp[1]);
        });

        var timeout = setTimeout(function() {
            self.removeAllListeners(respName);
            if (!isGotResponse) {
                callback(new Error('Timeout'));
            }
        }, self.config.reqTimeout);

        self.send(reqName, body);

        return reqId;
    };

};

/* Inherit EventEmitter */
util.inherits(Nossock, EventEmitter);


/**
 * Module exports
 */
module.exports = {

    /**
     * Nossock wrapper itself, may be handy as it is
     */
    Nossock: Nossock,

    /**
     * Create client
     */
    createClient: function(/* [type], [options], callback */) {
        var args = Array.prototype.slice.call(arguments),
            callback = args.pop(),
            opts = args.pop() || {},
            type = args.pop() || 'tcp';

        if (['tls', 'tcp'].indexOf(type) == -1) {
            throw new Error('Type could be "tls" or "tcp"');
        }
        var socket = (type == 'tls' ? tls : net).connect(opts, function() {
                callback(nossocket);
            }),
            nossocket = new Nossock(socket);
        return nossocket;
    },

    /**
     * Create server
     */
    createServer: function( /* [type], [options], callback */) {
        var args = Array.prototype.slice.call(arguments),
            callback = args.pop(),
            opts = args.pop() || {},
            type = args.pop() || 'tcp';

        if (['tls', 'tcp'].indexOf(type) == -1) {
            throw new Error('Type could be "tls" or "tcp"');
        }

        return (type == 'tls' ? tls : net).createServer(opts, function(socket) {
            callback( new Nossock(socket) );
        });
    }
};

