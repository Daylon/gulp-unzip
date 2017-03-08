'use strict'

let through = require('through2')
let gutil = require('gulp-util')
let unzip = require('unzipper')
let fs = require('fs')
let defaults = require('defaults')
let path = require('path')

module.exports = function(options = {}){
  function transform(file, enc, callback){
    if (file.isNull()) {
      this.push(file)
      return callback()
    }

    let opts = {}
    , extname = path.extname(file.path)
    , basename = path.basename(file.path, extname)
    , getCwd = (archiveName = '', entryPath) => `./${archiveName}${archiveName.length > 0 ? '/' : ''}${entryPath}`
    opts.filter = function () { return true; }
    opts.keepEmpty = false
    opts.useFolder = false
    Object.assign(opts, options)

    // unzip file
    let self = this
    file.pipe(unzip.Parse())
      .on('entry', function(entry){
        let chunks = []
        if(!opts.filter(entry)){
          entry.autodrain()
          // skip entry
          return
        }

        entry.pipe(through.obj(function(chunk, enc, cb){
          chunks.push(chunk)
          cb()
        }, function(cb){
          if(entry.type == 'File' && (chunks.length > 0 || opts.keepEmpty)){
            self.push(new gutil.File({
              cwd : './',
              path : getCwd(opts.useFolder === true ? basename : '', entry.path),
              contents: Buffer.concat(chunks)
            }))
          }
          cb()
        }))
      }).on('close', function(){
        callback()
      })
  }
  return through.obj(transform)
}
