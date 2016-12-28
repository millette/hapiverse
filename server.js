'use strict'

// self
const Config = require('./config')
const Composer = require('./index')
const ddocManager = require('./ddoc/index')

ddocManager(Config, function (err, resp) {
  if (err) { console.log('Push error:', err) }
  console.log('Pushing:', resp)
})

Composer((err, server) => {
  if (err) { throw err }

  server.register(['inert', 'hapi-context-app', 'vision', 'hapi-error'].map((dep) => require(dep)), (err) => {
    if (err) { throw err }
    server.views({
      engines: { html: require('lodash-vision') },
      path: 'templates',
      partialsPath: 'templates/partials',
      isCached: Config.get('/cache/web')
    })

    server.start((err) => {
      if (err) { throw err }
      console.log(new Date())
      console.log('\nStarted the web server on port ' + server.info.port)
    })
  })
})
