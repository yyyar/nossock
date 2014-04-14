/**
 * simple.js - simple nossock test
 */

var nossock = require('../lib/nossock');

module.exports = {

    'Test simple TCP two-way messages': function(test) {

        /* create server */
        var server = nossock.createServer(function(socket) {
            socket.on('hello', function(body) {
                test.equal(body, 'world', 'Server got what client sent');
                socket.send('bye', 'cruel world');
                socket.end();
                server.close();
            });
        }).listen(8797);

        /* create client */
        nossock.createClient({port: 8797}, function(socket) {
            socket.on('bye', function(body) {
                test.equal(body, 'cruel world', 'Client got what server responded');
                test.done();
            });
            socket.send('hello', 'world');
        });

    }
};
