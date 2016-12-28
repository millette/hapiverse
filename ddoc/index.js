'use strict'

// npm
const push = require('couchdb-push')

// core
const url = require('url')

module.exports = (Config, callback) => {
  const u = url.parse(Config.get('/db/url'))
  u.auth = Config.get('/db/admin') + ':' + Config.get('/db/password')
  u.pathname = Config.get('/db/name')
  push(url.format(u), 'ddoc/app', { index: true, watch: true }, callback)
}
