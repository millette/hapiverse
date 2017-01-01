/* global $ */

$(function () {
  $(document).foundation()

  var $vis = $('#vis')

  var renderGraph = function () {
    vg.embed($vis[0], {
      mode: 'vega-lite',
      // renderer: 'svg', // canvas by default
      actions: false,
      spec: {
        description: 'A simple bar chart with embedded data.',
        data: { url: '/releases.json' },
        mark: 'bar',
        encoding: {
          column: {
            field: 'month', type: 'ordinal',
            scale: { padding: 4 },
            axis: { orient: 'bottom', axisWidth: 1, offset: -8 }
          },
          y: {
            aggregate: 'sum', field: 'releases', type: 'quantitative',
            axis: { title: 'Releases', grid: false }
          },
          x: {
            field: 'year', type: 'nominal',
            scale: {bandSize: 10},
            axis: false
          },
          color: {
            field: 'year', type: 'nominal'
          }
        },
        config: { facet: { cell : { strokeWidth: 0 } } }
      }
    })
  }

  if ($vis.length) { renderGraph() }

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
