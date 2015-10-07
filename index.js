var sublevel = require('subleveldown')
var through = require('through2')
var prettyBytes = require('pretty-bytes')

module.exports = LevelSize

function LevelSize (opts) {
  var self = this
  if (!opts) opts = {}
  self.limit = opts.limit || 25
  self.db = opts.db
  self.meta = sublevel(self.db, 'level-size')
  self.meta.put('limit', self.limit)
  self.meta.get('size', function (err, size) {
    if (err & !err.notFound) return cb(err)
    self.size = size || 0
    self.meta.put('size', self.size)
  })
}

LevelSize.prototype.put (key, value, opts, cb) {
  var self = this
  if (!self.writable()) return self.bye()
  if (typeof opts === 'function') return this.put(key, value, null, opts)
  if (!opts) opts = {}
  self.meta.get('size', function (err, size) {
    if (err) return cb(err)
    var len = value.length
    if ((size + len) > self.limit) return cb(self.bye())
  })
}

LevelSize.prototype.del (key, cb) {

}

LevelSize.prototype.createWriteStream (opts) {
  var self = this
  if (!self.writable()) return self.bye()
  var stream = self.db.createWriteStream(opts)
  stream.progress = {bytes: 0}
  stream.pipe(through(function (data, enc, cb) {
    stream.progress.bytes += data.length
    if (stream.progress.bytes + self.size > self.limit) {
      stream.end()
      stream.destroy()
      return cb(self.bye())
    }
    return cb(null, data)
  })
  stream.on('end', function () {
    self.size += stream.progress.bytes
  })
  return stream
}

LevelSize.prototype.writable () {
  return self.limit > self.size
}

LevelSize.prototype.bye () {
  return new Error('Exceeds limit of ' + prettyBytes(self.limit)))
}
