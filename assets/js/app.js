/* global $ */

$(function () {
  $(document).foundation()

  var $mm = $('#module-modal')
  if ($mm.length) {
    $('h4').click(function (ev) {
      $.ajax('/moduleModal/' + $(this).data('module'))
        .done(function(resp){
          $mm.html(resp).foundation('open')
      })
    })
  }
})
