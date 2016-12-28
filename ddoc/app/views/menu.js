/* globals emit */

'use strict'

module.exports = {
  map: function (doc) {
    const parts = doc._id.split(':')
    if (parts.length !== 2) { return }
    const obj = { path: '/' + doc._id }
    const weight = doc.weight ? parseInt(doc.weight, 10) : 999
    if (doc.menu_title) {
      obj.title = doc.menu_title
    } else if (doc.title) {
      obj.title = doc.title
    }
    // no title or menu_title? Skip this doc
    if (!obj.title) { return }
    if (doc._attachments) {
      if (doc._attachments['top-image-1.jpeg']) {
        obj.img = obj.path + '/top-image-1.jpeg'
      } else if (doc._attachments['top-image-1.png']) {
        obj.img = obj.path + '/top-image-1.png'
      }
    }
    emit([parts[0], weight], obj)
  },
  reduce: '_count'
}
