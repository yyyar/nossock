/**
 * simple.js - simple nossock test
 */

var nossock = require('../lib/nossock');

var options = {
    host: 'localhost',
    port: 8797
};

module.exports = {

    'Test simple TCP two-way messages': function(test) {

        /* create server */
        var server = nossock.createServer(options, function(socket) {
            socket.on('hello', function(body) {
                test.equal(body, 'world', 'Server got what client sent');
                socket.send('bye', 'cruel world');
                socket.end();
                server.close();
            });
        }).listen(options.port);

        /* create client */
        nossock.createClient(options, function(socket) {
            socket.on('bye', function(body) {
                test.equal(body, 'cruel world', 'Client got what server responded');
                test.done();
            });
            socket.send('hello', 'world');
        });

    }
};
