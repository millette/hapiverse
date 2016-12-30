'use strict'

// core
const url = require('url')
const qs = require('querystring')

// npm
const Wreck = require('wreck')
const _ = require('lodash')
const got = require('got')

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

  const replicate = function (request, reply) {
    const ids = request.pre.info.map((x) => x.id)
    ids.push('_design/app')

    const o = {
      headers: { 'Content-Type': 'application/json' },
      json: true,
      auth: options.db.admin + ':' + options.db.password,
      body: JSON.stringify({
        source: remotedbUrl,
        target: options.db.name,
        doc_ids: ids
      })
    }

    got.post(url.resolve(options.db.url, '_replicate'), o)
      .then((x) => reply(x.body))
      .catch((e) => {
        console.log('eeee:', e)
        reply(e)
      })
  }

  const mapperKnown = (request, callback) => {
    const dest = dbUrl + '/_design/verse/_view/all'
    callback(null, dest, { accept: 'application/json' })
  }

  const responderKnown = (err, res, request, reply) => {
    // console.log('ER3:', err)
    if (err) { return reply(err) } // FIXME: how to test?
    if (res.statusCode >= 400) { return reply.boom(res.statusCode, new Error(res.statusMessage)) }
    const go = (err, payload) => {
      reply(payload.rows[0].value)
    }
    Wreck.read(res, { json: true }, go)
  }

  const known = function (request, reply) {
    server.inject({url:'/known', validate: false})
      .then((res) => reply(res.result))
      .catch((e) => reply(e))
  }

  utils.proxyMethod(server, 'hapiKeywords', hapiKeywordsMapper.bind(this, remotedbUrl), hapiKeywordsResponder)

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
        { method: known, assign: 'known' },
        { method: info, assign: 'info' }
      ],
      handler: function (request, reply) {
        reply.view('ids', { known: request.pre.known, len: request.pre.info.length, ids: request.pre.info.map((x) => x.id) })
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/known',
    handler: {
      proxy: {
        mapUri: mapperKnown,
        onResponse: responderKnown
      }
    }
  })

  server.route({
    method: 'POST',
    path: '/ids',
    config: {
      pre: [{ method: info, assign: 'info' }],
      handler: replicate
    }
  })

  server.route({
    method: 'GET',
    path: '/all',
    config: {
      pre: [
        { method: info, assign: 'info' },
        { method: utils.pager, assign: 'pager' }
      ],
      handler: function (request, reply) {
        const page = request.query && request.query.page || 1
        const start = (page - 1) * utils.perPage
        reply.view('all', { pager: request.pre.pager, modules: request.pre.info.slice(start, start + utils.perPage) })
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
