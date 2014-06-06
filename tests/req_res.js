/**
 * simple.js - simple nossock test
 */

var nossock = require('../lib/nossock');

module.exports = {

    'Request-response': function(test) {

        /* create server */
        var server = nossock.createServer(function(socket) {
            socket.onReq('getName', function(body, callback) {
                callback(null, 'Vasya Pupkin');
                socket.end();
                server.close();
            });
        }).listen(8797);

        /* create client */
        nossock.createClient({port: 8797}, function(socket) {
            var id = socket.sendReq('getName', {}, function(err, body) {
                console.log('Req id: ', id);
                test.equal(body, 'Vasya Pupkin', 'Client got what server responded');
                test.done();
            });
        });

    }
};
