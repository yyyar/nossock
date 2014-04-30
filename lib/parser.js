/**
 * parser.js - binary protocol parser
 * @author Yaroslav Pogrebnyak
 */

var util = require('util'),
    events = require('events'),
    CircularBuffer = require('./cbuff');

/**
 * Parser. Utilizes one reusable buffer, and
 * incresases it's size if needed
 */
var Parser = module.exports = function(fields) {

    var self = this,
        buffer = new CircularBuffer(),
        msg = {},
        curFieldPos = 0;

    /**
     * Add next field to the parser
     */
    this.add = function(c, name, tr) {
        fields = fields || [];

        var link = parseInt(c) ? null : c.slice(1);

        fields.push({
            length: !link ? function() { return c; } : function() { return msg[link]; },
            name: name,
            transformer: tr
        });
        return self;
    };

    /**
     * Parse next message if enough data in buffer
     */
    var parse = function() {

        while (curFieldPos < fields.length) {

            var field = fields[curFieldPos],
                length = field.length();

            var d = buffer.pull(length);
            if (d === null) {
                return;
            }

            msg[field.name] = field.transformer(msg, d);
            curFieldPos++;
        }

        // Continue parsing before next IO
        process.nextTick(function() {
            msg = {};
            curFieldPos = 0;
            parse();
        });

        // Got new message, push to callback
        self.emit('next', msg);
    };


    /**
     * Feed parser with more data
     */
    this.feed = function(data) {

        buffer.push(data);
        parse();
    };

};

/* Inherit EventEmitter */
util.inherits(Parser, events.EventEmitter);

