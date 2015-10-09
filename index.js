var util = require('util')
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

util.inherits(LevelSize, abstract.AbstractLevelDOWN)

LevelSize.prototype.type = 'levelsize'

LevelSize.prototype.open = function () {
  this._db.open.apply(this._db, arguments)
}

LevelSize.prototype.close = function () {
  return this._db.close.apply(this._db, arguments)
}

LevelSize.prototype.setDb = function () {
  return this._db.setDb.apply(this._db, arguments)
}

LevelSize.prototype.get = function (key, opts, cb) {
  return this._db.get.apply(this._db, arguments)
}

LevelSize.prototype.approximateSize = function (start, end, cb) {
  return this._db.approximateSize.apply(this._db, arguments)
}

LevelSize.prototype.iterator = function (opts) {
  return abstract.AbstractLevelDOWN.iterator.call(this, opts)
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

LevelSize.prototype.del = function (key, opts, cb) {
  // TODO: get approximate size for this key and update internal size property.
  return this._db.del.apply(this._db, arguments)
}

LevelSize.prototype.getSize = function (cb) {
  debug('getting size')
  this._db.get('level-size!size', function (err, size) {
    if (err) return cb(err)
    cb(null, parseInt(size))
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

LevelSize.prototype.put = function (key, value, opts, cb) {
  var self = this
  if (typeof opts === 'function') {
    cb = opts
    opts = null
  }
  if (!opts) opts = {}
  var len = value.length
  self.getSize(function (err, size) {
    if (err) return cb(err)
    size += len
    if ((size) > self._limit) return cb(self.bye())
    debug('putting', key)
    self._db.put(key, value, opts, function (err) {
      if (err) return cb(err)
      self._updateSize(size, cb)
    })
  })
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
    if (size > self._limit) return cb(self.bye())
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

module.exports = LevelSize
