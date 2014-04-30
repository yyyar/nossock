/**
 * cibuff - Circular Buffer
 * @author Yaroslav Pogrebnyak
 */

/**
 * Circular buffer with dynamic adaptive size
 */
module.exports = function(capacity) {

    if (capacity <= 0) {
        throw Error('Buffer capacity should be > 0');
    }

    var self = this;

    var _buffer = new Buffer(capacity || 1000),
        a = 0,
        b = 0;

    /**
     * Internal data
     */
    Object.defineProperty(this, 'internalBuffer', {
        get: function() { return _buffer; }
    });

    /**
     * Maximum length - capacity
     */
    Object.defineProperty(this, 'capacity', {
        get: function() { return _buffer.length; }
    });

    /**
     * Effective length
     */
    Object.defineProperty(this, 'length', {
        get: function() {
            if (b < a) {
                return self.capacity - a + b;
            } else {
                return b - a;
            }
        }
    });

    /**
     * Checks if there is enough data to pull
     */
    this.canPull = function(len) {
        return self.length >= len;
    };

    /**
     * Grow buffer to fit siz size
     */
    var grow = function(newCapacity) {
        newCapacity = (newCapacity || self.capacity * 2) + 1;
        var newBuffer = new Buffer(newCapacity);

        if (b < a) { // **b___a**
            _buffer.copy(newBuffer, 0, a);
            _buffer.copy(newBuffer, self.capacity - a, 0, b);
        } else { // __a***b__
            _buffer.copy(newBuffer, 0, a, b);
        }

        b = self.length;
        a = 0;
        _buffer = newBuffer;
    };

    /**
     * Push data to buffer
     */
    this.push = function(buf) {

        // Grow buffer if not enough size to handle more data
        if (self.capacity < self.length + buf.length) {
            grow(buf.length + self.length);
        }

        if (a <= b) {
            // __a***b__
            var overflow = buf.length - (self.capacity - b);
            buf.copy(_buffer, b);

            if (overflow < 0) {
                b += buf.length;
            } else {
                buf.copy(_buffer, 0, buf.length-overflow);
                b = overflow;
            }
        } else {
            // ***b___a***
            buf.copy(_buffer, b);
            b += buf.length;
        }
    };



    /**
     * Pull data from buffer
     */
    this.pull = function(len) {

        // Do not pull if there is no enough data
        if (!self.canPull(len)) {
            return null;
        }

        var buf = new Buffer(len);

        if (a <= b) {
            // __a****b__
            _buffer.copy(buf, 0, a, b);
            a += len;
        } else {
            // ***b____a**
            var rest = self.capacity - a,
                overflow = len - rest;

            _buffer.copy(buf, 0, a);

            if (overflow < 0) {
                a += len;
            } else {
                _buffer.copy(buf, rest, 0, overflow);
                a = overflow;
            }
        }

        return buf;
    };

};


