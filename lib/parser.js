/**
 * parser.js - binary protocol parser
 * @author Yaroslav Pogrebnyak
 */

var util = require('util'),
    events = require('events');

/**
 * Parser. Utilizes one reusable buffer, and
 * incresases it's size if needed
 */
var Parser = module.exports = function(fields) {

    var self = this,
        buffer = new Buffer(Math.pow(2, 8*2)),
        a = 0, // left position in buffer
        b = 0, // right
        msg = {},
        curFieldPos = 0;

    /**
     * Add next field to the parser
     */
    this.add = function(c, name, tr) {
        fields = fields || [];
        fields.push({
            length: c,
            name: name,
            transformer: tr
        });
        return self;
    };

    /**
     * Ensure buffer have enough size
     * to keep 'siz' more bytes
     */
    var ensureBuffer = function(siz) {
        while (siz > buffer.length - b) {
            var old = buffer;
            buffer = new Buffer(old.length * 2);
            old.copy(buffer);
        }
    };


    /**
     * Parse next message if enough data in buffer
     */
    var parse = function() {

        while (curFieldPos < fields.length) {

            var field = fields[curFieldPos];
            var length = field.length[0] === '%' ? msg[field.length.slice(1)] : field.length;

            /* wait until we have enough data in buffer */
            if (b - a < length) {
                return null;
            }

            if (!msg[field.name]) {
                var d = buffer.slice(a, a + length);
                a += length;
                msg[field.name] = field.transformer(msg, d);
            }

            curFieldPos++;
        }

        // Continue parsing before next IO
        process.nextTick(function() {
            msg = {};
            curFieldPos = a = b = 0;
            parse();
        });

        // Got new message, push to callback
        self.emit('next', msg);
    };


    /**
     * Feed parser with more data
     */
    this.feed = function(data) {

        ensureBuffer(data.length);

        data.copy(buffer, b);
        b += data.length;

        parse();
    };

};

/* Inherit EventEmitter */
util.inherits(Parser, events.EventEmitter);
