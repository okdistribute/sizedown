var test = require('tape')
var memdown = require('memdown')
var levelup = require('levelup')
var sizedown = require('../')
var testCommon = require('./common')
var testBuffer = new Buffer('this-is-test-data')

var down = function (limit) {
  if (!limit) limit = 0 // no limit to pass abstract-leveldown test coverage
  return function (loc) {
    return sizedown(memdown(loc), {limit: limit})
  }
}

/*** compatibility with basic LevelDOWN API ***/

require('abstract-leveldown/abstract/open-test').args(down(0), test, testCommon)
require('abstract-leveldown/abstract/open-test').open(down(0), test, testCommon)
require('abstract-leveldown/abstract/del-test').all(down(0), test, testCommon)
require('abstract-leveldown/abstract/get-test').all(down(0), test, testCommon)
require('abstract-leveldown/abstract/put-test').all(down(0), test, testCommon)
require('abstract-leveldown/abstract/put-get-del-test').all(down(0), test, testCommon, testBuffer)
require('abstract-leveldown/abstract/batch-test').all(down(0), test, testCommon)
require('abstract-leveldown/abstract/chained-batch-test').all(down(0), test, testCommon)
require('abstract-leveldown/abstract/close-test').close(down(0), test, testCommon)
require('abstract-leveldown/abstract/iterator-test').all(down(0), test, testCommon)
require('abstract-leveldown/abstract/ranges-test').all(down(0), test, testCommon)

test('put errors when limit is exceeded', function (t) {
  var db = levelup('test', {db: down(1)})
  db.put('akey', 'a value', function (err) {
    t.true(err.message.match(/Exceeds limit/), 'emits proper error')
    db.get('akey', function (err, value) {
      t.ok(err.notFound, 'data was not written')
      t.notOk(value, 'value empty')
      t.end()
    })
  })
})

test('put ok without limit', function (t) {
  var db = levelup('test', {db: down(0)})
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
})

test('batch ok without exceeded limit', function (t) {
  var limit = 100 * 1000 * 1000
  var db = levelup('test', {db: down(limit)})
  db.on('error', function (err) {
    t.ifError(err)
  })
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
