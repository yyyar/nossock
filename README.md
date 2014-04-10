### Nossock

Nossock is a small lib for implementing lightweight protocols on top of TCP/TLS.

* Fast - serializes objects to JSON. But for Buffer objects sends it as it is with no overhead.
* Lower memory consumption - maintains one reusable buffer for parsing incoming messages.
* TCP & TLS support - easy configurable.
* Simple: No external dependencies.

#### Installation
```bash
$ npm install nossock
```

#### Basic usage
```javascript
var nossock = require('nossock');

var options = {
    host: 'localhost',
    port: 8797
};

/* create server */
    
nossock.createServer(options, function(socket) {
    
    socket.on('hello', function(body) {
        console.log('On server - hello', body);
        socket.send('bye', 'cruel world');
    });
        
}).listen(options.port);


/* create client */
    
nossock.createClient(options, function(socket) {
    
    socket.on('bye', function(body) {
        console.log('On client - bye', body);
    });
        
    socket.send('hello', 'world');
});
```

#### Tests
```bash
$ sudo npm install nodeunit -g
$ npm test
```

#### Restrictions
Due to message structure, message body size is limited to `4096 Mb`. No idea why
you'll want to send such a big message, in any case it worse to split it to
lots of smaller parts.

#### Author
* [Yaroslav Pogrebnyak](https://github.com/yyyar/)

#### Thanks
* Igor Sosyura (help & bugfix)
* Evgeniy Agafonov (original idea)

#### License
MIT

