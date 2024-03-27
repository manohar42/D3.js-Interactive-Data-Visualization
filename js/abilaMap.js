
export function createAbilaMap() {
const width = 960, height = 600;
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
     
    
    d3.csv('data/New3.csv').then(data => {
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
        }, 1000); // 1 second delay
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
    
        
        
    function updateVisualization(selectedTime,geojsonData) {
    
        const formatTime = d3.timeFormat("%H%M%S");
        const parseTime = d3.timeParse("%H%M%S");
    
        const selectedDate = parseTime(selectedTime);
    
        const endTime = new Date(selectedDate.getTime() - 30 * 60 * 1000); 
    
        const endTimeString = formatTime(endTime);
    
        const svg = d3.select("#map svg");
        
        const riskSizeScale = d3.scaleSqrt()
            .domain([0, d3.max(pointsData, d => d.time <= selectedTime && d.time >= endTimeString && d.riskScore)])
            .range([4, 10]);
    
            
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
    
        let hours = Math.floor(highestRiskEntry.time / 10000) - 12;
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
    

}