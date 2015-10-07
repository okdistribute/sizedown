var sublevel = require('subleveldown')
var through = require('through2')
var prettyBytes = require('pretty-bytes')

module.exports = LevelSize

function LevelSize (opts) {
  var self = this
  if (!opts) opts = {}
  self.bytes = opts.bytes || 25
  self.db = opts.db
  self.meta = sublevel(self.db, 'level-size')
  self.meta.put('bytes', self.bytes)
  self.meta.get('size', function (err, size) {
    if (err & !err.notFound) return cb(err)
    self.meta.put('size', size || 0)
  })
}

LevelSize.prototype.put (key, value, opts, cb) {
  var self = this
  if (typeof opts === 'function') return this.put(key, value, null, opts)
  if (!opts) opts = {}
  self.meta.get('size', function (err, size) {
    if (err) return cb(err)
    var len = value.length
    if ((size + len) > self.limit) return
  })
}

LevelSize.prototype.del (key, cb) {

}

LevelSize.prototype.createWriteStream (opts) {
  var stream = self.db.createWriteStream(opts)
  stream.progress = {bytes: 0}
  self.meta.get('size', function (err, size) {
    if (err) return cb(err)
    monitor = through(function (data, enc, cb) {
      stream.progress.bytes += data.length
      if (stream.progress.bytes + size > self.bytes) return self.bye(cb)
    })
    stream.pipe(monitor)
  })
  return stream
}

LevelSize.prototype.ok (cb) {
  sel
}

LevelSize.prototype.bye (cb) {
  self.meta.put('')
  return new Error('Exceeds limit of ' + prettyBytes(self.bytes)))
}
