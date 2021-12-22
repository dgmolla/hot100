let width = 750, height = 450;
let margin = { top: 20, right: 15, bottom: 30, left: 40 };
let w = width - margin.left - margin.right;
let h = height - margin.top - margin.bottom;

let dataset, maxVol, maxPrice, maxeValue, maxDelta, ranges, filter_query;
let chart, tooltip, legend, x, y, col;
let attributes = ["artist", "genre", "weeksOnBoard", "date", "peakRank", "danceability", "acousticness", "valence", "loudness"];// list of attributes

var myFormat = d3.timeFormat("%Y-%m-%d");
var parseDate = d3.timeParse(myFormat);

initiate()

async function initiate() {
  // read and cleaning data
  let charts = await d3.csv("charts.csv");
  charts.forEach( (c, i) => {
    c.date = parseDate(c.date);
    c.weeksOnBoard = +c.weeksOnBoard;
    c.peakRank = +c.peakRank;
    c.danceability = +c.danceability;
    c.acousticness = +c.acousticness;
    c.loudness = +c.loudness;
    c.valence = +c.valence;
  })
  dataset = charts;

  // get data statistics;
  // declare all ranges that are currently selected for sliders
  ranges = {};
  
  //note how filter query stores all attributes current ranges
  filter_query = [];
  for (let attr of attributes) {
    let column = dataset.map(d => d[attr]);

    if (attr !== 'genre' && attr !== 'artist') {
      ranges[attr] = [d3.min(column),d3.max(column)]
    } else {
      ranges[attr] = 'all';
    }
  }

  // define any slider functions here, since depend on max of variables
  $(function () {
    $("#peak").slider({
      range: true,
      min: ranges.peakRank[0],
      max: ranges.peakRank[1],
      values: ranges.peakRank,
      slide: function (event, ui) {
        $("#peakRank").val(ui.values[0] + " - " + ui.values[1]);
        filterData("peakRank", ui.values);
      }
    });
    $("#peakRank").val($("#peak").slider("values", 0) +
      " - " + $("#peak").slider("values", 1));
  });

  $(function () {
    $("#dance").slider({
      range: true,
      min: ranges.danceability[0],
      max: ranges.danceability[1],
      values: ranges.danceability,
      step: .001,
      slide: function (event, ui) {
        $("#danceability").val(ui.values[0] + " - " + ui.values[1]);
        filterData("danceability", ui.values);
      }
    });
    $("#danceability").val($("#dance").slider("values", 0) +
      " - " + $("#dance").slider("values", 1));
  });

  $(function () {
    $("#acoustic").slider({
      range: true,
      min: ranges.acousticness[0],
      max: ranges.acousticness[1],
      values: ranges.acousticness,
      step: .001,
      slide: function (event, ui) {
        $("#acousticness").val(ui.values[0] + " - " + ui.values[1]);
        filterData("acousticness", ui.values);
      }
    });
    $("#acousticness").val($("#acoustic").slider("values", 0) +
      " - " + $("#acoustic").slider("values", 1));
  });

  $(function () {
    $("#valenc").slider({
      range: true,
      min: ranges.valence[0],
      max: ranges.valence[1],
      step: .001,
      values: ranges.valence,
      slide: function (event, ui) {
        $("#valence").val(ui.values[0] + " - " + ui.values[1]);
        filterData("valence", ui.values);
      }
    });
    $("#valence").val($("#valenc").slider("values", 0) +
      " - " + $("#valenc").slider("values", 1));
  });

  $(function () {
    $("#loud").slider({
      range: true,
      min: ranges.loudness[0],
      max: ranges.loudness[1],
      values: ranges.loudness,
      slide: function (event, ui) {
        $("#loudness").val(ui.values[0] + " - " + ui.values[1]);
        filterData("loudness", ui.values);
      }
    });
    $("#loudness").val($("#loud").slider("values", 0) +
      " - " + $("#loud").slider("values", 1));
  });

  // get scales
  x = d3.scaleTime()
    .domain([ranges["date"][0], ranges["date"][1]]) // some offset
    .range([0, w]);

  y = d3.scaleLinear()
    .domain([0, ranges["weeksOnBoard"][1]]) // some offset
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
    .text("Weeks On Board");

  console.log(ranges);

  //all the data is now loaded, so draw the initial vis
  drawVis(dataset);
}

function drawVis(dataset) { //draw the circiles initially and on each interaction with a control
  let circle = chart.selectAll("circle")
    .data(dataset, d => d.song); // assign key!!!

  // filter out first
  circle.exit().remove();

  // enter (keyed data)
  circle.enter().append("circle")
    .attr("cx", d => x(d.date))
    .attr("cy", d => y(d.weeksOnBoard))
    .style("fill", d => col(d.genre))
    .attr("r", 4)
    .style("stroke", "black")
    .style("opacity", 0.5)
    .on("mouseover", function (event, d, i) {
      d3.select(this).attr("r", 8);
      tooltip.transition()
        .duration(200)
        .style("opacity", 1);
      tooltip.html("Song: <b>" + d.song + "</b> " + "<br>Artist: " + d.artist + "<br>Date: " + d.date.toString().substring(4, 15) + "<br>Weeks on Charts: " + d.weeksOnBoard + "<br>Peak Rank: " + d.peakRank)
        .style("left", (event.pageX + 5) + "px")
        .style("top", (event.pageY - 60) + "px");
    })
    .on("mouseout", function (d, i) {
      d3.select(this).attr("r", 4);
      tooltip.transition()
        .duration(500)
        .style("opacity", 0.5);
    });

    //console.log(typeof dataset[0]["date"]);

}

//will need to do things slightly differently if all is selected in dropdown, so keep pattern for matching against mytype
let patt = new RegExp("all");

function filterData(_attr, values) {
  //HERE update filter query, filter the data, pass it to drawVis
  console.log(values);
  let filtered = dataset;

  //handle empty artist search query
  if (_attr === 'artist' && values == "") {
    values = "all";
  }

  ranges[_attr] = values;

  filtered = ranges['genre'] !== 'all' ? filtered.filter(track => track['genre'] === ranges['genre']) : filtered;
  filtered = ranges['artist'] !== 'all' ? filtered.filter(track => track['artist'].toLowerCase().includes(ranges['artist'].toLowerCase())) : filtered;

  filtered = filtered.filter(track => track['peakRank'] >= ranges['peakRank'][0] && track['peakRank'] <= ranges['peakRank'][1]);
  filtered = filtered.filter(track => track['danceability'] >= ranges['danceability'][0] && track['danceability'] <= ranges['danceability'][1]);
  filtered = filtered.filter(track => track['acousticness'] >= ranges['acousticness'][0] && track['acousticness'] <= ranges['acousticness'][1]);
  filtered = filtered.filter(track => track['valence'] >= ranges['valence'][0] && track['valence'] <= ranges['valence'][1]);
  filtered = filtered.filter(track => track['loudness'] >= ranges['loudness'][0] && track['loudness'] <= ranges['loudness'][1]);

  console.log(ranges)

  drawVis(filtered);
}

