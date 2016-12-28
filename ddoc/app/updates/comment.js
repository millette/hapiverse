module.exports = function (doc, req) {
  if (doc) { return [null, 'doc exists, bailing out.'] }
  if (!req.form.message) { return [null, 'missing message, bailing out.'] }
  if (req.form.title || req.form.menu_title) { return [null, 'unacceptable field, bailing out.'] }
  req.form.peer = req.peer
  req.form.headers = req.headers
  req.form._id = req.uuid
  req.form.type = 'comment'
  return [req.form, {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ msg: 'Doc created!', req: req, doc: req.form })
  }]
}
