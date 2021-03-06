'use strict'

require('dotenv-safe').load()

const Confidence = require('confidence')
const criteria = { env: process.env.NODE_ENV }

const pkg = require('./package.json')

const url = require('url')

const defFalse = {
  $filter: 'env',
  production: true,
  $default: false
}

const couchdbUrl = url.parse(process.env.COUCHDB_PORT || process.env.DBURL || 'http://localhost:5984')
couchdbUrl.protocol = 'http'
couchdbUrl.pathname = '/'

const config = {
  $meta: 'This file configures Hapiverse.',
  projectName: pkg.name,
  app: { siteTitle: process.env.SITETITLE },
  db: {
    url: url.format(couchdbUrl), // process.env.DBURL,
    name: process.env.DBNAME,
    admin: process.env.DBADMIN,
    password: process.env.DBPASSWORD
  },
  remotedb: {
    url: process.env.REMOTEDBURL || 'https://skimdb.npmjs.com',
    name: process.env.REMOTEDBNAME || 'registry'
  },
  cookie: {
    password: 'password-should-be-32-characters',
    secure: defFalse
  },
  teaser: { length: 1000 },
  cache: { web: defFalse },
  port: {
    web: {
      $filter: 'env',
      test: 9090,
      $default: 8200
    }
  }
}

const store = new Confidence.Store(config)
exports.get = (key) => store.get(key, criteria)
exports.meta = (key) => store.meta(key, criteria)
