var inherits = require('inherits')
var debug = require('debug')('level-size')
var prettyBytes = require('pretty-bytes')
var abstract = require('abstract-leveldown')

function LevelSize (db, opts) {
  if (!opts) opts = {}
  if (!(this instanceof LevelSize)) return new LevelSize(db, opts)
  var self = this
  self._db = db.db || db
  self._limit = opts.limit || 0
  self.getSize(function (err, size) {
    if (err && !err.notFound && !err.message.match(/NotFound/)) throw err
    self._updateSize(size || 0, function (err) {
      if (err) throw err
    })
  })
  abstract.AbstractLevelDOWN.call(this, this._db.location || 'no-location')
}

inherits(LevelSize, abstract.AbstractLevelDOWN)

LevelSize.prototype.type = 'levelsize'

LevelSize.prototype.iterator = function (opts) {
  return new LevelIterator(this._db.iterator(opts))
}

LevelSize.prototype._open = function () {
  this._db.open.apply(this._db, arguments)
}

LevelSize.prototype._close = function () {
  return this._db.close.apply(this._db, arguments)
}

LevelSize.prototype.setDb = function () {
  return this._db.setDb.apply(this._db, arguments)
}

LevelSize.prototype._get = function (key, opts, cb) {
  return this._db.get.apply(this._db, arguments)
}

LevelSize.prototype._approximateSize = function (start, end, cb) {
  return this._db.approximateSize.apply(this._db, arguments)
}

LevelSize.prototype._iterator = function (opts) {
  return this._db.iterator.apply(this._db, arguments)
}

LevelSize.prototype.getProperty = function () {
  return this._db.getProperty.apply(this._db, arguments)
}

LevelSize.prototype.destroy = function () {
  return this._db.destroy.apply(this._db, arguments)
}

LevelSize.prototype.repair = function () {
  return this._db.repair.apply(this._db, arguments)
}

LevelSize.prototype._del = function (key, opts, cb) {
  return this._db.del.apply(this._db, arguments)
}

LevelSize.prototype.getSize = function (cb) {
  debug('getting size')
  this._db.get('level-size!size', function (err, size) {
    if (err) return cb(err)
    return cb(null, parseInt(size, 10))
  })
}

LevelSize.prototype._updateSize = function (size, cb) {
  var self = this
  debug('updating size')
  self._db.put('level-size!size', size, function (err) {
    if (err) return cb(err)
    return cb()
  })
}

LevelSize.prototype._put = function (key, value, opts, cb) {
  var self = this
  if (typeof opts === 'function') return self.put(key, value, null, opts)
  if (!opts) opts = {}
  var len = value && value.length || 0
  self.getSize(function (err, size) {
    if (err) return cb(err)
    size += len
    if (self._limit > 0 && size > self._limit) return cb(self.bye())
    debug('putting', key)
    self._db.put(key, value, opts, cb && function (err) {
      if (err) return cb(err)
      self._updateSize(size, function (err) {
        if (err) throw err
        cb()
      })
    })
  })
}

LevelSize.prototype._batch = function (batches, opts, cb) {
  var self = this
  if (typeof opts === 'function') return self.batch(batches, null, opts)
  if (!opts) opts = {}
  var batchsize = 0
  for (var i in batches) {
    var batch = batches[i]
    if (batch.type === 'put') {
      batchsize += batch && batch.value && batch.value.length || 0
    }
  }
  self.getSize(function (err, size) {
    if (err) return cb(err)
    size += batchsize
    if (self._limit > 0 && size > self._limit) return cb(self.bye())
    else {
      self._updateSize(size, function () {
        return self._db.batch(batches, opts, cb)
      })
    }
  })
}

LevelSize.prototype.bye = function () {
  return new Error('Exceeds limit of ' + prettyBytes(this._limit))
}

function LevelIterator (iterator) {
  this._iterator = iterator
}

LevelIterator.prototype.next = function (cb) {
  this._iterator.next(cb && function (err, key, value) {
    if (err) return cb(err)
    if (key !== 'level-size!size') cb.apply(null, arguments)
  })
}

LevelIterator.prototype.end = function (cb) {
  this._iterator.end(cb)
}

module.exports = LevelSize
