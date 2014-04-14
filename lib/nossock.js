/**
 * nossock.js - Evented TCP/TLS socket
 * @author Yaroslav Pogrebnyak
 */

var net = require('net'),
    tls = require('tls'),
    util = require('util'),
    events = require('events'),
    Parser = require('./parser');

/**
 * Secure Evented Socket Wrapper
 */
var Nossock = function(socket) {

    this.socket = socket;

    var self = this;

    /* Forward socket events */
    ['connect', 'end', 'timeout', 'error', 'close'].forEach(function (e) {
        socket.on(e, function() {
            Array.prototype.unshift.call(arguments, e);
            self.emit.apply(self, arguments);
        });
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
                return msg.type === 'j' ? JSON.parse(b.toString()) : b;
            });

    /**
     * On next msg
     */
    parser.on('next', function(msg) {
        self.emit(msg.name, msg.body);
    });


    /**
     * Feed parser with incoming data
     */
    socket.on('data', parser.feed);

    /**
     * End/close
     */
    this.end = function() {
        socket.end();
    };

    /**
     * Send message
     */
    this.send = function(name, body) {

        var isJson = ! (body instanceof Buffer);
        body = isJson ? new Buffer(JSON.stringify(body)) : body;

        if (body.length > Math.pow(2, 8*4)) {
            throw Error('Too big message');
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

};

/* Inherit EventEmitter */
util.inherits(Nossock, events.EventEmitter);


/**
 * Module exports
 */
module.exports = {

    /**
     * tlssock itself, may be handy as it is
     * without create* functions
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
            throw new Error('Type could be tls or tcp');
        }
        var socket = (type == 'tls' ? tls : net).connect(opts);
        callback(new Nossock(socket));
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
            throw new Error('Type could be tls or tcp');
        }

        return (type == 'tls' ? tls : net).createServer(opts, function(socket) {
            callback( new Nossock(socket) );
        });
    }
};

