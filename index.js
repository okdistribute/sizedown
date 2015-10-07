var sublevel = require('subleveldown')
var util = require('util')
var through = require('through2')
var debug = require('debug')('level-size')
var events = require('events')
var prettyBytes = require('pretty-bytes')

function LevelSize (db, limit) {
  if (!(this instanceof LevelSize)) return new LevelSize(db, limit)
  var self = this
  self.db = db
  self.limit = limit || 25
  self.meta = sublevel(self.db, 'level-size')
  self.meta.put('limit', self.limit)
  self.meta.get('size', function (err, size) {
    if (err & !err.notFound) return self.emit('error', err)
    self.size = size || 0
    self.meta.put('size', self.size, function (err) {
      if (err) return self.emit('error', err)
      self.emit('ready')
    })
  })
  events.EventEmitter.call(this)
}

util.inherits(LevelSize, events.EventEmitter)

LevelSize.prototype.put = function (key, value, opts, cb) {
  var self = this
  if (!self.writable()) return self.bye()
  if (typeof opts === 'function') return self.put(key, value, null, opts)
  if (!opts) opts = {}
  var len = value.length
  if ((self.size + len) > self.limit) return cb(self.bye())
  debug('putting', key)
  self.db.put(key, value, opts, function (err) {
    if (err) return cb(err)
    self.size += len
    cb()
  })
}

LevelSize.prototype.close = function (cb) {
  var self = this
  self.meta.put('size', self.size, function (err) {
    if (err) return cb(err)
    self.db.close(cb)
  })
}

LevelSize.prototype.open = function (cb) {
  return this.db.open(cb)
}

LevelSize.prototype.get = function (key, opts, cb) {
  return this.db.get(key, opts, cb)
}

LevelSize.prototype.batch = function (batches, opts, cb) {
  var self = this
  var batchsize = 0
  for (var i in batches) {
    var batch = batches[i]
    if (batch.type === 'put') {
      batchsize += batch.value.length
    }
  }
  if (batchsize + self.size > self.limit) return cb(self.bye())
  else {
    self.size += batchsize
    return self.db.batch(batches, opts, cb)
  }
}

LevelSize.prototype.writable = function () {
  return this.limit > this.size
}

LevelSize.prototype.bye = function () {
  return new Error('Exceeds limit of ' + prettyBytes(this.limit))
}

module.exports = LevelSize
