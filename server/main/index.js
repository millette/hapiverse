'use strict'

// core
const url = require('url')
const qs = require('querystring')

// npm
const Wreck = require('wreck')

exports.register = (server, options, next) => {
  const dbUrl = url.resolve(options.db.url, options.db.name)
  const remotedbUrl = url.resolve(options.remotedb.url, options.remotedb.name)

  const mapper = (request, callback) => {
    const dest = remotedbUrl + '/_design/app/_view/byKeyword?' + qs.stringify({
      reduce: false,
      startkey: '["hapi"]',
      endkey: '["hapi\\ufff0"]'
    })
    callback(null, dest, { accept: 'application/json' })
  }

  const responder = (err, res, request, reply) => {
    if (err) { return reply(err) } // FIXME: how to test?
    if (res.statusCode >= 400) { return reply.boom(res.statusCode, new Error(res.statusMessage)) }
    const go = (err, payload) => {
      if (err) { return reply(err) } // FIXME: how to test?
      console.log('PATH:', request.path)
      console.log('PL-LEN:', payload.rows.length)
      reply(payload.rows.map((row) => {
        row.keyword = row.key[0]
        row.description = row.key[2]
        delete row.key
        delete row.value
        return row
      }))
    }
    Wreck.read(res, { json: true }, go)
  }

  server.method('hapiKeywords',
    () => server.inject({
      url: '/hapiKeywords',
      allowInternals: true,
      validate: false
    }).then((res) => res.result),
    {
      callback: false,
      cache: {
        generateTimeout: 5000,
        expiresIn: 900000 // 15 min.
      }
    }
  )

  server.route({
    method: 'GET',
    path: '/hapiKeywords',
    config: {
      isInternal: true,
      handler: {
        proxy: {
          mapUri: mapper,
          onResponse: responder
        }
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/',
    handler: { view: 'hello' }
  })

  server.route({
    method: 'GET',
    path: '/yo',
    handler: function (request, reply) {
      server.methods.hapiKeywords((err, res) => {
        if (err) { return reply(err) }
        reply.view('yeah', { modules: res.slice(0, 48) })
      })
    }
  })

  console.log(`Local CouchDB: ${dbUrl}`)
  console.log(`Remote CouchDB: ${remotedbUrl}`)
  next()
}

exports.register.attributes = {
  dependencies: ['h2o2'],
  name: 'main'
}
