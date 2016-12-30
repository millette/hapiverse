'use strict'

const perPage = 24

const pager = function (request, reply) {
  const page = parseInt(request.query && request.query.page || 1, 10)
  const nPages = Math.ceil(request.pre.info.length / perPage)
  const show = 3

  let t
  let r
  let l
  let left = []
  let right = []
  for (t = 1; t <= show; ++t) {
    l = page - t
    if (l >= 1) { left.push(l) }
    r = page + t
    if (r <= nPages) { right.push(r) }
  }

  left = left.sort((a, b) => {
    if (a > b) return 1
    if (a < b) return -1
    return 0
  })

  const l0 = left[0]
  if (l0 > 3) {
    left.unshift('...')
  } else if (l0 > 2) {
    left.unshift(2)
  }
  if (l0 > 1) { left.unshift(1) }

  const r0 = right[right.length - 1]
  if (r0 < nPages - 2) {
    right.push('...')
  } else if (r0 < nPages - 1) {
    right.push(nPages - 1)
  }
  if (r0 < nPages) { right.push(nPages) }

  let full = left
    .concat(page, right)
    .map((x) => {
      if (x === '...') return x
      if (x === page) return { v: x, current: true }
      return x
    })

  if (page === 1) {
    full.unshift({ v: 'prev', disabled: true })
  } else {
    full.unshift({ v: 'prev', page: page - 1 })
  }

  if (page === nPages) {
    full.push({ v: 'next', disabled: true })
  } else {
    full.push({ v: 'next', page: page + 1 })
  }

  reply(full)
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
        generateTimeout: 15000,
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

module.exports = {
  proxyMethod: proxyMethod,
  pager: pager,
  perPage: perPage
}
