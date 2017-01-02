/* globals emit */

'use strict'

module.exports = {
  map: function (doc) {
    var r
    const v = doc['dist-tags'] && doc['dist-tags'].latest
    const deps = doc.versions && doc.versions[v] && doc.versions[v].dependencies
    if (!deps) { return }
    for (r in deps) { emit(r) }
  },
  reduce: '_count'
}
