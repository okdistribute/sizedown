# sizedown

A LevelDOWN that monitors and optionally limits the on-disk size.

[![Travis](http://img.shields.io/travis/karissa/level-size.svg?style=flat)](https://travis-ci.org/karissa/level-size)

```
npm install sizedown
```

### `db = sizedown([leveldown], [bytes])`

## Example

Monitor the size and see the current size in bytes with `db.db.getSize`:

```js
var sizedown = require('sizedown')

function down (loc) {
  return sizedown(memdown(loc), 0)
}

var db = levelup('test', {db: )})
db.put('akey', 'a value', function (err) {
  t.ifError(err, 'no error')
  db.get('akey', function (err, value) {
    t.ifError(err)
    t.same(value, 'a value')
    db.db.getSize(function (err, size) {
      t.ifError(err)
      t.same(size, 7)
      t.end()
    })
  })
})
```


```js
var bytes = 1 // number of bytes to allow via put and batch before erroring
var db = sizedown(memdown(), {limit: bytes})

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
