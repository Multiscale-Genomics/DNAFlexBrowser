var dinucl = "GG GA AG AA GC GT AT AC CA TA TG CG CC CT TC TT".split(" ");
var dinucli = "GG GA AG AA GC GT AT TA TG CG".split(" ");
var skippers= {
    inner: [4,6,7,9],
    outer: [8,9,13,14,15,16]};

var margin = {top: 10, right: 80, bottom: 20, left: 70},
    gridSize = 25,
    gridPad = 2,
    cbGridSize = 15,
    width = (gridSize+gridPad)*10,
    height = (gridSize+gridPad)*16,
    flexscales = 10,
    // rainbow. XXX use perceptually uniform scale
    colors = ["#000080", "#0010ff", "#00a4ff", "#40ffb7", "#b7ff40", "#ffb900", "#ff3000", "#800000"];

var colorScale = d3.scale.quantile()
    .domain([0, flexscales - 1, 10])
    .range(colors);

function xScale(x) {
    return +x*(gridSize+gridPad);
}

function yScale(y) {
    return height-(+y+1)*(gridSize+gridPad);
}

function popdda(id, tsv) {
    this.svg = d3.select(id).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    /* X labels */
    this.xlabels = this.svg.selectAll(".xlabel")
        .data(dinucli)
      .enter().append("text")
        .text(function (d) { return d; })
        .attr("x", function (d, i) { return xScale(i); })
        .attr("y", yScale(-1))
        .style("text-anchor", "end")
        .attr("transform", "translate(22, 12)")
        .attr("class", "x label");

    /* Y labels */
    this.ylabels = this.svg.selectAll(".ylabel")
        .data(dinucl)
      .enter().append("text")
        .text(function(d) { return d[0]+".."+d[1]; })
        .attr("x", xScale(-1))
        .attr("y", function(d, i) { return yScale(i); })
        .style("text-anchor", "end")
        .attr("transform", "translate(22, 18)")
        .attr("class", "y label");

/***** TSV obtained using:
       #  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18
       # 36 35 34 33 32 31 30 29 28 27 26 25 24 23 22 21 20 19
       
       for abc in libabc.ABC:
           seq = "GC%s%s%s%sGC"%(abc[2:],abc,abc,abc)
           for i in range(libabc.ABC_locations[abc][0],
               libabc.ABC_locations[abc][1]+1):
               j = i-1
               wtet = seq[j:j+4]
               ctet = libabc.wcc(wtet)
               wi = libabc.seq2idx(wtet)
               ci = libabc.seq2idx(ctet)
               print "%4s %4s %2d %2d %2d"%(wtet, abc, j+1, wi[0], wi[1])
               print "%4s %4s %2d %2d %2d"%(ctet, abc, 36-j, ci[0], ci[1])
*****/
    var _this = this;
    d3.tsv(
        tsv,
        // Use accessor to filter data on input
        function(d) {
            if(d.inner < 10 && // Skip 80% of the redundancy
               !(skippers.inner.indexOf(+d.inner) >= 0 && skippers.outer.indexOf(+d.outer) >= 0)) { 
                d.value = Math.random()*10; // XXX bogus values
                return d;
            }
        },
        // Build the UI
        function(error, data) {
            _this.abc = _this.svg.selectAll("rect.cell")
                .data(data)
              .enter().append("rect")
                .attr("x", function(d) { return xScale(d.inner); })
                .attr("y", function(d) { return yScale(d.outer); })
                .attr("rx", 4)
                .attr("ry", 4)
                .attr("class", "cell")
                .attr("width", gridSize)
                .attr("height", gridSize)
                .style("fill", "white")
                .on("click", function (d) {
                    _this.svg.selectAll("rect.cell").classed("selected",false);
                    d3.select(this).classed("selected",true);
                    $("#stiffness").text(
                        d.tetrad+":"+d.oligo+"@"+d.pos);
                });
            
            _this.colorbar = _this.svg.selectAll(".cb")
                .data(colorScale.quantiles().concat([10]), function(d) { return d; })
              .enter().append("g")
                .attr("class", "cb");

            _this.colorbar.append("rect")
                .attr("x", width + gridSize)
                .attr("y", function(d, i) { return cbGridSize * i; })
                .attr("width", cbGridSize)
                .attr("height", cbGridSize)
                .style("fill", function(d, i) { return colors[i]; });
            
            _this.colorbar.append("text")
                .attr("class", "cblabel")
                .text(function(d) {return d;})
                .attr("x", width + gridSize + 1.3*cbGridSize)
                .attr("y", function(d, i) { return cbGridSize * (i+1); })
                .style("text-anchor", "start")
                .attr("transform", "translate(0, 2)");

            //XXX Move this to a function to determine which "value" to use
            // must also update colorscale
            _this.abc.transition().duration(1000)
                .style("fill", function(d) { return colorScale(d.value); });
        });
}
