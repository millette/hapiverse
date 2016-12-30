/* globals emit */

'use strict'

module.exports = {
  map: function (doc) {
    emit(doc._id, { rev: doc._rev })
  }
}
