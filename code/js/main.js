var margin = { top: 20, right: 145, bottom: 0, left: 145 },
  width = 700
  height = 500;

var svg_scatter = d3.select("#scatter").append("svg")
  .attr("width", width)
  .attr("height", height + margin.top + margin.bottom);

var svg_stackedbar = d3.select("#stackedbar").append("svg")
  .attr("width", 200)
  .attr("height", height + margin.top + margin.bottom);

//initiate player dropdown

var dropdown = d3.select("#player");

d3.csv("data/" + d3.select("#year").property("value") + "_closestdefender.csv", function(data) {
	var data = data.filter(function(d) {
			if (d.dis == "0-2 Feet") {
				return d;
			}
		});
	data = data.sort(function(a,b){return d3.ascending(a.name, b.name)});
	dropdown.selectAll("option").data(data).enter().append("option")
		.text(function(d){return d.name;})
		.attr("value", function(d){return d.name;})
		.attr("selected", function(d){
			if (d.name == "LeBron James") {
				return "selected";
			}
		});
});

drawScatter()

// redraw scatter on dropdown change

d3.select('#year')
  .on('change', function() {
    refreshdropdown();
    drawScatter();
  });

d3.select('#player')
  .on('change', function() {
    drawScatter();
  });

function drawScatter() {

  // initiate placeholder

  d3.csv("data/" + d3.select("#year").property("value") + "_closestdefender.csv", function(data) {
    data.forEach(function(d) {       
      d.freq = +d.freq //convert strings to numbers
      d.fga = +d.fga
      d.eFG = +d.eFG
    });

    var padding = 40; 
    var label_padding = 2;

    // remove previous graph
    svg_scatter.selectAll("*").remove();
    d3.select(".tooltip").remove();

    // scales and axes
    var xScale = d3.scaleBand()
      .domain(["0-2 Feet", "2-4 Feet", "4-6 Feet", "6+ Feet"])
      .range([padding, width - 10]);

    var yScale = d3.scaleLinear()
	  .domain([0.3, 0.8])
	  .range([height - padding, 10]);

    var xAxis = d3.axisBottom(xScale);

    var yAxis = d3.axisLeft(yScale)
      .tickFormat(d3.format(".0%"));

    svg_scatter.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + (height - padding) + ')')
      .call(xAxis);

    svg_scatter.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(" + padding + ",0)")
      .call(yAxis);

    svg_scatter.append("text") //eFG label
      .text("eFG%")
      .attr("x", padding + 10)
      .attr("y", 20)
      .style("font-size", "20px")
      .attr("fill", "grey");

    svg_scatter.append("text") //Distance Label
      .text("Distance to Closest Defender (ft)")
      .attr("x", 430)
      .attr("y", 450)
      .style("font-size", "20px")
      .attr("fill", "grey");    

    // avg eFG
    svg_scatter.append("line")
      .attr("x1", padding)
      .attr("x2", width-10)
      .attr("y1", yScale(avgeFG(d3.select("#year").property("value"))))
      .attr("y2", yScale(avgeFG(d3.select("#year").property("value"))))
      .style("stroke-dasharray", ("3, 3"))
      .attr("stroke-width", 2)
      .style("opacity", 0.5)
      .attr("stroke", "black");

    // tooltips
    var div = d3.select("#scatter").append("div") 
      .attr("class", "tooltip")       
      .style("opacity", 0);

    // points

    var points = svg_scatter.selectAll("circle").data(data);

    var player_coord = [0,0,0];

    points.enter().append("circle")
      .attr("cx", function(d) {
      	var xval = xScale(d.dis) + 82 + (100 * (gaussianRand()));
      	if (d.name == d3.select("#player").property("value")) {
      		player_coord[2] = d.name;
      		player_coord[0] = xval;
      	}
        return xval;
        })
      .attr("cy", function(d) {
      	var yval = yScale(d.eFG);
      	if (d.name == d3.select("#player").property("value")) {
      		player_coord[1] = yval;
      	}
        return yval;
        })
      .attr("r", function(d) {return initialradius(nametoid(d.name));})
      .attr("id", function(d) {return nametoid(d.name);})
      .attr("class", "player")
      .style("fill", function(d){return mvpcolor(nametoid(d.name));})
      .style("fill-opacity", function(d) {return initialopacity(nametoid(d.name));})

      // tooltips
      .on("mouseover", function(d) { 
	      div.transition()    
	          .duration(200)    
	          .style("opacity", 0.9);    
	      coordinates = d3.mouse( d3.select("#graph-container").node() );
	      div.html(d.name)
	          .style("left", coordinates[0] + 10 + "px")
	          .style("top", coordinates[1] - 30 + "px"); 
	      svg_scatter.selectAll(".player").each(function(){
	      	var selcircle = d3.select(this);
	      	if (selcircle.attr("id") == nametoid(d.name)) {
	      		selcircle.attr("r", 8)
	      			.style("fill-opacity", 1)
	      			.raise();
	      	} else {
	      		selcircle.style("fill-opacity", 0.5);
	      		if (mvpradius(nametoid(selcircle.attr("id"))) == 6) {
	      			selcircle.attr("r", 4);
	      		} else {
	      			selcircle.attr("r", 1);
	      		}
	      	}
          })
          drawStackedBar(d.name);
	  	})

      .on("mouseout", function(d) {   
          div.transition()    
              .duration(500)    
              .style("opacity", 0); 
          svg_scatter.selectAll(".player")
		      .style("fill-opacity", function(d) {return mvpopacity(nametoid(d.name));})
		      .attr("r", function(d) {return mvpradius(nametoid(d.name));});
        })

    // initial tooltip
    div.html(player_coord[2])
    	.style("left", player_coord[0] + 10 + "px")
    	.style("top", player_coord[1] + 150 + "px")
    	.style("opacity", 0.9);

    // key
    svg_scatter.append("line")
      .attr("x1", padding + 105)
      .attr("x2", padding + 130)
      .attr("y1", 13)
      .attr("y2", 13)
      .style("stroke-dasharray", ("3, 3"))
      .attr("stroke-width", 2)
      .style("opacity", 0.5)
      .attr("stroke", "black"); 

    svg_scatter.append("text")
      .text("League Avg eFG%")
      .attr("x", padding + 140)
      .attr("y", 17)
      .style("font-size", "12px")
      .attr("fill", "black");  

    for (i = 0; i < 5; i++) {
    	svg_scatter.append("circle")
    	  .attr("cx", padding + 125)
    	  .attr("cy", 35 + i * 20)
    	  .attr("r", 4)
    	  .style("fill", mvpcolor(mvpresults(d3.select("#year").property("value"))[i]));
    	svg_scatter.append("text")
    	  .text(mvpresults(d3.select("#year").property("value"))[i])
	      .attr("x", padding + 140)
	      .attr("y", 39 + i * 20)
	      .style("font-size", "12px")
	      .attr("fill", "black");  
    }

  })

  //draw initial stack plot
  var stack_player = d3.select("#player").property("value");
  console.log(typeof stack_player);

  if (stack_player.length < 1) {
  		drawStackedBar("LeBron James");
  	} else {
  		drawStackedBar(d3.select("#player").property("value"));
	}
}

function drawStackedBar(name) {

	//remove old stack plot
	svg_stackedbar.selectAll("*").remove();

	//opacity
	svg_stackedbar.attr("opacity", 0.8)

	d3.csv("data/" + d3.select("#year").property("value") + "_closestdefender.csv", function(data) {
		var data = data.filter(function(d) {
			if (d.name == name) {
				return d;
			}
		});
	    data.forEach(function(d) {       
	      d.freq = +d.freq
	      d.fga = +d.fga
	      d.eFG = +d.eFG
	    });	

	    var data = [
	    	{freq1: data[0].freq, freq2: data[1].freq, freq3: data[2].freq, freq4: data[3].freq}
	    ]

	    //create stack
		var stack = d3.stack()
		    .keys(["freq1", "freq2", "freq3", "freq4"])
		    .order(d3.stackOrderNone)
		    .offset(d3.stackOffsetNone);

		var series = stack(data);

		// yScale
    	var yScale = d3.scaleLinear()
		  .domain([1, 0])
		  .range([40, 460]);

		var g_stackedbar = svg_stackedbar.selectAll("g").data(series).enter().append("g");

		g_stackedbar.append("rect")
		  	.attr("x", 10)
		  	.attr("y", function(d) {
		  		return yScale(d[0][1]);
		  	})
		  	.attr("height", function(d) {
		  		return yScale(d[0][0])-yScale(d[0][1]);
		  	})
		  	.attr("width", 110)
		  	.attr("fill", function(d){
		  		if (d.key == 'freq1') {
		  			return "red";
		  		} else if (d.key == 'freq2') {
		  			return "#ff7f7f";
		  		} else if (d.key == 'freq3') {
		  			return "#7fff7f";
		  		} else if (d.key == 'freq4') {
		  			return "green";
		  		}
		  	})

		//numbers on rects
		g_stackedbar.append("text")
			.text(function(d) {
				return Math.round(((d[0][1] - d[0][0])*100)).toString() + "%";
			})
			.attr("x", 65)
			.attr("y", function(d) {
				return yScale(d[0][1]) + (yScale(d[0][0]) - yScale(d[0][1]))/2;
			})
			.style("text-anchor", "middle")
			.style("alignment-baseline", "middle")
			.style("fill", "white")
			.style("font-size", "25px")
			.style("font-weight", "bold");

		// name
		svg_stackedbar.append("text")
		  	.text(name)
		  	.attr("x", 10)
		  	.attr("y", 30)
		  	.style("font-size", "20px")
		    .attr("fill", "black");

		//key
		var colors = ["green", "#7fff7f", "#ff7f7f", "red"];
		var labels = ["6+ ft","4-6 ft","2-4 ft","0-2 ft"];

		svg_stackedbar.append("text")
		  	.text("Frequency")
		  	.attr("x", 130)
		  	.attr("y", 200)
		  	.style("font-size", "15px")
		    .attr("fill", "black");

		for (i = 0; i < 4; i++) {
			svg_stackedbar.append("text")
				.text(labels[i])
				.attr("x", 150)
			  	.attr("y", 220 + 20*i)
			  	.style("font-size", "15px")
			    .attr("fill", "black");
			svg_stackedbar.append("rect")
				.attr("x", 130)
				.attr("y", 208 + 20*i)
				.attr("height", 15)
				.attr("width", 15)
				.attr("fill", colors[i]);
		}
	});
}

// refresh dropdown
function refreshdropdown() {
  var dropdown = d3.select("#player");

  dropdown.selectAll("*").remove()

  d3.csv("data/" + d3.select("#year").property("value") + "_closestdefender.csv", function(data) {
    var data = data.filter(function(d) {
        if (d.dis == "0-2 Feet") {
          return d;
        }
      });
    data = data.sort(function(a,b){return d3.ascending(a.name, b.name)});
    dropdown.selectAll("option").data(data).enter().append("option")
      .text(function(d){return d.name;})
      .attr("value", function(d){return d.name;})
      .attr("selected", function(d){
        if (d.name == "LeBron James") {
          return "selected";
        }
      });
  });
}


// Misc. FUnctions
function avgeFG(year) {
	if (year == "2016-17") {
		return 0.514;
	}
	else if (year == "2015-16") {
		return 0.502;
	}
	else if (year == "2014-15") {
		return 0.496;
	}
	else if (year == "2013-14") {
		return 0.501;
	}
}

function mvpresults(year) {
	if (year == "2016-17") {
		return ["RussellWestbrook", "JamesHarden", "KawhiLeonard", "LeBronJames", "IsaiahThomas"];
	}
	else if (year == "2015-16") {
		return ["StephenCurry", "KawhiLeonard", "LeBronJames", "RussellWestbrook", "KevinDurant"];
	}
	else if (year == "2014-15") {
		return ["StephenCurry", "JamesHarden", "LeBronJames", "RussellWestbrook", "AnthonyDavis"];
	}
	else if (year == "2013-14") {
		return ["KevinDurant", "LeBronJames", "BlakeGriffin", "JamesHarden", "StephenCurry"];
	}
}

function mvpcolor(name) {
    if (mvpresults(d3.select("#year").property("value")).indexOf(name) == 0) {
  		return "red";
  	} else if (mvpresults(d3.select("#year").property("value")).indexOf(name) == 1) {
  		return "blue";
  	} else if (mvpresults(d3.select("#year").property("value")).indexOf(name) == 2) {
  		return "green";
  	} else if (mvpresults(d3.select("#year").property("value")).indexOf(name) == 3) {
  		return "orange";
  	} else if (mvpresults(d3.select("#year").property("value")).indexOf(name) == 4) {
  		return "purple";
  	} else
  		return "black";
}

function initialradius(name) {
	if (nametoid(d3.select("#player").property("value")) == name) {
    	return 8;
    } else if (mvpresults(d3.select("#year").property("value")).indexOf(name) > -1) {
      	return 3;
    } else {
      	return 2;
    }
}

function mvpradius(name) {
    if (mvpresults(d3.select("#year").property("value")).indexOf(name) > -1) {
      	return 6;
    } else {
      	return 2;
    }
}

function initialopacity(name) {
	if (mvpresults(d3.select("#year").property("value")).indexOf(name) > -1) {
      	return 1;
    } 
    if (nametoid(d3.select("#player").property("value")) == name) {
    	return 1;
    } else
      	return 0.5;
}

function mvpopacity(name) {
	if (mvpresults(d3.select("#year").property("value")).indexOf(name) > -1) {
      	return 1;
    } else
      	return 0.5;
}

function gaussianRand() {
  var rand = 0;

  for (var i = 0; i < 6; i += 1) {
    rand += Math.random();
  }

  return (rand / 6) - 0.5;
}

function nametoid(name) {
	return(name.replace(/\s+/g, '').replace('.', '').replace("'", ''))
}
