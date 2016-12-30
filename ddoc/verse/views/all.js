/* globals emit */

'use strict'

module.exports = {
  map: function (doc) {
    emit(doc.name, { rev: doc._rev })
  },
  reduce: '_count'
}
