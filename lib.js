// Set range input
const range = document.getElementById('range');
const rangeV = document.getElementById('rangeV');
const setValue = ()=>{
	const
		newValue = Number( (range.value - range.min) * 100 / (range.max - range.min) ),
		newPosition = 10 - (newValue * 0.2);
	rangeV.innerHTML = `<span>${range.value}</span>`;
	rangeV.style.left = `calc(${newValue}% + (${newPosition}px))`;
};

// Set checkbox input
const overall = document.getElementById('overall_checkbox');
const individuals = document.querySelectorAll('input.area_checkbox');

function updateIndividual() {
	let checkedCount = 0;
	for (const individual of individuals) {
		if (individual.checked) {
			checkedCount++;
		}
	}

	if (checkedCount === 0) {
		overall.checked = false;
		overall.indeterminate = false;
	} else if (checkedCount === individuals.length) {
		overall.checked = true;
		overall.indeterminate = false;
	} else {
		overall.checked = false;
		overall.indeterminate = true;
	}
}

function updateAll() {
	for (const individual of individuals) {
		if (overall.checked) {
			individual.checked = true;
			initialize();
		} else {
			individual.checked = false;
		}
	}
}

// set the dimensions and margins of the graph
var full_width = 1240 //document.getElementById('div3').getBoundingClientRect().width;
var margin = {top: 10, right: 30, bottom: 30, left: 40};
var width = full_width - margin.left - margin.right;
var height = 400 - margin.top - margin.bottom;

var xtick = [];
for (let i = 42; i < 102; i++) {
	xtick.push(i.toString())
}	

// Initialization
var area_list = [];
function initialize() {
	area_list = [];
	for (const individual of individuals) {
		if (individual.checked) {
			area_list.push(individual.value);
		}
	}
}

// EventListener
document.addEventListener("DOMContentLoaded", setValue);
document.addEventListener("DOMContentLoaded", initialize);
document.addEventListener("DOMContentLoaded", refresh_boxplot);

range.addEventListener('input', setValue);
range.addEventListener("input", initialize);
range.addEventListener("input", refresh_count);
range.addEventListener('input', refresh_boxplot);

overall.addEventListener('click', updateAll);
overall.addEventListener("click", initialize);
overall.addEventListener('click', refresh_boxplot);
for (const individual of individuals) {
	individual.addEventListener('click', updateIndividual);
	individual.addEventListener("click", initialize);
	individual.addEventListener('click', refresh_boxplot);
}

function refresh_count() {
	d3.csv("data.csv", function(data) {
		
	    year = range.value
	    filtered_data = data.filter(function(row) {return row['year'] == year;})
		
		var area_count = d3.nest() // nest function allows to group the calculation per level of a factor
			.key(function(d) {return d.area;})
			.rollup(function(d) {
				return(d.length)
			})
			.entries(filtered_data)
		
		for (const town of area_list) {
			const town_count = document.getElementById(town + '_count');
			town_count.innerHTML = `(0)`
		}
		
		for (let i = 0; i < area_count.length; i++) {
			town = area_count[i].key
			count = area_count[i].value
			const town_count = document.getElementById(town + '_count');
			town_count.innerHTML = `(${count})`
		}
		
		count = filtered_data.length
		console.log(count)
		const all_count = document.getElementById('All_count');
		all_count.innerHTML = `(${count})`
	})
}

function showTooltip(evt, x, count, q1, median, q3) {
	let tooltip = document.getElementById("tooltip");
	text = "Remaining Lease: " + x + " years<br>"
	text = text + "<br>Count: " + count.toString() + "<br>"
	
	if (count > 0) {
		text = text + "<br>25th Percentile: " + q1.toString()
		text = text + "<br>Median: " + median.toString()
		text = text + "<br>75th Percentile: " + q3.toString()
	}
	
	tooltip.innerHTML = text;
	tooltip.style.display = "block";
	tooltip.style.left = evt.pageX + 10 + 'px';
	tooltip.style.top = evt.pageY + 10 + 'px';
}

function hideTooltip() {
	var tooltip = document.getElementById("tooltip");
	tooltip.style.display = "none";
}

function showLoading() {
	let loading = document.getElementById("loading");
	loading.style.display = "block";
}

function hideLoading() {
	let loading = document.getElementById("loading");
	loading.style.display = "none";
}

function refresh_boxplot() {
	
	boxplot = document.getElementById('boxplot')
	boxplot.innerHTML = ``
	
	// append the svg object to the body of the page
	var svg = d3.select("#boxplot")
	.append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform",
	      "translate(" + margin.left + "," + margin.top + ")");
	
	// Show the X scale
	var x = d3.scaleBand()
		.range([0, width])
		.domain(xtick)
		.paddingInner(1)
		.paddingOuter(.5)
	svg.append("g")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x))

	// Show the Y scale
	var y = d3.scaleLinear()
		.domain([0, 1400])
		.range([height, 0])
	svg.append("g").call(d3.axisLeft(y))
	
	showLoading()
	
	// Read the data and compute summary statistics for each specie
	d3.csv("data.csv", function(data) {
		
	    year = range.value
		
	    filtered_data = data.filter(function(row) {return row['year'] == year;})
		filtered_data = filtered_data.filter(function(row) {return area_list.includes(row['area']);})
		
	    // Compute quartiles, median, inter quantile range min and max --> these info are then used to draw the box.
		var sumstat = d3.nest() // nest function allows to group the calculation per level of a factor
			.key(function(d) {return d.remaining_lease;})
			.rollup(function(d) {
				count = d.length
				q1 = d3.quantile(d.map(function(g) {return parseFloat(g.psf);}).sort(d3.ascending), .25).toFixed(2)
				median = d3.quantile(d.map(function(g) {return parseFloat(g.psf);}).sort(d3.ascending), .5).toFixed(2)
				q3 = d3.quantile(d.map(function(g) {return parseFloat(g.psf);}).sort(d3.ascending), .75).toFixed(2)
				iqr = q3 - q1
				lower_bound = q1 - 1.5 * iqr
				upper_bound = q3 + 1.5 * iqr
				min = d3.min(d.map(function(g) {return parseFloat(g.psf);}))
				lower_bound = d3.max([min, lower_bound])
				max = d3.max(d.map(function(g) {return parseFloat(g.psf);}))
				upper_bound = d3.min([max, upper_bound])
				return({count: count, q1: q1, median: median, q3: q3, iqr: iqr, lower_bound: lower_bound, upper_bound: upper_bound})
			})
			.entries(filtered_data)
		
		// Show the main vertical line
		svg
		.selectAll("vertLines")
		.data(sumstat)
		.enter()
		.append("line")
		.attr("x1", function(d){return(x(d.key))})
		.attr("x2", function(d){return(x(d.key))})
		.attr("y1", function(d){return(y(d.value.lower_bound))})
		.attr("y2", function(d){return(y(d.value.upper_bound))})
		.attr("stroke", "black")
		.style("width", 40)

		// rectangle for the main box
		var boxWidth = 8
		svg
		.selectAll("boxes")
		.data(sumstat)
		.enter()
		.append("rect")
		.attr("x", function(d){return(x(d.key)-boxWidth/2)})
		.attr("y", function(d){return(y(d.value.q3))})
		.attr("height", function(d){return(y(d.value.q1)-y(d.value.q3))})
		.attr("width", boxWidth)
		.attr("stroke", "black")
		.style("fill", "#2196F3")
		.style("opacity", "1")

		// Show the median
		svg
		.selectAll("medianLines")
		.data(sumstat)
		.enter()
		.append("line")
		.attr("x1", function(d){return(x(d.key)-boxWidth/2)})
		.attr("x2", function(d){return(x(d.key)+boxWidth/2)})
		.attr("y1", function(d){return(y(d.value.median))})
		.attr("y2", function(d){return(y(d.value.median))})
		.attr("stroke", "black")
		.style("width", 80)
		
		
		var tooltip_bars = [];
		for (let i = 42; i < 102; i++) {
			tooltip_bars.push({key: i.toString(), value: {count: 0, q1: 0, median: 0, q3: 0, iqr: 0, lower_bound: 0, upper_bound: 0}})
		}
		
		for (let i = 0; i < sumstat.length; i++) {
			key = parseInt(sumstat[i].key)
			tooltip_bars[key - 42].value = sumstat[i].value
		}
		
		// rectangle for the main box
		var boxWidth = 16
		svg
		.selectAll("boxes")
		.data(tooltip_bars)
		.enter()
		.append("rect")
		.attr("id", function(d){return(d.key)})
		.attr("x", function(d){return(x(d.key)-boxWidth/2)})
		.attr("y", function(d){return(y(1400))})
		.attr("height", function(d){return(y(0)-y(1400))})
		.attr("width", boxWidth)
		.attr("onmousemove", function(d){return("showTooltip(evt, " + d.key + ", " + d.value.count.toString() + ", " + d.value.q1.toString() + ", " + d.value.median.toString() + ", " + d.value.q3.toString() + ");")})
		.attr("onmouseout", "hideTooltip();")
		.style("fill", "#000000")
		.style("opacity", "0.1")
		
		hideLoading()
	})
}