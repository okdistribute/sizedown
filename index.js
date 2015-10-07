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
  self.limit = limit
  self.meta = sublevel(self.db, 'level-size')
  self.getSize(function (err, size) {
    if (err & !err.notFound) return self.emit('error', err)
    self._updateSize(size || 0, function () {
      self.emit('ready')
    })
  })
  events.EventEmitter.call(this)
}

util.inherits(LevelSize, events.EventEmitter)

LevelSize.prototype.getSize = function (cb) {
  var self = this
  self.meta.get('size', function (err, size) {
    if (err) return cb(err)
    cb(null, size)
  })
}

LevelSize.prototype._updateSize = function (size, cb) {
  var self = this
  self.meta.put('size', size, function (err) {
    if (err) return self.emit('error', err)
    self.size = size
    return cb()
  })
}

LevelSize.prototype.put = function (key, value, opts, cb) {
  var self = this
  if (typeof opts === 'function') return self.put(key, value, null, opts)
  if (!opts) opts = {}
  if (!self.writable()) return self.bye()
  var len = value.length
  self.getSize(function (err, size) {
    if (err) return cb(err)
    size += len
    if ((size) > self.limit) return cb(self.bye())
    debug('putting', key)
    self.db.put(key, value, opts, function (err) {
      if (err) return cb(err)
      self._updateSize(size, cb)
    })
  })
}

LevelSize.prototype.close = function (cb) {
  return this.db.close(cb)
}

LevelSize.prototype.open = function (cb) {
  return this.db.open(cb)
}

LevelSize.prototype.get = function (key, opts, cb) {
  return this.db.get(key, opts, cb)
}

LevelSize.prototype.batch = function (batches, opts, cb) {
  var self = this
  if (typeof opts === 'function') return self.batch(batches, null, opts)
  if (!opts) opts = {}
  var batchsize = 0
  for (var i in batches) {
    var batch = batches[i]
    if (batch.type === 'put') {
      batchsize += batch.value.length
    }
  }
  self.getSize(function (err, size) {
    if (err) return cb(err)
    size += batchsize
    if (size > self.limit) return cb(self.bye())
    else {
      self._updateSize(size, function () {
        return self.db.batch(batches, opts, cb)
      })
    }
  })
}

LevelSize.prototype.writable = function () {
  return this.limit > this.size
}

LevelSize.prototype.bye = function () {
  return new Error('Exceeds limit of ' + prettyBytes(this.limit))
}

module.exports = LevelSize
