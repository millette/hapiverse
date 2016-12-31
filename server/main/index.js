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
      const aid = a.id.toLowerCase()
      const bid = b.id.toLowerCase()
      if (aid > bid) { return 1 }
      if (aid < bid) { return -1 }
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

  const mapperlocalKeywords = (request, callback) => {
    const dest = dbUrl + '/_design/app/_view/byKeyword?group_level=1'
    // console.log('DEST:', dest)
    callback(null, dest, { accept: 'application/json' })
  }

  const responderlocalKeywords = (err, res, request, reply) => {
    // console.log('ER3:', err)
    if (err) { return reply(err) } // FIXME: how to test?
    if (res.statusCode >= 400) { return reply.boom(res.statusCode, new Error(res.statusMessage)) }
    const go = (err, payload) => {
      if (err) { return reply(err) } // FIXME: how to test?
      reply(payload.rows)
    }
    Wreck.read(res, { json: true }, go)
  }

  const mapperAll = (request, callback) => {
    const dest = dbUrl + '/_design/verse/_view/all?reduce=false&include_docs=true'
    callback(null, dest, { accept: 'application/json' })
  }

  const responderAll = (err, res, request, reply) => {
    // console.log('ER3:', err)
    if (err) { return reply(err) } // FIXME: how to test?
    if (res.statusCode >= 400) { return reply.boom(res.statusCode, new Error(res.statusMessage)) }
    const go = (err, payload) => {
      if (err) { return reply(err) } // FIXME: how to test?
      reply(payload.rows)
    }
    Wreck.read(res, { json: true }, go)
  }

  const mapperModule = (request, callback) => {
    const dest = dbUrl + '/' + request.params.module
    callback(null, dest, { accept: 'application/json' })
  }

  const responderModule = (err, res, request, reply) => {
    // console.log('ER3:', err)
    if (err) { return reply(err) } // FIXME: how to test?
    if (res.statusCode >= 400) { return reply.boom(res.statusCode, new Error(res.statusMessage)) }
    const go = (err, payload) => {
      if (err) { return reply(err) } // FIXME: how to test?
      reply.view('module', payload)
    }
    Wreck.read(res, { json: true }, go)
  }

  const responderModuleModal = (err, res, request, reply) => {
    // console.log('ER3:', err)
    if (err) { return reply(err) } // FIXME: how to test?
    if (res.statusCode >= 400) { return reply.boom(res.statusCode, new Error(res.statusMessage)) }
    const go = (err, payload) => {
      if (err) { return reply(err) } // FIXME: how to test?
      reply.view('moduleModal', payload)
    }
    Wreck.read(res, { json: true }, go)
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
      if (err) { return reply(err) } // FIXME: how to test?
      reply(payload.rows[0].value)
    }
    Wreck.read(res, { json: true }, go)
  }

  const known = function (request, reply) {
    server.inject({ url: '/known', validate: false })
      .then((res) => reply(res.result))
      .catch((e) => reply(e))
  }

  const all = function (request, reply) {
    server.methods.allJson((err, res) => {
      // console.log('ER-A:', err)
      if (err) { return reply(err) }
      if (request.params.keyword) {
        // console.log('K:', res[0])
        reply(res.filter((m) => {
          // return true
          return (m.doc.keywords && m.doc.keywords.indexOf(request.params.keyword) !== -1) ||
            m.doc.versions[m.doc['dist-tags'].latest].keywords.indexOf(request.params.keyword) !== -1
        }))
      } else {
        reply(res)
      }
    })
  }

  const fresh = function (request, reply) {
    server.methods.allJson((err, res) => {
      // console.log('ER-A:', err)
      if (err) { return reply(err) }
      const sorter = (a, b) => {
        const at = a.doc.time[a.doc['dist-tags'].latest]
        const bt = b.doc.time[b.doc['dist-tags'].latest]
        if (at > bt) { return 1 }
        if (at < bt) { return -1 }
        return 0
      }

      if (request.params.keyword) {
        reply(
          res.filter((m) => (m.doc.keywords && m.doc.keywords.indexOf(request.params.keyword) !== -1) ||
              m.doc.versions[m.doc['dist-tags'].latest].keywords.indexOf(request.params.keyword) !== -1
          )
          .sort(sorter)
          .reverse()
        )
      } else {
        reply(res.sort(sorter).reverse())
      }
    })
  }

  const localKeywords = function (request, reply) {
    server.methods.localKeywords((err, res) => {
      // console.log('ER-A:', err)
      if (err) { return reply(err) }
      reply(
        res.sort((a, b) => {
          if (a.value > b.value) { return 1 }
          if (a.value < b.value) { return -1 }
          return 0
        }).reverse()
      )
    })
  }

  utils.proxyMethod(
    server,
    'localKeywords',
    mapperlocalKeywords,
    responderlocalKeywords
  )

  utils.proxyMethod(
    server,
    'allJson',
    mapperAll,
    responderAll
  )

  utils.proxyMethod(
    server,
    'hapiKeywords',
    hapiKeywordsMapper.bind(this, remotedbUrl),
    hapiKeywordsResponder
  )

  server.route({
    method: 'GET',
    path: '/',
    handler: { view: 'hello' }
  })

  server.route({
    method: 'GET',
    path: '/keywords',
    config: {
      pre: [
        { method: localKeywords, assign: 'info' },
        { method: utils.pager, assign: 'pager' }
      ],
      handler: function (request, reply) {
        const page = request.query && request.query.page || 1
        const start = (page - 1) * utils.perPage
        const o = { nKeywords: request.pre.info.length, pager: request.pre.pager, keywords: request.pre.info.slice(start, start + utils.perPage) }
        reply.view('keywords', o)
      }
    }
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
    method: 'GET',
    path: '/module/{module}',
    handler: {
      proxy: {
        mapUri: mapperModule,
        onResponse: responderModule
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/moduleModal/{module}',
    handler: {
      proxy: {
        mapUri: mapperModule,
        onResponse: responderModuleModal
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
    path: '/all/{keyword?}',
    config: {
      pre: [
        { method: all, assign: 'info' },
        { method: utils.pager, assign: 'pager' }
      ],
      handler: function (request, reply) {
        const page = request.query && request.query.page || 1
        const start = (page - 1) * utils.perPage
        const o = { nModules: request.pre.info.length, keyword: request.params.keyword, pager: request.pre.pager, modules: request.pre.info.slice(start, start + utils.perPage) }
        reply.view('all', o)
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/fresh/{keyword?}',
    config: {
      pre: [
        { method: fresh, assign: 'info' },
        { method: utils.pager, assign: 'pager' }
      ],
      handler: function (request, reply) {
        const page = request.query && request.query.page || 1
        const start = (page - 1) * utils.perPage
        const o = { nModules: request.pre.info.length, keyword: request.params.keyword, pager: request.pre.pager, modules: request.pre.info.slice(start, start + utils.perPage) }
        reply.view('all', o)
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
