'use strict'

// core
const url = require('url')
const qs = require('querystring')

// npm
const Wreck = require('wreck')
const _ = require('lodash')

// self
const utils = require('./utils')

const labels = [
  'primary',
  'secondary',
  'success',
  'alert',
  'warning'
]

const labelClass = (keyword) => labels[_.reduce(keyword.split(''), (sum, v) => sum + v.charCodeAt(), 0) % 5]

const hapiKeywordsMapper = (db, request, callback) => {
  const dest = db + '/_design/app/_view/byKeyword?' + qs.stringify({
    reduce: false,
    startkey: '["hapi"]',
    endkey: '["hapi\\ufff0"]'
  })
  callback(null, dest, { accept: 'application/json' })
}

const hapiKeywordsResponder = (err, res, request, reply) => {
  // console.log('ER3:', err)
  if (err) { return reply(err) } // FIXME: how to test?
  if (res.statusCode >= 400) { return reply.boom(res.statusCode, new Error(res.statusMessage)) }
  const go = (err, payload) => {
    // console.log('ER2:', err)
    if (err) { return reply(err) } // FIXME: how to test?
    // console.log('PATH:', request.path)
    // console.log('PL-LEN:', payload.rows.length)
    const rows = payload.rows
      .map((row) => {
        row.keyword = row.key[0]
        row.description = row.key[2]
        row.labelClass = labelClass(row.keyword)
        delete row.key
        delete row.value
        return row
      })

    const result = _.groupBy(rows, (v) => v.id)

    const out = []
    let r
    for (r in result) {
      out.push({
        id: r,
        description: result[r][0].description,
        tags: result[r].map((g) => {
          return {
            keyword: g.keyword,
            labelClass: g.labelClass
          }
        })
      })
    }
    reply(out.sort((a, b) => {
      if (a.id > b.id) { return 1 }
      if (a.id < b.id) { return -1 }
      return 0
    }))
  }
  Wreck.read(res, { json: true }, go)
}

const proxyMethod = (server, name, mapper, responder) => {
  server.method(name,
    () => server.inject({
      url: '/' + name,
      allowInternals: true,
      validate: false
    })
      .then((res) => res.result),
    {
      callback: false,
      cache: {
        generateTimeout: 5000,
        expiresIn: 900000 // 30000 // 900000 // 15 min. // 15000
      }
    }
  )

  server.route({
    method: 'GET',
    path: '/' + name,
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
}

const info = function (request, reply) {
  request.server.methods.hapiKeywords((err, res) => {
    // console.log('ER-A:', err)
    if (err) { return reply(err) }
    reply(res)
  })
}

exports.register = (server, options, next) => {
  const dbUrl = url.resolve(options.db.url, options.db.name)
  const remotedbUrl = url.resolve(options.remotedb.url, options.remotedb.name)

  proxyMethod(server, 'hapiKeywords', hapiKeywordsMapper.bind(this, remotedbUrl), hapiKeywordsResponder)

  server.route({
    method: 'GET',
    path: '/',
    handler: { view: 'hello' }
  })

  server.route({
    method: 'GET',
    path: '/ids',
    config: {
      pre: [
        { method: info, assign: 'info' }
      ],
      handler: function (request, reply) {
        reply.view('pre', { len: request.pre.info.length, ids: request.pre.info.map((x) => x.id) })
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/yo',
    config: {
      pre: [
        { method: info, assign: 'info' },
        { method: utils.pager, assign: 'pager' }
      ],
      handler: function (request, reply) {
        const page = request.query && request.query.page || 1
        const start = (page - 1) * utils.perPage
        reply.view('yeah', { pager: request.pre.pager, modules: request.pre.info.slice(start, start + utils.perPage) })
      }
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
