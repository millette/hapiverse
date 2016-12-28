'use strict'

// npm
const glob = require('glob')

// core
const path = require('path')

const makeDdoc = () => {
  const ddoc = { _id: '_design/' + path.basename(__dirname), language: 'javascript' }
  const wrk = (file) => {
    const parts = file.split('/')
    if (parts.length !== 2) { throw new Error('bad path in design doc') }
    if (!ddoc[parts[0]]) { ddoc[parts[0]] = { } }
    ddoc[parts[0]][path.basename(parts[1], '.js')] = require([__dirname, file].join('/'))
  }
  glob.sync('+(views|updates|shows|lists)/*.js', { noDirs: true, cwd: __dirname }).forEach(wrk)
  return ddoc
}

module.exports = makeDdoc()
