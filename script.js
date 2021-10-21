const margin = { top: 20, right: 20, bottom: 20, left: 20 }
const width = 700
const height = 400

d3.json('airports.json', d3.autoType)
    .then(airports=>{
    d3.json("world-110m.json", d3.AutoType).then(worldmap=>{
    
    console.log (airports)

    let nodes = airports.nodes;
    let edges = airports.links;
    
    const svg = d3.select(".graph-area").append("svg")
        .attr("viewBox", [0,0,width,height]) 

    //map stuff
    const features = topojson.feature(worldmap, worldmap.objects.countries).features;
    console.log("features", features);
    console.log("map",worldmap)

    const projection = d3.geoMercator()
        .fitExtent([[0,0], [width,height]],topojson.feature(worldmap, worldmap.objects.countries))
        .scale(80);
    const path = d3.geoPath(projection)

    svg.selectAll('path')
        .data(features)
        .enter()
        .append('path')
        .attr('class', 'country')
        .attr('d', path)


    svg.append("path")
	    .datum(topojson.mesh(worldmap, worldmap.objects.countries))
	    .attr("d", path)
	    .attr('fill', 'none')
  	    .attr('stroke', 'white')
	    .attr("class", "subunit-boundary");
    //regular node linked
    const sizeScale = d3.scaleLinear()
        .domain(d3.extent(nodes, d=> d.passengers))
        .range([2,6]);
    

    const force = d3.forceSimulation(nodes)
        .force('charge', d3.forceManyBody())
        .force('link', d3.forceLink(edges))
        .force('x', d3.forceX(width/2))
        .force('y', d3.forceY(height/2));

    let drag = force =>{
        function dragstart(event){
            if (!event.active) force.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }
        function dragging(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }
        function dragend(event) {
            if (!event.active) force.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }
        return d3.drag()
        .filter(event => visType === "force")
        .on("start", dragstart)
        .on("drag", dragging)
        .on("end", dragend);
    }

    var edge = svg.selectAll('line')
        .data(edges)
        .enter()
        .append('line')
        .attr('stroke', 'orange')

    var node = svg.selectAll("circles")
    .data(nodes)
    .enter()
    .append("circle")
    .attr('r', d=> sizeScale(d.passengers))
    .attr('fill', 'orange')
    //.attr('cx', (d,i)=>(d.x))
    //.attr('cy', (d,i)=>(d.y))
    //I could set the inital poistions to where it needs to be
    .call(drag(force))//need to figure out what goes in here

    node.append("title")
      .text(d=>d.name);
//gonna need to fill in stuff here^^

      force.on('tick', function() {
        edge
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
    
        node
            .attr("cx", d => d.x)
            .attr('cy', d => d.y);
    })

    svg.selectAll('path').attr('opacity', 0)
    let visType = 'force';
    d3.selectAll("input[name=type]").on('change', event => {
        visType = event.target.value;
        switchLayout();
    })
    function switchLayout(){
        if (visType == 'map'){
            //stop the sim when switching layouts
            force.alphaTarget(.3).stop();
            //reposition nodes maybe add a transition later
            node
            .attr("cx", d => projection([d.longitude, d.latitude])[0])
            .attr('cy', d => projection([d.longitude, d.latitude])[1]);
            edge
            .attr('x1', d => projection([d.source.longitude, d.source.latitude])[0])
            .attr('y1', d => projection([d.source.longitude, d.source.latitude])[1])
            .attr('x2', d => projection([d.target.longitude, d.target.latitude])[0])
            .attr('y2', d => projection([d.target.longitude, d.target.latitude])[1]);
            svg.selectAll('path').transition().duration(1000).attr('opacity', 1);
        }
        else{
            force.alphaTarget(.3).restart()
            
            svg.selectAll('path').transition().duration(1000).attr('opacity', 0);

        }
    }

//dont go below these 2, theyre the data closers    
    })
})

//2 things I can do, I can either have it set to the poisitions
//of the map off the rip
//or I can have the map opacity be 0 from the start and have force
//checked off instead