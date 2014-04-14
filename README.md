### Nossock

[![Build Status](https://travis-ci.org/yyyar/nossock.svg?branch=master)](https://travis-ci.org/yyyar/nossock)

Nossock is a small lib for implementing lightweight protocols on top of TCP/TLS.

* Fast - serializes objects to JSON. But for Buffer objects sends it as it is with no overhead.
* Lower memory consumption - maintains one reusable buffer for parsing incoming messages.
* TCP & TLS support - easy configurable.
* Simple: No external dependencies.

#### Installation
```bash
$ npm install nossock
```

#### Basic usage, TCP client/server
```javascript
var nossock = require('nossock');

/* create server */

nossock.createServer('tcp', {}, function(socket) {

    socket.on('hello', function(body) {
        console.log('On server - hello', body);
        socket.send('bye', 'cruel world');
    });

}).listen(8797);


/* create client */

nossock.createClient('tcp', {port: 8797}, function(socket) {

    socket.on('bye', function(body) {
        console.log('On client - bye', body);
    });

    socket.send('hello', 'world');
});
```

For more examples, see [tests](https://github.com/yyyar/nossock/tree/master/tests)

#### API

##### `nossock.createServer( [type], [options], callback )`
 * `type` : 'tcp' (default) | 'tls'
 * `options` : options object for underlying tcp or tls `createServer` function
 * `callback` : connection listener

##### `nossock.createClient( [type], [options], callback )`
 * `type`: 'tcp' (default) | 'tls'
 * `options` : options object for underlying tcp or tls `connect` function
 * `callback` : connection listener

##### `Socket (passed to callback)`
 * `socket.send(name, obj)` - send message with name `name` and object `obj`. obj will be serialized in JSON. If obj is instance of Buffer, it won't be serialized and will be sent as it is, with no extra overhead.
 * `socket.on(name, callback)` - subscribe on `name` event. Once got, `callback` will be called with received object as the only parameter. `name` could be anything except of the reserved ones (like `error` or `end`).

##### Events forwarded from underlying socket
`connect`, `end`, `timeout`, `error`, `close`


#### Tests
```bash
$ sudo npm install nodeunit -g
$ npm test
```

#### Restrictions
Due to message structure, message body size is limited to `4096 Mb`. No idea why
you'll want to send such a big message, in any case it worth to split it to
lots of smaller parts.

#### Author
* [Yaroslav Pogrebnyak](https://github.com/yyyar/)

#### Thanks
* Igor Sosyura (help & bugfix)
* Evgeniy Agafonov (original idea)

#### License
MIT

