let width = 750, height = 450;
let margin = { top: 20, right: 15, bottom: 30, left: 40 };
let w = width - margin.left - margin.right;
let h = height - margin.top - margin.bottom;

let dataset, maxVol, maxPrice, maxeValue, maxDelta, ranges, filter_query;
let chart, tooltip, x, y, col;
let attributes = ["weeksOnBoard", "date", "peakRank"];// list of attributes

initiate()

async function initiate() {
  // read and cleaning data
  dataset = await d3.csv("charts.csv");

  // get data statistics;
  // declare all ranges that are currently selected for sliders
  ranges = {};
  //note how filter query stores all attributes current ranges
  filter_query = [];
  for (let attr of attributes) {
    let column = dataset.map(d => d[attr]);
    
    ranges[attr] = attr !== "peakRank" 
      ? [d3.min(column),d3.max(column)]
      : [d3.max(column),d3.min(column)]

    filter_query.push({
      key: attr,
      range: [ // deep copy
        ranges[attr][0],
        ranges[attr][1]
      ]
    })
  }

  // // define any slider functions here, since depend on max of variables
  // $(function () {
  //   $("#vol").slider({
  //     range: true,
  //     min: ranges.vol[0],
  //     max: ranges.vol[1],
  //     values: ranges.vol,
  //     slide: function (event, ui) {
  //       $("#volamount").val(ui.values[0] + " - " + ui.values[1]);
  //       filterData("vol", ui.values);
  //     }
  //   });
  //   $("#volamount").val($("#vol").slider("values", 0) +
  //     " - " + $("#vol").slider("values", 1));
  // });

  // $(function () {
  //   $("#delta").slider({
  //     range: true,
  //     min: ranges.delta[0],
  //     max: ranges.delta[1],
  //     values: ranges.delta,
  //     slide: function (event, ui) {
  //       $("#deltaamount").val(ui.values[0] + " - " + ui.values[1]);
  //       filterData("delta", ui.values);
  //     }
  //   });
  //   $("#deltaamount").val($("#delta").slider("values", 0) +
  //     " - " + $("#delta").slider("values", 1));
  // });

  // get scales
  x = d3.scaleLinear()
    .domain([0, (Math.ceil(ranges.date[1] / 50) + 1) * 50]) // some offset
    .range([0, w]);

  y = d3.scaleLinear()
    .domain([0, (Math.ceil(ranges.weeksOnBoard[1] / 50) + 1) * 50]) // some offset
    .range([h, 0]);

  col = d3.scaleOrdinal(d3.schemeCategory10);

  // chart object
  chart = d3.select(".chart")
    .attr("width", width)
    .attr("height", height + 15)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // initiate tooltip
  tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // draw axes
  chart.append("g")
    .attr("transform", "translate(0," + h + ")")
    .call(d3.axisBottom(x))
    .append("text")
    .attr("x", w)
    .attr("y", -6)
    .style("text-anchor", "end")
    .style("fill", "black")
    .text("Date");

  chart.append("g")
    .call(d3.axisLeft(y))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .style("fill", "black")
    .text("Weeks On Charts");

  console.log(ranges);

  //all the data is now loaded, so draw the initial vis
  drawVis(dataset);
}

function drawVis(dataset) { //draw the circiles initially and on each interaction with a control
  let circle = chart.selectAll("circle")
    .data(dataset, d => d.artist); // assign key!!!

  // filter out first
  circle.exit().remove();

  // enter (keyed data)
  circle.enter().append("circle")
    .attr("cx", d => x(d.date))
    .attr("cy", d => y(d.weeksOnBoard))
    //.style("fill", d => col(d.type))
    .attr("r", 4)
    .style("stroke", "black")
    .style("opacity", 0.5)
    .on("mouseover", function (event, d, i) {
      d3.select(this).attr("r", 8);
      tooltip.transition()
        .duration(200)
        .style("opacity", 1);
      tooltip.html("Track <b>" + d.track + "</b>: " + "date=" + d.date + ", weeksOnBoard=" + d.weeksOnBoard + "<br>" + "peakRank=" + d.peakRank)
        .style("left", (event.pageX + 5) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function (d, i) {
      d3.select(this).attr("r", 4);
      tooltip.transition()
        .duration(500)
        .style("opacity", 0.5);
    });

    console.log(dataset[0]["peakRank"])

}

//will need to do things slightly differently if all is selected in dropdown, so keep pattern for matching against mytype
let patt = new RegExp("all");

function filterData(_attr, values) {
  //HERE update filter query, filter the data, pass it to drawVis
  console.log("ranges", ranges);

  let filtered = dataset;

  ranges[_attr] = values;

  filtered = filtered.filter(track => track['vol'] >= ranges['vol'][0] && track['vol'] <= ranges['vol'][1]);
  filtered = filtered.filter(track => track['delta'] >= ranges['delta'][0] && track['delta'] <= ranges['delta'][1]);
  filtered = ranges['type'] !== 'all' ? filtered.filter(track => track['type'] === ranges['type']) : filtered_data;

  drawVis(filtered_data);
}

