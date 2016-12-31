/* globals emit */

'use strict'

module.exports = {
  map: function(doc) {
    var r
    for (r in doc.time) {
      if (r !== 'created' && r !== 'modified') {
        emit(doc.time[r].split('T')[0].split('-').map(function (m) {
          return parseInt(m, 10)
        }), r)
      }
    }
  },
  reduce: '_count'
}
