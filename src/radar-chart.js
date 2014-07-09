var RadarChart = {
  chart: function() {
    // default config
    var cfg = {
      containerClass: 'radar-chart',
      radius: 5,
      w: 600,
      h: 600,
      factor: 0.95,
      factorLegend: 1,
      levels: 3,
      maxValue: 0,
      radians: 2 * Math.PI,
      color: d3.scale.category10()
    };

    function radar(selection) {
      selection.each(function(data) {
        var container = d3.select(this);

        // allow simple notation
        data = data.map(function(datum) {
          if(datum instanceof Array) {
            datum = {axes: datum};
          }
          return datum;
        });

        var maxValue = Math.max(cfg.maxValue, d3.max(data, function(d) { 
          return d3.max(d.axes, function(o){ return o.value; });
        }));

        var allAxis = data[0].axes.map(function(i, j){ return i.axis; });
        var total = allAxis.length;
        var radius = cfg.factor * Math.min(cfg.w / 2, cfg.h / 2);

        container.classed(cfg.containerClass, 1);

        function getPosition(i, range, factor, func){
          factor = typeof factor !== 'undefined' ? factor : 1;
          return range * (1 - factor * func(i * cfg.radians / total));
        }
        function getHorizontalPosition(i, range, factor){
          return getPosition(i, range, factor, Math.sin);
        }
        function getVerticalPosition(i, range, factor){
          return getPosition(i, range, factor, Math.cos);
        }

        // levels && axises
        var levelFactors = d3.range(0, cfg.levels).map(function(level) {
          return radius * ((level + 1) / cfg.levels);
        });

        var levelGroups = container.selectAll('g.level-group').data(levelFactors);

        levelGroups.enter().append('g');
        levelGroups.exit().remove();

        levelGroups.attr('class', function(d, i) {
          return 'level-group level-group-' + i;
        });

        var levelLine = levelGroups.selectAll('.level').data(function(levelFactor) {
          return d3.range(0, total).map(function() { return levelFactor; });
        });

        levelLine.enter().append('line');
        levelLine.exit().remove();

        levelLine
          .attr('class', 'level')
          .attr('x1', function(levelFactor, i){ return getHorizontalPosition(i, levelFactor); })
          .attr('y1', function(levelFactor, i){ return getVerticalPosition(i, levelFactor); })
          .attr('x2', function(levelFactor, i){ return getHorizontalPosition(i+1, levelFactor); })
          .attr('y2', function(levelFactor, i){ return getVerticalPosition(i+1, levelFactor); })
          .attr('transform', function(levelFactor) {
            return 'translate(' + (cfg.w/2-levelFactor) + ', ' + (cfg.h/2-levelFactor) + ')';
          });

        var axis = container.selectAll('.axis').data(allAxis);

        var newAxis = axis.enter().append('g');
        newAxis.append('line');
        newAxis.append('text');

        axis.exit().remove();

        axis.attr('class', 'axis');

        axis.select('line')
            .attr('x1', cfg.w/2)
            .attr('y1', cfg.h/2)
            .attr('x2', function(d, i) { return getHorizontalPosition(i, cfg.w / 2, cfg.factor); })
            .attr('y2', function(d, i) { return getVerticalPosition(i, cfg.h / 2, cfg.factor); });

        axis.select('text')
            .attr('class', function(d, i){
              var p = getHorizontalPosition(i, 0.5);

              return 'legend ' +
                ((p < 0.4) ? 'left' : ((p > 0.6) ? 'right' : 'middle'));
            })
            .attr('dy', function(d, i) {
              var p = getVerticalPosition(i, 0.5);
              return ((p < 0.1) ? '1em' : ((p > 0.9) ? '0' : '0.5em'));
            })
            .text(function(d) { return d; })
            .attr('x', function(d, i){ return getHorizontalPosition(i, cfg.w / 2, cfg.factorLegend); })
            .attr('y', function(d, i){ return getVerticalPosition(i, cfg.h / 2, cfg.factorLegend); });


        // content
        data.forEach(function(d){
          d.axes.forEach(function(axis, i) {
            axis.x = getHorizontalPosition(i, cfg.w/2, (parseFloat(Math.max(axis.value, 0))/maxValue)*cfg.factor);
            axis.y = getVerticalPosition(i, cfg.h/2, (parseFloat(Math.max(axis.value, 0))/maxValue)*cfg.factor);
          });
        });

        var polygon = container.selectAll(".area").data(data);

        polygon.enter().append('polygon');
        polygon.exit().remove();

        polygon
          .attr('class', function(d, i) {
            return 'area radar-chart-serie' + i + (d.className ? ' ' + d.className : '');
          })
          .style('stroke', function(d, i) { return cfg.color(i); })
          .style('fill', function(d, i) { return cfg.color(i); })
          .attr('points',function(d) {
            return d.axes.map(function(p) {
              return [p.x, p.y].join(',');
            }).join(' ');
          })
          .on('mouseover', function (d){
            container.classed('focus', 1);
            d3.select(this).classed('focused', 1);
          })
          .on('mouseout', function(){
            container.classed('focus', 0);
            d3.select(this).classed('focused', 0);
          });


        var circleGroups = container.selectAll('g.circle').data(data);

        circleGroups.enter().append('g').classed('circle', 1);
        circleGroups.exit().remove();

        circleGroups.attr('class', function(d) {
          return 'circle ' + (d.className ? ' ' + d.className : '');
        });
        var circle = circleGroups.selectAll('circle').data(function(datum, i) {
          return datum.axes.map(function(d) { return [d, i]; });
        });

        circle.enter().append('circle');
        circle.exit().remove();

        var tooltip = container.selectAll('.tooltip').data([1]);
        tooltip.enter().append('text').attr('class', 'tooltip');

        circle
          .attr('class', function(d) {
            return 'radar-chart-serie'+d[1];
          })
          .attr('r', cfg.radius)
          .attr('cx', function(d) {
            return d[0].x;
          })
          .attr('cy', function(d) {
            return d[0].y;
          })
          .style('fill', function(d) { return cfg.color(d[1]); })
          .on('mouseover', function(d){
            tooltip
              .attr('x', d[0].x - 10)
              .attr('y', d[0].y - 5)
              .text(d[0].value)
              .classed('visible', 1);

            container.classed('focus', 1);
            container.select('.area.radar-chart-serie'+d[1]).classed('focused', 1);
          })
          .on('mouseout', function(d){
            tooltip.classed('visible', 0);

            container.classed('focus', 0);
            container.select('.area.radar-chart-serie'+d[1]).classed('focused', 0);
          });

        // ensure tooltip is upmost layer
        var tooltipEl = tooltip.node();
        tooltipEl.parentNode.appendChild(tooltipEl); 
      });
    }

    radar.config = function(value) {
      if(!arguments.length) {
        return cfg;
      }
      if(arguments.length > 1) {
        cfg[arguments[0]] = arguments[1];
      }
      else {
        d3.entries(value || {}).forEach(function(option) {
          cfg[option.key] = option.value;
        });
      }
      return radar;
    };

    return radar;
  },
  draw: function(id, d, options) {
    var chart = RadarChart.chart().config(options);
    var cfg = chart.config();

    d3.select(id).select('svg').remove();
    d3.select(id)
      .append("svg")
      .attr("width", cfg.w)
      .attr("height", cfg.h)
      .datum(d)
      .call(chart);
  }
};
