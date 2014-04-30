/**
 * simple.js - simple nossock test
 */

var fs = require('fs'),
    nossock = require('../lib/nossock');

var serverOpts = {
    cert: fs.readFileSync(__dirname+'/certs/server.crt'),
    key : fs.readFileSync(__dirname+'/certs/server.key'),
    ca  : [fs.readFileSync(__dirname+'/certs/ca.crt')]
};

var clientOpts = {
    host: 'localhost',
    port: 8791,
    cert: fs.readFileSync(__dirname+'/certs/client.crt'),
    key : fs.readFileSync(__dirname+'/certs/client.key'),
    ca  : [fs.readFileSync(__dirname+'/certs/ca.crt')]
};

module.exports = {

    'Many big buffer messages': function(test) {

        var i = 500;
        /* create server */
        var server = nossock.createServer('tls', serverOpts, function(socket) {

            var sen = function() {
                    socket.send('a', new Buffer(1024));
                    setTimeout(function() {
                        if (i-- !== 0) {
                            sen();
                        } else {
                            test.done();
                            socket.end();
                            server.close();
                        }
                    }, 5);
            };
            sen();

        }).listen(8791);

        /* create client */
        nossock.createClient('tls', clientOpts, function(socket) {

            socket.on('a', function(body) {
                //console.log("heap",process.memoryUsage().heapUsed / 1024 / 1024);
            });
        });

    }
};
