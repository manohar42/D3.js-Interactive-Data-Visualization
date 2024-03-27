// import { createStreamGraph } from "./task1.js";

// const {startTimeExp,endTimeExp} = createStreamGraph

var graph;
var innerHeight;
var innerWidth;
var male_data;
var female_data;
var defaultCountry = 'Estonia';
var completeData;
const margin = { top: 20, bottom: 90, right: 20, left: 160 };
var mc_data
var colorMap = {
    'police' : 'blue',
    'fire': 'orange',
    'vehicle-accident': 'red',
    'fire police': '#A93400',
    'police vehicle-accident': 'magenta',
    'fire vehicle-accident': '#F34234',
    'fire police vehicle-accident': 'maroon'
}
let isPlaying = false;
let intervalId;
let pointsData,geojsonData;
var projection;
var start = 61200
var end = 61200
var timeoutID
var yscale
var colorScale
var globalStartTime
var globalEndTime

var legendMap = {
    'blue': 'police',
    'orange': 'fire',
    'red': 'vehicle-accident',
    '#A93400': 'fire police',
    'magenta': 'police vehicle-accident',
    '#F34234': 'fire vehicle-accident',
    'maroon': 'fire police vehicle-accident'
}



document.addEventListener('DOMContentLoaded', function () {
    
    graph = d3.select('#graph')

    const width = +graph.style('width').replace('px', '')
    const height = +graph.style('height').replace('px', '')

    let intervalId;
    let pointsData,geojsonData;
    var projection;
    
    function distance(lat1, lon1, lat2, lon2) {
        const p = 0.017453292519943295; 
        const c = Math.cos;
        const a = 0.5 - c((lat2 - lat1) * p)/2 + 
                c(lat1 * p) * c(lat2 * p) * 
                (1 - c((lon2 - lon1) * p))/2;
    
        return 12742 * Math.asin(Math.sqrt(a));
    }
    
    
    function clusterPoints(data, threshold) {
        let clusters = [];
        data.forEach(point => {
            let found = false;
            for (let cluster of clusters) {
                let dist = distance(point.lat, point.lng, cluster.lat, cluster.lng);
                if (dist <= threshold) {
                    cluster.lat = (cluster.lat * cluster.count + point.lat) / (cluster.count + 1);
                    cluster.lng = (cluster.lng * cluster.count + point.lng) / (cluster.count + 1);
                    cluster.riskScore += point.riskScore;
                    cluster.count++;
                    found = true;
                    break;
                }
            }
            if (!found) {
                clusters.push({ ...point, count: 1 });
            }
        });
        return clusters;
    }
    
    colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    innerWidth = width - margin.left - margin.right
    innerHeight = height - margin.top - margin.bottom
    
    Promise.all([d3.csv('data/females_data.csv', (data) => {
        return {
            year: new Date(+data.Year, 0, 1),
            Argentina: +data.Argentina,
            Belgium: +data.Belgium,
            Canada: +data.Canada,
            Australia: +data.Australia,
            Estonia: +data.Estonia,
            male: false
        }
    }), d3.csv('data/males_data.csv', (data) => {
        return {
            year: new Date(+data.Year, 0, 1),
            Argentina: +data.Argentina,
            Belgium: +data.Belgium,
            Canada: +data.Canada,
            Australia: +data.Australia,
            Estonia: +data.Estonia,
            male: true
        }
    }),
    d3.csv('data/Newdata_with_risk_scores.csv'),
    d3.csv('data/New3.csv')])
        .then(function (values) {
            
            female_data = values[0];
            male_data = values[1];
            mc_data = values[2];
            var data = values[3]
           
            completeData = [...female_data, ...male_data]

        let processedData = {};
        data.sort((a, b) => parseInt(a.date) - parseInt(b.date));
    
        data.forEach(d => {
            if (d.risk_score_nlp > 0 && d.latitude && d.longitude) {
                const latLngKey = `${parseFloat(d.latitude)},${parseFloat(d.longitude)},${parseFloat(d.date)}`;
                const currentTime = parseInt(d.date); 
                const riskScore = +d.risk_score_nlp;
                const category = d.category.toLowerCase();
                const location = d.location;
                const message = d.message;
                if (processedData[latLngKey]) {
                    const existingEntry = processedData[latLngKey];
                    const timeDifference = Math.abs(currentTime - existingEntry.time);
    
                    if (timeDifference <= 3000) { 
                        existingEntry.riskScore += riskScore; 
                    } else {
                        processedData[latLngKey] = { lat: parseFloat(d.latitude), lng: parseFloat(d.longitude), riskScore, category, time: currentTime,location : location,message : message  };
                    }
                } else {
                    processedData[latLngKey] = { lat: parseFloat(d.latitude), lng: parseFloat(d.longitude), riskScore, category, time: currentTime , location : location,message : message };
                }
    
            }
        });
        
    
        pointsData = Object.values(processedData);
    
        let clusteredData = clusterPoints(pointsData, 0.2);
    
    
        pointsData.sort((a, b) => parseInt(a.time) - parseInt(b.time));
        
        pointsData = clusteredData
           
        d3.json('data/Abila.geojson').then(geojsonData => {
            geojsonData = geojsonData
            drawMap(geojsonData);
            updateVisualization(170000, geojsonData); 
            updateMessagePrompt(170000, pointsData);
        });

         createNetworkChart()
         createStreamGraph()
     //    createStreamGraph()
});

noUiSlider.create(document.getElementById('time-slider'), {
    start: [170000, 213000], 
    connect: true,
    range: {
        'min': 170000, 
        'max': 213000    
    },
  
    tooltips: [true, true],
    format: {
      to: function (value) {
          return parseInt(value);
      },
      from: function (value) {
          return parseInt(value);
      }
    }
});


const timeSlider = document.getElementById('time-slider').noUiSlider;


let isPlaying = false;

document.getElementById('play-pause-btn').addEventListener('click', function() {
    if (isPlaying) {
        this.innerHTML = '<span class="button-icon"><i class="fas fa-play"></i></span><span class="button-text">Play</span>';
        stopAnimation();
    } else {
        this.innerHTML = '<span class="button-icon"><i class="fas fa-pause"></i></span><span class="button-text">Pause</span>'
        startAnimation();
    }
});

let animationId = null;
let currentTime; 

function animate() {
if (!isPlaying) {
    return; 
}

let endTime = parseInt(timeSlider.get()[1]);

if (currentTime >= endTime) {
    stopAnimation();
    return;
}


updateVisualization(currentTime, geojsonData);
updateMessagePrompt(currentTime, pointsData);


currentTime = incrementTime(currentTime);
timeSlider.set([currentTime, null]); 


setTimeout(() => {
    if (isPlaying) {
        animationId = requestAnimationFrame(animate);
    }
}, 1000); y
}

function startAnimation() {
if (!isPlaying) {
    isPlaying = true;
    currentTime = parseInt(timeSlider.get()[0]); 
    animate();
}
}

function stopAnimation() {
if (isPlaying) {
    isPlaying = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    document.getElementById('play-pause-btn').innerHTML = '<i class="fas fa-play"></i>';
}
}

function incrementTime(time) {
    let hours = Math.floor(time / 10000);
    let minutes = Math.floor((time % 10000) / 100);
    let seconds = time % 100;

    minutes += 1; 
    if (minutes >= 60) {
        hours += 1;
        minutes = 0;
    }

   
    let hoursStr = hours.toString().padStart(2, '0');
    let minutesStr = minutes.toString().padStart(2, '0');
    let secondsStr = seconds.toString().padStart(2, '0');

    return parseInt(hoursStr + minutesStr + secondsStr);
}


function drawMap(geojsonData) {
    const svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height);

    
    projection = d3.geoMercator().fitSize([width, height], geojsonData);
    var path = d3.geoPath().projection(projection);

        svg.selectAll("path")
        .data(geojsonData.features)
        .enter().append("path")
        .attr("d", path)
        .style("fill", "#76a21e") 
        .style("stroke", "#707070")   
        .style("stroke-width", "1px");    
}


function createNetworkChart(start = 170000, end = 213445) {

    d3.select('#graph').select("g").remove();
    let label_map = new Map();
    let filtered_mc_data = [];

    mc_data = mc_data.filter((element) => {return element.labels.length > 2});

    var iconMap = {
        'police': '\uf0f7', 
        'fire': '\uf134', 
        'vehicle-accident': '\uf1b9', 
        
    };
  

    mc_data.forEach(element => {
        if(Number(element.date)>=start && Number(element.date)<=end){
            let message_labels = element.labels.substring(1, element.labels.length-1).split(', ');
            message_labels =  message_labels.map(message_label => message_label.substring(1, message_label.length-1));
            message_labels.forEach((message_label)=>{
                if(!label_map.get(message_label)) label_map.set(message_label, 1); 
            });

            filtered_mc_data.push({
                labels: message_labels,
                message: element.message,
                time: element.date,
                risk_score: element.risk_score
            });
          
        }
    });

   

    label_map.forEach((value, key) => {
        label_map.set(key, colorScale(key)); 
    });



   

    const data = {nodes: [], links: []};

    for (let [key, value] of label_map) {
        data.nodes.push({id: key});
    }

    
    filtered_mc_data.forEach((element) =>{
    data.nodes.push({id: element.message, labels:element.labels, risk_score: element.risk_score});
   
        element.labels.forEach((label) => {
            data.links.push({source: label, target: element.message});
        });
    });

   
   

    var margin = {top: 10, right: 10, bottom: 10, left: 10},
    width = 1000 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

   
  

    const svgRoot = d3.select("#graph")
   // .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("border", "1px solid red"); 
    
        
    
    const svg = svgRoot
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .on('mousedown', (event) => {
            isMouseDown = true;
            startPoint = { x: d3.pointer(event)[0], y: d3.pointer(event)[1] };
            selectionRect = svg.append('rect')
                .attr('x', startPoint.x)
                .attr('y', startPoint.y)
                .attr('width', 0)
                .attr('height', 0)
                .attr('class', 'selection-rectangle');
                
        });

    const radius = 10;
    const simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(d => d.id))
        .force("charge", d3.forceManyBody().strength(-11))
        .force("center", d3.forceCenter(500, 300))

    const link = svg.append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(data.links)
    .join("line")
    .attr("stroke-width", d => Math.sqrt(d.value));

    const categoryIconClasses = {
        "fire_dancing_dolphin": "fa-fire",
        "police": "fa-shield-alt",
        "vehicle_accidents": "fa-car-crash",
    };

    
    const categoryIcons = {
        "fire_dancing_dolphin": "\uf06d", 
        "police": "\uf3ed", 
        "vehicle_accidents": "\uf5e1", 
    };

    
    const categoryColors = {
        "fire_dancing_dolphin": "red",
        "police": "lightblue",
        "vehicle_accidents": "orange",    
    };

    const node = svg.append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(data.nodes)
    .join("circle")
    .attr("class", "node")
    .attr("r", function(d){ 
        if(label_map.get(d.id)) return 8;
        else if(d.risk_score!=undefined && d.risk_score==0){
            return 8
        }else if(d.risk_score!=undefined && d.risk_score==1){
            return 16
        }else if(d.risk_score!=undefined && d.risk_score==2){
            return 24
        }else{
            return 32
        }
        
    })
    .attr("fill", function(d){ 
        if(d.labels == undefined){
            if(label_map.get(d.id)) return "black";
        }
        d.labels.sort()
        if(d.labels.length>2){
            
        }
        var st = '';
        for(var i =0;i<d.labels.length;i++){

            st = st+d.labels[i]
            if(d.labels.length-1 != i)
            st = st + ' '
        }
        return colorMap[st]
      // return 'yellow'
    }).on('click', selectNode)
    .call(d3.drag()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended))
   
    var color = ['blue','orange','red','#A93400','magenta','#F34234','maroon']

    const legend = svg.selectAll(".legend")
    .data(color)
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", function(d, i) { return "translate(0," + i * 40 + ")"; });

legend.append("rect")
    .attr("x", width - 18)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", function(d) {
        
        return d
    });

legend.append("text")
    .attr("x", width - 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "end")
    .text(function(d) { 
       
        return legendMap[d];
     })



    let isSelectionMode = false;
    let isMouseDown = false;
    let startPoint = null;
    let selectionRect = null;

    svgRoot.on('mousedown', (event) => {
        if (!isSelectionMode) return;
        isMouseDown = true;
        startPoint = { x: d3.pointer(event)[0], y: d3.pointer(event)[1] };
        selectionRect = svgRoot.append('rect')
            .attr('x', startPoint.x)
            .attr('y', startPoint.y)
            .attr('width', 0)
            .attr('height', 0)
            .attr('class', 'selection-rectangle')
            .attr('fill','lightblue')
                .attr('fill-opacity',0.6);
    }).on('mousemove', (event) => {
        if (!isMouseDown || !isSelectionMode) return;
        const currentPoint = { x: d3.pointer(event)[0], y: d3.pointer(event)[1] };
        const x = Math.min(startPoint.x, currentPoint.x),
              y = Math.min(startPoint.y, currentPoint.y),
              width = Math.abs(startPoint.x - currentPoint.x),
              height = Math.abs(startPoint.y - currentPoint.y);
        selectionRect
            .attr('x', x)
            .attr('y', y)
            .attr('width', width)
            .attr('height', height);
    }).on('mouseup', (event) => {
        if (!isSelectionMode) return;
        isMouseDown = false;
        const endPoint = { x: d3.pointer(event)[0], y: d3.pointer(event)[1] };
        selectNodesInArea(startPoint, endPoint);
        selectionRect.remove();
    });

   

    document.getElementById('toggleSlider').addEventListener('change', function() {
        isSelectionMode = !isSelectionMode;
      });

    // const infoIconGroup = document.getElementById('infoIcon');
    // const tooltip = document.getElementById('infoTooltip');
  
    // infoIconGroup.addEventListener('mouseover', function(event) {
    //   tooltip.style.visibility = 'visible';
    //   tooltip.style.left = event.pageX + 'px';
    //   tooltip.style.top = event.pageY + 'px';
    // });
  
    // infoIconGroup.addEventListener('mouseout', function() {
    //   tooltip.style.visibility = 'hidden';
    // });

    function selectNodesInArea(startPoint, endPoint) {
      //  console.log("inside node selection")
       // console.log(startTimeExp)
       // console.log(endTimeExp)
        const node_data = []
        svg.selectAll(".node").each(function(d) {
            const node = d3.select(this);
            const cx = parseFloat(node.attr("cx"));
            const cy = parseFloat(node.attr("cy"));
            if (((cx >= startPoint.x && cx <= endPoint.x)||(cx <= startPoint.x && cx >= endPoint.x)) && ((cy >= startPoint.y && cy <= endPoint.y)|| (cy <= startPoint.y && cy >= endPoint.y))) {
                node.classed("highlighted", true);
                node_data.push(d); // Highlight the selected nodes
            }
            console.log("dataaaaaaa")
            
            console.log(d)
        });
        // console.log("filtered data",filtered_mc_data);

         

        var result = filtered_mc_data.filter(item => {
            
            return node_data.some(node => node.id === item.message);
          });
            // console.log("result",result);
            createBeeswarmChart(result);
    }
    

    function selectNode(event, d) {
        
        const currentNode = d3.select(this);
        const isSelected = currentNode.classed("selected");
        currentNode.classed("selected", !isSelected); 
    
        updateInfoBox(event,currentNode); 
    }

    simulation.nodes(data.nodes)
    .on("tick", () => {
    node.attr("cx", d => d.x)
        .attr("cy", d => d.y);
    link.attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
    });

    simulation.force("link").links(data.links);

    
  function dragstarted(event, d) {
    if(isSelectionMode){
        return
    }
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    if(isSelectionMode){
        return
    }
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if(isSelectionMode){
        return
    }
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;

    
    let tooltipDiv = document.getElementById('tooltipDiv');
    if (!tooltipDiv) {
        tooltipDiv = document.createElement('div');
        tooltipDiv.id = 'tooltipDiv';
        document.body.appendChild(tooltipDiv); 
    }

    
    tooltipDiv.innerHTML = `Information about the node: <strong>${d.id}</strong>`; 

    
    tooltipDiv.style.position = 'absolute';
    tooltipDiv.style.left = `${event.x}px`; 
    tooltipDiv.style.top = `${event.y}px`; 
    tooltipDiv.style.backgroundColor = 'white';
    tooltipDiv.style.border = '1px solid black';
    tooltipDiv.style.padding = '10px';
    tooltipDiv.style.borderRadius = '5px';
    tooltipDiv.style.display = 'block'; 
    
    setTimeout(() => { tooltipDiv.style.display = 'none'; }, 3000);

  }
  createBeeswarmChart(filtered_mc_data)
}

const clickPlayButton = (event) => {
     end = end + 3600
    //  console.log(end)
     if(end>77685){
        button1Function()
        return
     }
    createNetworkChart(start,end)
    timeoutID = setTimeout(clickPlayButton,10000);
}

const button1Function = () => {
    // console.log("entered clear timeout")
    clearTimeout(timeoutID);
}

function updateInfoBox(event,currentNode) {
    const selectedNodes = d3.selectAll(".node.selected").data();
    const infoBox = d3.select("#infoBox");
  
    if (selectedNodes.length > 0) {
      
      let htmlContent = "<div class='tabs'>";
      const attributesToShow = ["police", "fire", "vehicle-accident"];
      attributesToShow.forEach((attribute, index) => {
        htmlContent += `<div class='tab' id='tab${index}'>${attribute}</div>`;
      });
      htmlContent += "</div>"; 
  
      
      htmlContent += "<div class='tab-content'>";
  
      
      attributesToShow.forEach((attribute, index) => {
        htmlContent += `<div class='tab-content scrollable-list' id = tab-tab${index} >`;
      
        htmlContent += "<ul>";
  
        
        selectedNodes.forEach((node) => {
            
            if(node.labels!=undefined && (node.labels[0] == attribute || (node.labels[1]!=undefined && node.labels[1]== attribute) || (node.labels[2]!=undefined && node.labels[2] == attribute))){
                htmlContent += `<li>${node.id}: ${node[attribute]}</li>`;
            }
        });
  
        htmlContent += "</ul>";
        htmlContent += `</div>`; 
      });
  
      htmlContent += "</div>"; 
  
      
      infoBox.html(htmlContent)
             .style("display", "block")
             .style("left", `${event.pageX + 10}px`)
             .style("top", `${event.pageY + 10}px`);
  
      
       if(currentNode._groups[0][0].__data__.labels!= undefined){
        if(currentNode._groups[0][0].__data__.labels[0]== 'police'){
            showTab("tab0");
        }else if(currentNode._groups[0][0].__data__.labels[0]== 'fire'){
            showTab('tab1')
        }else{
            showTab('tab2')
        }
      }
  
      
      attributesToShow.forEach((_, index) => {
        const tabId = `tab${index}`;
        d3.select(`#${tabId}`).on("click", () => showTab(tabId));
      });
    } else {
      infoBox.style("display", "none"); 
    }
}
  
function showTab(tabId) {
   
    d3.selectAll(".tab-content > div").style("display", "none");
    
    d3.selectAll(`#tab-${tabId}`).style("display", "block");
    
    d3.selectAll(".tabs .tab").classed("active", false);
    d3.select(`#${tabId}`).classed("active", true);
}

function createBeeswarmChart(data)
{

    

    var margin = { top: 10, right: 30, bottom: 30, left: 60 };
    var width = 800 - margin.left - margin.right;
    var height = 450 - margin.top - margin.bottom;

    var svg1 = d3.select("#graph2");
    svg1.selectAll("*").remove();
    

    var parseTime = d3.timeParse("%H%M%S");

    var parsedData = data.map(d => {
    return {
        time: parseTime(d.time),
        message: d.message,
        label: d.labels
    };
    });



    

    var xScale = d3.scaleTime()
    .domain(d3.extent(parsedData, d => d.time))
    .range([50, width]);

    var xAxis = d3.axisBottom(xScale)
    .tickFormat(d3.timeFormat("%H:%M:%S"));

    svg1.append("g")
    .attr("transform", "translate(0, 350)")
    .call(xAxis);

    var x_axis_text = "Time";
    svg1.append("text")
        .attr("class", "x-axis-label")
        .attr("transform", `translate(${width /2}, ${height - 20})`) 
        .style("text-anchor", "middle") 
        .text([x_axis_text]);

    const yScale = d3.scaleLinear()
    .domain([1, d3.max(parsedData, d => d.message.length)])
    .range([2, 15]);



    

    var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


    const simulation = d3.forceSimulation(parsedData)
    .force("x", d3.forceX(d => xScale(d.time)).strength(1))
    .force("y", d3.forceY(200).strength(1)) 
    .force("collide", d3.forceCollide(d => yScale(d.message.length)/1.5))
    .stop();

    for (let i = 0; i < 300; ++i) {
    simulation.tick();
    }

    svg1.selectAll('circle')
    .data(parsedData)
    .join(
        enter => enter.append('circle')
            .attr('cx', d => d.x)
            .attr('cy', d => {
                
                const minY = 670 - yScale(d.message.length);
                return Math.min(minY, Math.max(d.y, margin.top));
            })
            .attr('r', 0)
            .call(enter => enter.transition()
                .delay(1000)
                .duration(d => 500 + Math.random() * 500)
                .attr('cx', d => d.x)
                .attr('cy', d => {
                    const minY = 670 - yScale(d.message.length);
                    return Math.min(minY, Math.max(d.y, margin.top));
                })
                .attr('r', d => yScale(d.message.length) / 2)
            ),
        update => update.call(update => update.transition()
            .delay(1000)
            .duration(500)
            .attr('cx', d => d.x)
            .attr('cy', d => {
                const minY = 700 - yScale(d.message.length);
                return Math.min(minY, Math.max(d.y, margin.top));
            })
            .attr('r', d => yScale(d.message.length) / 2)
        ),
        exit => exit.call(exit => exit.transition()
            .duration(500)
            .attr('r', 0)
            .remove()
        )
    ).on('mouseover', function(event, d) {
        
        d3.select(this)
            .attr('stroke', 'black')
            .attr('stroke-width', 2);
        
            tooltip.transition()
            .duration(200)
            .style("opacity", .9);

        tooltip.html(`${d.message}`)
            .style("left", (event.pageX + 5) + "px")
            .style("top", (event.pageY - 28) + "px");
    })
    .on('mouseout', function(event, d) {
        d3.select(this)
            .attr('stroke-width', 0);
        
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    })
    .style("fill", function(d) {
      
        
        
        return fillColor(d.label); 
    });


    function fillColor(label){

            

                if(label == "police"){
                    return "blue";
                }
                else if(label == "vehicle-accident"){
                    return "red";
                }
                else if(label == "fire"){
                        return "orange";
                }
                else if(label[1] =='vehicle-accident' && label[0] == 'fire'){
                    return "#F34234";
                }
                else if(label[0] =='police' && label[1] == 'vehicle-accident'){
                    return "magenta";
                }
                else if(label[1] == "police" && label[0] == "fire"){
                    return "#A93400";
                }
                else if(label[1] == 'police' && label[2] == 'vehicle-accident' && label[0] == 'fire'){
                    return "maroon";
                }
                else{
                   
                    return "orange";
                }
        }



//    


var borderLine1 = svg1.append('line')
.attr('stroke', 'black') 
.attr('stroke-width', 6) 
.attr('x1', 50)
.attr('y1', 50)
.attr('x2', 50)
.attr('y2', 350)
.call(d3.drag().on('start', dragStartLine1).on('drag', dragLine1).on('end', dragEnd));

var line = svg1.append('line')
.attr('stroke', 'white')
.attr('stroke-width', 4)
.attr('x1', 50)
.attr('y1', 50)
.attr('x2', 50)
.attr('y2', 350)
.style('fill','white')
.call(d3.drag().on('start', dragStartLine1).on('drag', dragLine1).on('end', dragEnd));






var borderLine = svg1.append('line')
.attr('stroke', 'black') 
.attr('stroke-width', 6) 
.attr('x1', width)
.attr('y1', 50)
.attr('x2', width)
.attr('y2', 350)
.call(d3.drag().on('start', dragStartLine2).on('drag', dragLine2).on('end', dragEnd));



var line2 = svg1.append('line')
.attr('stroke', 'white')
.attr('stroke-width', 4) 
.attr('x1', width)
.attr('y1', 50)
.attr('x2', width)
.attr('y2', 350)
.call(d3.drag().on('start', dragStartLine2).on('drag', dragLine2).on('end', dragEnd));







    



    





    

    var positionLine1 = parseFloat(line.attr('x1'));
    var positionLine2 = parseFloat(line2.attr('x1'));
    var cloud_data = parsedData.filter(function (d) {
        return d.x >= positionLine1 && d.x <= positionLine2;
      });
    

    isDraggingLine1 = false;
    isDraggingLine2 = false;
    UpdateWordCloud(cloud_data);
    UpdateWordCloud(cloud_data);

  var isDraggingLine1 = false;
  var isDraggingLine2 = false;
  var minimumGap = 50;
  var maximumGap = 550;

  function dragStartLine1() {
    isDraggingLine1 = true;
  }

  function dragStartLine2() {
    isDraggingLine2 = true;
  }

  function dragLine1(event) {
    if (isDraggingLine1) {
      var mouseX = Math.max(50, Math.min(width, d3.pointer(event)[0]));

      var positionLine1 = parseFloat(line.attr('x1'));
      var positionLine2 = parseFloat(line2.attr('x1'));

      line.attr('x1', mouseX).attr('x2', mouseX);
      borderLine1.attr('x1', mouseX).attr('x2', mouseX);
      if (positionLine2 - mouseX < 50) {
        line.attr('x1', positionLine2 - 50).attr('x2', positionLine2 - 50);
        borderLine1.attr('x1', positionLine2 - 50).attr('x2', positionLine2 - 50);
      }
      

    
    }
  }

  function dragLine2(event) {
    if (isDraggingLine2) {
      var mouseX = Math.max(50, Math.min(width, d3.pointer(event)[0]));

      var positionLine1 = parseFloat(line.attr('x1'));
      var positionLine2 = parseFloat(line2.attr('x1'));

      line2.attr('x1', mouseX).attr('x2', mouseX);
      borderLine.attr('x1', mouseX).attr('x2', mouseX);
      
      if (mouseX - positionLine1 < 50) {
        line2.attr('x1', positionLine1 + 50).attr('x2', positionLine1 + 50);
        borderLine.attr('x1', positionLine1 + 50).attr('x2', positionLine1 + 50);
      }
        


  
    }
  }

  function dragEnd() {

    var positionLine1 = parseFloat(line.attr('x1'));
    var positionLine2 = parseFloat(line2.attr('x1'));
    var cloud_data = parsedData.filter(function (d) {
        return d.x >= positionLine1 && d.x <= positionLine2;
      });
    

    isDraggingLine1 = false;
    isDraggingLine2 = false;
    UpdateWordCloud(cloud_data);
  }
    
}

function UpdateWordCloud(cloud_data)
{




var margin = { top: 10, right: 30, bottom: 30, left: 60 };
var width = 500 - margin.left - margin.right;
var height = 450 - margin.top - margin.bottom;

var svg2 = d3.select("#graph3");





var message_data = cloud_data.map(d => d.message);

var allMessages = message_data.join(" ");


var wordsArray = allMessages.split(/\s+/);


var commonGrammarWords = [
  'the', 'a', 'an','rt', 'of','to', 'in', 'for', 'with', 'on', 'at', 'from', 'by', 'about', 'as', 'into', 'like', 'through', 'after', 'over', 'between', 'out', 'against', 'during', 'without', 'before', 'under', 'around', 'among',
  'and', 'but', 'or', 'nor', 'for', 'yet', 'so','not', 'only', 'because', 'since', 'while', 'although', 'though', 'even', 'if', 'once', 'unless', 'until', 'whether', 'whereas', 'wherever', 'because', 'since', 'why', 'that', 'which', 'who', 'whom', 'whose', 'what', 'when', 'where', 'how', 'than', 'then', 'just', 'here', 'there', 'also', 'still', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'own', 'same', 'so', 'than', 'too', 'very',
  'in', 'on', 'at', 'by', 'with', 'about', 'over', 'under', 'between', 'among', 'through', 'into', 'during', 'before', 'after',
  'i', 'me', 'you', 'he', 'him', 'she', 'her', 'it', 'we', 'us', 'they', 'them', 'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'themselves',
  'my', 'mine', 'your', 'yours', 'his', 'her', 'hers', 'its', 'our', 'ours', 'their', 'theirs',
  'this', 'that', 'these', 'those', 'all', 'both', 'each', 'every', 'other', 'another', 'such', 'what',
  'who', 'whom', 'whose', 'which', 'what', 'whatever', 'whoever', 'whichever', 'whomever',
  'am', 'is', 'are', 'was', 'were', 'be', 'being', 'been', '&',
  'have', 'has', 'had', 'having', 
  'do', 'does', 'did', 'doing', 
  'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must', 'ought', 'need', 'dare', 'used', 'let','1','2','3','4','5','6','7','8','9','0'
];


var wordCounts = {};

wordsArray.forEach(word => {
  var lowerCaseWord = word.toLowerCase();

  if (!commonGrammarWords.includes(lowerCaseWord) && !lowerCaseWord.startsWith('@')) {
    
    wordCounts[lowerCaseWord] = (wordCounts[lowerCaseWord] || 0) + 1;
  }
});


var wordArray = Object.keys(wordCounts).map(word => {
  return { word: word, size: wordCounts[word].toString() };
});


wordArray.sort((a, b) => b.size - a.size);


var top200Words = wordArray.slice(0, 100);





var maxSize = Math.max(...top200Words.map(word => parseInt(word.size)));
var minSize = Math.min(...top200Words.map(word => parseInt(word.size)));

// console.log("maxSize", maxSize);
// console.log("minSize", minSize);


yscale = d3.scaleLinear().domain([minSize, maxSize]).range([10, 100]);


var layout = d3.layout.cloud()
  .size([width, height])
  .words(top200Words.map(function(d) { return {text: d.word, size:d.size}; }))
  .padding(5)        
  .rotate(function() { return ~~(Math.random() * 2) * 90; })
  .fontSize(function(d) { return yscale(d.size) })      
  .on("end", draw);
layout.start();





function draw(words) {
    
    var cloud = svg2.selectAll("text")
                     .data(words, function(d) { return d.text; });

   
    cloud.enter()
        .append("text")
        .style("font-family", "Impact")
        .style("fill", function(d, i) { return fill(i); })
        .attr("text-anchor", "middle")
        .attr('font-size', 1)
        .text(function(d) { 
            
            return d.text; });

 
    cloud
        .transition()
            .duration(600)
            .style("font-size", function(d) { return d.size + "px"; })
            .attr("transform", function(d) {
                
                return "translate(" + [d.x + width / 2, d.y + height / 2] + ")rotate(" + d.rotate + ")";
            })
            .style("fill-opacity", 1);

 
    cloud.exit()
        .transition()
            .duration(200)
            .style('fill-opacity', 1e-6)
            .attr('font-size', 1)
            .remove();
}



function fill(i) {
    var color = d3.scaleOrdinal(d3.schemeCategory10);
    return color(i);
}
}
      
function updateVisualization(selectedTime,geojsonData) {
    
    const formatTime = d3.timeFormat("%H%M%S");
    const parseTime = d3.timeParse("%H%M%S");

    const selectedDate = parseTime(selectedTime);

    const endTime = new Date(selectedDate.getTime() - 30 * 60 * 1000); 

    const endTimeString = formatTime(endTime);

    const svg = d3.select("#map svg");
    
    const riskSizeScale = d3.scaleSqrt()
        .domain([0, d3.max(pointsData, d => d.time <= selectedTime && d.time >= endTimeString && d.riskScore)])
        .range([17, 20]);

        
        const filteredData = pointsData.filter(d => d.time <= selectedTime && d.time >= endTimeString && d.riskScore > 0);
      

        
    
        const categoryColorScale = d3.scaleOrdinal()
                        .domain(["fire","police","vehicle accident"])
                        .range(["red","lightblue","orange"]);

            const keyFunction = d => d.lat + "," + d.lng + "," + d.time;

            const riskCircles = svg.selectAll(".risk-circle")
                                    .data(filteredData, keyFunction);

            riskCircles.enter()
            .append("circle")
            .attr("class", "risk-circle")
            .attr("cx", d => projection([d.lng, d.lat])[0])
            .attr("cy", d => projection([d.lng, d.lat])[1])
            .attr("r", 0) 
            .merge(riskCircles) 
            .each(function(d) {
                const circle = d3.select(this);
                if (!circle.classed("growing")) {
                    circle.classed("growing", true)
                        .transition()
                        .duration(d => (d.riskScore === 1 ? 3000 : d.riskScore === 2 ? 5000 : 7000))
                        .attr("r", d => 5 * riskSizeScale(d.riskScore))
                        .style("fill", d => categoryColorScale(d.category))
                        .style('opacity', d => (d.riskScore === 1 ? 0.2 : d.riskScore === 2 ? 0.4 : 0.6))
                        .on("end", function() {
                            circle.attr("r", 0);
                            circle.classed("growing", false);
                        });
                }
            });
        

        riskCircles.exit()
                    .transition()
                    .duration(500)
                    .attr("r", 0)
                    .remove();
           
     

    const categoryIconClasses = {
        "fire": "fa-fire",
        "police": "fa-shield-alt",
        "vehicle accident": "fa-car-crash",
    };

    
    const categoryIcons = {
        "fire": "\uf06d", 
        "police": "\uf3ed", 
        "vehicle accident": "\uf5e1", 
    };

    
    const categoryColors = {
        "fire": "red",
        "police": "lightblue",
        "vehicle accident": "orange",    
    };


  const icons = svg.selectAll(".icon-group")
        .data(filteredData, d => d.lat + "," + d.lng ); 

    
    const iconEnter = icons.enter().append("g")
        .attr("class", "icon-group");
  
   
   iconEnter.append("circle")
   .attr("r", d=> riskSizeScale(d.riskScore))
   .attr("fill", d => categoryColors[d.category])
   .attr("stroke", "#ffffff")
   .attr("stroke-width", 2);

    iconEnter.append("text")
    .attr("class", d => "fas " + categoryIconClasses[d.category])
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "central")
    .attr("font-family", "FontAwesome")
    .attr("font-size", d=> riskSizeScale(d.riskScore))
    .attr("fill", "white")
    .text(d => categoryIcons[d.category]);

    icons.merge(iconEnter)
        .attr("transform", d => {
            const [x, y] = projection([d.lng, d.lat]);
            return `translate(${x},${y})`;
        });
    
        icons.exit().remove();
   }


let lastUpdatedTime = null;

function updateMessagePrompt(selectedTime, data) {

    let highestRiskEntry = data.reduce((max, d) => (d.time <= selectedTime && d.time >= selectedTime - 1200 && d.riskScore > (max.riskScore || 0)) ? d : max, {});

    let hours = Math.floor(highestRiskEntry.time / 10000) ;
    let minutes = Math.floor((highestRiskEntry.time % 10000) / 100);
    let seconds = highestRiskEntry.time % 100;

    if(minutes < 10){
        minutes = '0' + minutes
    }
    if(seconds < 10){
        seconds = '0' + seconds
    }

    let RiskTime =(hours) + ':' + (minutes) +':' + (seconds) ;
    
    let riskMessage;

    if(highestRiskEntry.category == 'fire'){
        riskMessage = 'Fire accident reported'
    }
    else if(highestRiskEntry.category == 'vehicle accident'){
        riskMessage  =  'Vehicle accident reported'
    }
    else if(highestRiskEntry.category == 'police'){
        riskMessage  =  'Police action needed'
    }

    let message = highestRiskEntry.lat 
        ? ` <span id="emergency-icon">🚨</span><b>Life Feed for City of Abila</b> <br>Time: <b>${RiskTime} P.M.</b> <br>` + `<b>${riskMessage}</b><br>Location: <b>${highestRiskEntry.location}</b> (Latitude: ${Number(highestRiskEntry.lat).toFixed(2)}, Longitude: ${Number(highestRiskEntry.lng).toFixed(2)})<br>` + `Report:<b> ${highestRiskEntry.message}</b><br>Risk score ${highestRiskEntry.riskScore}`  : `No High Risk at ${selectedTime}`;

      



    const prompt = document.getElementById('message-prompt');
    const messageText = document.getElementById('message-text');

    function updateTextAndSlideIn(newMessage) {
        messageText.innerHTML = newMessage;
        prompt.classList.remove('slide-out');
        prompt.classList.add('slide-in');
    }


    if (highestRiskEntry.time !== lastUpdatedTime) {
        lastUpdatedTime = highestRiskEntry.time;

        if (highestRiskEntry.lat) {
            const [x, y] = projection([highestRiskEntry.lng, highestRiskEntry.lat]);
            const prompt = document.getElementById('risk-prompt');
            const message = document.getElementById('risk-message');
    
            prompt.style.left = `${x}px`;
            prompt.style.top = `${y}px`;
            prompt.style.display = 'block';
            message.innerHTML = `<span id="emergency-icon">🚨</span>Location of Risk!`;
    
      
            document.getElementById('action-taken').onclick = function() {
                prompt.style.display = 'none';
            };
        }
        if (prompt.classList.contains('slide-in')) {
            prompt.classList.remove('slide-in');
            prompt.classList.add('slide-out');
            setTimeout(() => updateTextAndSlideIn(message), 500); 
        } else {
            updateTextAndSlideIn(message);
        }
    }


}



function createStreamGraph(){
    const margin = {top: 20, right: 30, bottom: 30, left: 50},
    width = 760 - margin.left - margin.right,
    height = 430 - margin.top - margin.bottom;


const svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", width + margin.left + margin.right + 200)
    .attr("height", height)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);


d3.csv("data/grouped_data_modified.csv").then(function(data) {


  data.forEach(function(d) {
    d.time = d3.timeParse("%H:%M")(d.time);
  });

  const keys = data.columns.slice(1)


  const x = d3.scaleTime()
    .domain(d3.extent(data, function(d) { return d.time; }))
    .range([0, width]);
  svg.append("g")
    .attr("transform", `translate(0, ${height*0.8})`)
    .call(d3.axisBottom(x).tickSize(-height*.8))
    .select(".domain").remove();

    svg.selectAll(".tick line").attr("stroke", "#b8b8b8");

    svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", (width+50)/2)
    .attr("y", height-30 )
    .text("Time");
    

 
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, function(d) {
      return d3.max(keys, function(key) {
        return +d[key];
      });
    })])
    .range([height-margin.top-margin.bottom-150, 0]);
  

 
  const color = d3.scaleOrdinal()
    .domain(keys)
    .range(d3.schemeDark2);

  
  const stackedData = d3.stack()
    .offset(d3.stackOffsetSilhouette)
    .keys(keys)
    (data)


    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - margin.right + 50}, ${margin.top})`); 

    
    keys.forEach((key, index) => {
      const legendItem = legend.append("g")
        .attr("transform", `translate(0, ${index * 40})`); 

      
      legendItem.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color(key));

      
      legendItem.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", "0.35em")
        .text(key)
        .style("text-anchor", "start")
        .style("font-size", "12px");
    });




  
  const Tooltip = d3.select("#my_dataviz")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("position", "absolute");

  
  const mouseover = function(event, d) {
    Tooltip.style("opacity", 1);
    d3.selectAll(".myArea").style("opacity", 0.2);
    d3.select(this)
      .style("stroke", "black")
      .style("opacity", 1);
  }
  const mousemove = function(event, d) {
    Tooltip.html("Event: " + d.key)
      .style("left", (event.x)/2 + "px")
      .style("top", (event.y)/2 - 30 + "px");
  }
  const mouseleave = function(event, d) {
    Tooltip.style("opacity", 0);
    d3.selectAll(".myArea").style("opacity", 1).style("stroke", "none");
  }

  
  const area = d3.area()
    .x(function(d) { return x(d.data.time); })
    .y0(function(d) { return y(d[0]); })
    .y1(function(d) { return y(d[1]); });
  
  
  

  svg
    .selectAll("mylayers")
    .data(stackedData)
    .join("path")
      .attr("class", "myArea")
      .style("fill", function(d) { return color(d.key); })
      .attr("d", area)
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave)
      .on("click", function(event, d) {
        generateDensityPlot(d.key);
      });

      d3.select("#toggle-junk-spam").on("change", update);
      var includeJunkSpam;
      var startTime = new Date("Mon Jan 01 1900 17:00:00 GMT-0700");
      var endTime = new Date("Mon Jan 01 1900 22:00:00 GMT-0700");
      // Update function
      function update() {
        
        includeJunkSpam = d3.select("#toggle-junk-spam").property("checked");
        
        
        
       
        const filteredKeys = includeJunkSpam ? keys : keys.filter(key => key !== 'junk/spam');
        
        const filteredStackedData = d3.stack()
          .keys(filteredKeys)
          .offset(d3.stackOffsetSilhouette)
          (data);
      
       
        const layers = svg.selectAll(".myArea")
          .data(filteredStackedData);
      
       
        layers.enter()
          .append("path")
          .attr("class", "myArea")
          .merge(layers)
          .style("fill", function(d) { return color(d.key); })
          .attr("d", area);
      
        // Exit
        layers.exit().remove();
        
      }

    const brush = d3.brushX()
    .extent([[0, 0], [width, height - margin.top - margin.bottom]])
    .on("end", brushed);

    svg.append("g")
        .attr("class", "brush")
        .call(brush);


      
     
      var checktemp = d3.select("#toggle-junk-spam")
        checktemp.on("change", function(event) {
          includeJunkSpam = d3.select("#toggle-junk-spam").property("checked");
        
          const filteredKeys = includeJunkSpam ? keys : keys.filter(key => key !== 'junk/spam');
        
        const filteredStackedData = d3.stack()
          .keys(filteredKeys)
          .offset(d3.stackOffsetSilhouette)
          (data);
      
    
        const layers = svg.selectAll(".myArea")
          .data(filteredStackedData);
     
        layers.enter()
          .append("path")
          .attr("class", "myArea")
          .merge(layers)
          .style("fill", function(d) { return color(d.key); })
          .attr("d", area);
      
       
        layers.exit().remove();
        
        
        updateBubbleChart(startTime, endTime, includeJunkSpam)
        

      });

 




      updateBubbleChart(new Date("Mon Jan 01 1900 17:00:00 GMT-0700"), new Date("Mon Jan 01 1900 22:00:00 GMT-0700"), includeJunkSpam)

      function brushed(event) {
        [startTime, endTime] = event.selection.map(x.invert);
        if (!event.selection) {
          updateBubbleChart(startTime, endTime, includeJunkSpam);
            return; 
        }
        
    
       
        updateBubbleChart(startTime, endTime, includeJunkSpam);
    }


    
      

});



function updateBubbleChart(startTime, endTime, includeJunkSpam) {

  function formatTime(date) {
    let hours = date.getHours().toString();
    let minutes = date.getMinutes().toString();
    let seconds = date.getSeconds().toString();

    // Pad with leading zeros if necessary
    hours = hours.length < 2 ? '0' + hours : hours;
    minutes = minutes.length < 2 ? '0' + minutes : minutes;
    seconds = seconds.length < 2 ? '0' + seconds : seconds;

    return hours + minutes + seconds;
  }

  //const date = new Date("Mon Jan 01 1900 17:28:50 GMT-0700");
  const starttime = formatTime(startTime);
//   console.log("printing time in bubble")
//   console.log(starttime);
  const endtime = formatTime(endTime);
//   console.log(endtime);
  globalStartTime = startTime;
  globalEndTime = endTime
  d3.select("#bubble_id svg").remove();
// Code to find top 3 authors
  d3.csv("data/Newdata.csv").then(function(data) {

    
    const junkSpamMessages = data.filter(d => d.category === 'junk/spam' && d.date >= starttime && d.date <= endtime);

    const countOfJunks = junkSpamMessages.length;

    // console.log(countOfJunks);

    
    const countsByAuthor = {};
    junkSpamMessages.forEach(d => {
      if (countsByAuthor[d.author]) {
        countsByAuthor[d.author]++;
      } else {
        countsByAuthor[d.author] = 1;
      }
    });

    const sortedAuthors = Object.entries(countsByAuthor)
      .map(([author, count]) => ({author, count}))
      .sort((a, b) => b.count - a.count)
      

    const nonJunkSpamMessages = data.filter(d => d.category !== 'junk/spam' && d.date >= starttime && d.date <= endtime);

    const countOfnotJunks = nonJunkSpamMessages.length;

    // console.log(countOfnotJunks);

    const countsByAuthor2 = {};
    nonJunkSpamMessages.forEach(d => {
      if (countsByAuthor2[d.author]) {
        countsByAuthor2[d.author]++;
      } else {
        countsByAuthor2[d.author] = 1;
      }
    });

    const sortedAuthors2 = Object.entries(countsByAuthor2)
      .map(([author, count]) => ({author, count}))
      .sort((a, b) => b.count - a.count)
     





    const junkSpamCount = countOfJunks;
    const nonJunkSpamCount = countOfnotJunks; 


    const width = 800, height = 400;
  var svg = d3.select('#bubble_id').append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom) 
  .append('g')
  .attr('transform', `translate(${margin.left},${margin.top+20})`);

  const categoriesData = [
    {
      name: 'Junk/spam',
      children: sortedAuthors.map(a => ({ name: a.author, value: a.count })),
      count: sortedAuthors.reduce((acc, cur) => acc + cur.count, 0)
    },
    {
      name: 'Meaningful',
      children: sortedAuthors2.map(a => ({ name: a.author, value: a.count })),
      count: sortedAuthors2.reduce((acc, cur) => acc + cur.count, 0)
    }
  ];

  const mainCircleScale = d3.scaleSqrt().domain([0, d3.max(categoriesData, d => d.count)]).range([0, 200]); 


  const pack = d3.pack()
    .size([100, 100]) 
    .padding(2); 

 
  if(d3.select("#toggle-junk-spam").property("checked")) {
    drawCategoryCircle(categoriesData[0], 200);
  }
  
  drawCategoryCircle(categoriesData[1], 600);

  function drawCategoryCircle(category, xCenter) {

    pack.size([mainCircleScale(category.count) * 2, mainCircleScale(category.count) * 2]);

    const rootNode = d3.hierarchy({ children: category.children })
      .sum(d => d.value); 
    
    const packedData = pack(rootNode).descendants();

    const offsetX = xCenter - packedData[0].x;
    const offsetY = height / 2 - packedData[0].y;

    const categoryGroup = svg.append('g')
      .attr('class', 'category-group')
      .attr('transform', `translate(${xCenter},${height / 2})`);

    categoryGroup.append('text')
      .text(category.name + ": " + category.count) 
      .attr('text-anchor', 'middle')
      .attr('y', -mainCircleScale(category.count) - 20) 
      .style('font-weight', 'bold')
      .style('font-size', '20px')
      .style('fill', 'black');
    
    categoryGroup.append('circle')
      .attr('r', mainCircleScale(category.count))
      .style('fill', category.name === 'Junk/spam' ? '#f3f723' : '#34c6eb')
      .style('opacity', 0.6);

    

    const nodes = categoryGroup.selectAll('.node')
      .data(packedData.slice(1))
      .enter()
      .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x - packedData[0].x}, ${d.y - packedData[0].y})`);

    nodes.append('circle')
      
      .attr('r', d => d.r)
      .style('fill', 'orange')
      .style('opacity', 0.6)
      .style('stroke-width', '2px') 
      .style('stroke', 'none') 
      .on('mouseover', function (event, d) {
        d3.select(this)
          .style('stroke', 'black')
          .style('opacity', 0.9);

        d3.select(this.parentNode).select('text')
          .text(d.data.name)
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'central')
          .style('font-size', d => `${d.r/4 + 5}px`); 
      })
      .on('mouseout', function (event, d) {
        d3.select(this)
          .style('stroke', 'none')
          .style('opacity', 0.6); 

        d3.select(this.parentNode).select('text')
          .text(d.data.value)
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'central')
          .style('font-size', d => `${d.r / 3}px`); 
      });

    nodes.append('text')
      .text(d => d.data.value)
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'central')
      .style('font-size', d => `${d.r / 3}px`); 
  }
  });

  createNetworkChart(Number(starttime),Number(endtime))
}
}

})
