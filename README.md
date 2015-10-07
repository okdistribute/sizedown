# level-size

A LevelDB that limits the (approximate) on-disk size.

[![Travis](http://img.shields.io/travis/karissa/level-size.svg?style=flat)](https://travis-ci.org/karissa/level-size)

```
npm install level-size
```

## `db = levelsize([level], [number of bytes])`

levelsize returns a levelup that

## Example

```js
var levelsize = require('level-size')

var bytes = 1 // number of bytes to allow via put and batch before erroring
var db = levelsize(memdb(), bytes)

db.on('ready', function () {
  db.put('akey', 'a value', function (err) {
    // err.message = 'Exceeds limit of 1 byte'
    db.get('akey', function (err, value) {
      // err.notFound === true
    })
  })
})
```

## How?

Creates a sublevel called 'level-size' with the following keys:

`level-size!total`: upper bound

`level-size!size`: current size

## Issues

* doesn't update the size after a successful delete
