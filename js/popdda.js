/*
 * popdda.js 
 *
 *  Copyright (C) 2016 Marco Pasi <mf.pasi@gmail.com> 
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 * v0.1 160422
 * v0.2 160423
 *
 */
var dinucl = "GG GA AG AA GC GT AT AC CA TA TG CG CC CT TC TT".split(" ");
var dinucli = "GG GA AG AA GC GT AT TA TG CG".split(" ");
var skippers= {
    inner: [4,6,7,9],
    outer: [8,9,13,14,15,16]},
    unitH = {
        shift: '\u212B',
        slide: '\u212B',
        rise: '\u212B',
        tilt: '\u00B0',
        roll: '\u00B0',
        twist: '\u00B0'
    },
    vrange = {
        shift: [-1.0, 1.0],
        slide: [-1.5, 0.5],
        rise:  [+2.6, 3.8],
        tilt:  [-5.0, 5.0],
        roll:  [-5.0, 15],
        twist: [+20, 40]
    };

var margin = {top: 15, right: 100, bottom: 20, left: 70},
    gridSize = 20,
    gridPad = 3,
    cbGridSize = 15,
    width = (gridSize+gridPad)*10,
    height = (gridSize+gridPad)*16,
    flexscales = 10,
    transitionDuration = 1000, // ms
    // rainbow. XXX use perceptually uniform scale
    colors = ["#000080", "#0010ff", "#00a4ff", "#40ffb7", "#b7ff40", "#ffb900", "#ff3000", "#800000"];

function xScale(x) {
    return +x*(gridSize+gridPad);
}

function yScale(y) {
    return height-(+y+1)*(gridSize+gridPad);
}

function q2cb(q, domain) {
    return [domain[0]].concat(q);
}

function capitalize(string) {
    return string.substr(0, 1).toUpperCase() + string.substr(1);
}

function unit(variable) {
    if(!(variable in unitH))
        return ""
    return unitH[variable]
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
        .attr("x", function (d, i) { return xScale(i+0.5); })
        .attr("y", yScale(-1))
        .style("text-anchor", "middle")
        .attr("transform", "translate(-2,12)")
        .attr("class", "x label");

    /* Y labels */
    this.ylabels = this.svg.selectAll(".ylabel")
        .data(dinucl)
      .enter().append("text")
        .text(function(d) { return d[0]+".."+d[1]; })
        .attr("x", xScale(0))
        .attr("y", function(d, i) { return yScale(i-0.5); })
        .style("text-anchor", "middle")
        .attr("transform", "translate(-20,3)")
        .attr("class", "y label");

    this.colorby = function(vname, domain) {
        /* 
         * Color the heatmap by the stored value "vname",
         * using values in the range specified by domain.
         */

        var domain = (domain ? domain : vrange[vname]);
        
        // Add a label to the colorbar
        var cblabel = $(".cblabel");
        if(cblabel.length == 0) { // enter!
            svg.append("text")
                .attr("class", "cblabel")
                .attr("x", width + gridSize)
                .attr("y", 0)
                .style("text-anchor", "top");
            cblabel = $(".cblabel");
        }
        // update!
        cblabel.text(capitalize(vname)+" ("+unit(vname)+")");
        
        var hlabel = cblabel[0].getBBox().height;

        // Update colorScale
        var colorScale = d3.scale.quantile()
            .domain(domain)
            .range(colors);

        // Bind data to <g> containers and children
        var data = q2cb(colorScale.quantiles(), domain);
        var colorbar = _this.svg.selectAll(".cb").data(data);
        colorbar.select(".cbrect").data(data);
        colorbar.select(".cbtick").data(data);
        colorbar.exit().remove();
        
        // Deal with new elements
        var cbenter = colorbar.enter().append("g")
            .attr("class", "cb");
        cbenter.append("rect")
            .attr("class", "cbrect")
            .attr("x", width + gridSize)
            .attr("y", function(d, i) { return hlabel + cbGridSize * i; })
            .attr("width", cbGridSize)
            .attr("height", cbGridSize);
        cbenter.append("text")
            .attr("class", "cbtick")
            .attr("x", width + gridSize + 1.3*cbGridSize)
            .attr("y", function(d, i) { return hlabel + cbGridSize * i; })
            .style("text-anchor", "start")
            .attr("transform", "translate(0, 4)");

        // Update
        _this.svg.selectAll(".cbrect").transition().duration(transitionDuration)
            .style("fill", function(d, i) { return colors[i]; });
        _this.svg.selectAll(".cbtick")
            .transition().duration(transitionDuration/2)
            .style("opacity", 0)
            .transition().duration(transitionDuration/2)
            .style("opacity", 1)
            .text(function(d) {return d.toFixed(1);});
        _this.abc.transition().duration(transitionDuration)
            .style("fill", function(d) { return colorScale(+d[vname]); });

        // Update cursor text function
        _this.cursorText = function(d) {
            return d.tetrad+":"+d[vname]+unit(vname);
        };
        return true;
    };
    
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
        // (ab)Use accessor to filter data on input
        function(d) {
            if(d.inner < 10 && // Skip 80% of the redundancy
               !(skippers.inner.indexOf(+d.inner) >= 0 && skippers.outer.indexOf(+d.outer) >= 0)) { 
                return d;
            }
        },
        // Build the UI
        function(error, data) {
            _this.cursor = _this.svg.append("text")
                .attr("x", width + 0.5*gridSize)
                .attr("y", 0.5*height)
                .attr("class", "tcursor")
                .attr("width", 30)
                .attr("height", 20);
            _this.cursorText = function(d) {return d.tetrad;};
            // XXX encapsulate text in <g.tcursor> which handles opacity (here)
            // XXX bind d to the text and handle update in mousevoer (here)
            // XXX provide an info box to be bound subsequently (e.g. colorby)
            //     (or select <g.tcursor>s & append directly in "colorby")
            
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
                .style("cursor", "hand")
                .on("mouseover", function (d) {
                    _this.cursor
                        .transition().duration(transitionDuration/10)
                        .style("opacity", 1)
                        .text(_this.cursorText(d));
                })
                .on("mouseout", function (d) {
                    _this.cursor
                        .transition().duration(transitionDuration/2)
                        .style("opacity", 0);
                })
                .on("click", function (d) {
                    _this.svg.selectAll("rect.cell").classed("selected",false);
                    d3.select(this).classed("selected",true);
                    loadStiffnessPage(d.tetrad, d.oligo, d.pos);
                });
            
            _this.colorby("twist");
        });
    return this;
}

function loadStiffnessPage(tetrad, oligomer, position) {
    /* 
     * Retrieve stiffness information as a function of the
     * Curves+ helical parameters for a single base-pair step
     * in a specific ABC oligomer, given three information:
     *
     *   tetrad:   The nucleotide sequence of the tetrad (ACGT);
     *   oligomer: The ABC 4-letter code of the oligomer (e.g. AAAA);
     *   position: The position of the base-pair step in the sequence
     *             of the oligo; values > 18 are for the Crick strand.
     *
     */
    $("#stiffness").text(
        tetrad+":"+oligomer+"@"+position);
}
