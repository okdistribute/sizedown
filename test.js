var test = require('tape')
var levelsize = require('./')
var memdb = require('memdb')

test('put errors when limit is exceeded', function (t) {
  var db = levelsize(memdb(), 1)
  db.on('ready', function () {
    db.put('akey', 'a value', function (err) {
      t.true(err.message.match(/Exceeds limit/), 'emits proper error')
      t.true(db.writable())
      db.get('akey', function (err, value) {
        t.ok(err.notFound, 'data was not written')
        t.notOk(value, 'value empty')
        t.end()
      })
    })
  })
})

test('put ok without exceeded limit', function (t) {
  var db = levelsize(memdb(), 100 * 1000 * 1000)
  db.on('ready', function () {
    db.put('akey', 'a value', function (err) {
      t.ifError(err, 'no error')
      t.true(db.writable()) // still writable
      db.get('akey', function (err, value) {
        t.ifError(err)
        t.same(value, 'a value')
        t.end()
      })
    })
  })
})

test('batch ok without exceeded limit', function (t) {
  var db = levelsize(memdb(), 100 * 1000 * 1000)
  db.batch([{
    type: 'put',
    key: 'hello',
    value: 'world'
  }, {
    type: 'put',
    key: 'hej',
    value: 'verden'
  }], function (err) {
    t.error(err, 'no err')
    db.get('hello', function (err, value) {
      t.error(err, 'no err')
      t.same(value, 'world')
      db.get('hej', function (err, value) {
        t.error(err, 'no err')
        t.same(value, 'verden')
        t.end()
      })
    })
  })
})
