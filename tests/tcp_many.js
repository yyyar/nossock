/**
 * simple.js - simple nossock test
 */

var nossock = require('../lib/nossock');

var N = 50;

module.exports = {

    'Many sequential messages': function(test) {

        /* create server */
        var server = nossock.createServer(function(socket) {
            for (var i = 0; i<N; i++) {
                socket.send('i', {i:i});
            }
            socket.end();
            server.close();
        }).listen(8797);

        /* create client */
        nossock.createClient({port: 8797}, function(socket) {
            var count = 0;
            socket.on('i', function(body) {
                test.equal(body.i, count++, 'Client got message ' + body.i);
                if (count == N) {
                    test.done();
                }
            });
        });

    }
};
