# Nossock - fast messaging over TCP/TLS

Nossock is a small lib for implementing lightweight protocols on top of TCP/TLS.

* Fast - serializes messages, but sends Buffer object with as it is with no overhead.
* Lower memory consumption - maintains one reusable buffer for parsing incoming messages.
* TCP & TLS support - easy configurable.
* Simple: No external dependencies.

## Installation
$ npm install nossock (not yet in npm)

## Basic usage

## Tests
$ sudo npm install nodeunit -g
$ npm test

## Restrictions
- Due to message structure, message body size is limited to 4096 Mb. No idea why
you'll want to send such a big message, in any case it worse to split it to
lots of smaller parts.

## Author
Yaroslav Pogrebnyak <yyyaroslav@gmail.com>

## Thanks
* Igor Sosyura (help & bugfix)
* Evgeniy Agafonov (original idea)

## License
MIT

