'use strict'

const Confidence = require('confidence')
const Config = require('./config')
const criteria = { env: process.env.NODE_ENV }

const manifest = {
  $meta: 'This file defines GlassJaw.',
  server: {
    app: { siteTitle: Config.get('/app/siteTitle') },
    cache: 'catbox-redis',
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
        options: {
          db: { url: Config.get('/db/url') },
          cookie: {
            password: Config.get('/cookie/password'),
            secure: Config.get('/cookie/secure')
          }
        },
        register: 'hapi-couchdb-login'
      },
      options: { routes: { prefix: '/user' } }
    },
    {
      plugin: {
        register: 'hapi-favicon',
        options: { path: 'assets/img/favicon.ico' }
      }
    },
    { plugin: 'hapi-context-credentials' },
    { plugin: 'h2o2' },
    { plugin: 'inert' },
    { plugin: 'vision' },
    {
      plugin: {
        register: 'hapijs-status-monitor',
        options: {
          title: 'Status monitor',
          path: '/status',
          routeConfig: { auth: { mode: 'required' } }
        }
      }
    },
    { plugin: './server/static/index' },
    {
      plugin: {
        options: {
          db: {
            url: Config.get('/db/url'),
            name: Config.get('/db/name')
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
