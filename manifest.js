'use strict'

const Confidence = require('confidence')
const Config = require('./config')
const criteria = { env: process.env.NODE_ENV }

const url = require('url')

const manifest = {
  $meta: 'This file defines GlassJaw.',
  server: {
    app: { siteTitle: Config.get('/app/siteTitle') },
    cache: {
      engine: 'catbox-memory',
      // engine: 'catbox-redis',
      host: url.parse(process.env.REDIS_PORT || 'http://localhost:6379').hostname
    },
    debug: { log: ['error'] },
    connections: { routes: { security: true } }
  },
  connections: [{
    labels: ['web'],
    port: Config.get('/port/web')
  }],
  registrations: [
    {
      plugin: {
        register: 'hapi-favicon',
        options: { path: 'assets/img/favicon.ico' }
      }
    },
    { plugin: 'hapi-context-credentials' },
    { plugin: 'h2o2' },
    { plugin: 'hapi-boom-decorators' },
    { plugin: 'inert' },
    { plugin: 'vision' },
    { plugin: './server/static/index' },
    {
      plugin: {
        options: {
          db: {
            url: Config.get('/db/url'),
            name: Config.get('/db/name'),
            admin: Config.get('/db/admin'),
            password: Config.get('/db/password')
          },
          remotedb: {
            url: Config.get('/remotedb/url'),
            name: Config.get('/remotedb/name')
          },
          teaser: {
            length: Config.get('/teaser/length')
          }
        },
        register: './server/main/index'
      }
    }
  ]
}

const store = new Confidence.Store(manifest)
exports.get = (key) => store.get(key, criteria)
exports.meta = (key) => store.meta(key, criteria)
