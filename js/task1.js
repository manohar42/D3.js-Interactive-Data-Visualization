// var startTimeExp = 61200;
// var endTimeExp = 77285;


// export function createStreamGraph() {

// const margin = {top: 20, right: 30, bottom: 30, left: 50},
//     width = 660 - margin.left - margin.right,
//     height = 400 - margin.top - margin.bottom;

// // append the svg object to the body of the page
// const svg = d3.select("#my_dataviz")
//   .append("svg")
//     .attr("width", width + margin.left + margin.right)
//     .attr("height", height)
//   .append("g")
//     .attr("transform", `translate(${margin.left},${margin.top})`);

// // Parse the Data
// d3.csv("data/grouped_data_modified.csv").then(function(data) {

//   // Convert time to a parseable format (if necessary)
//   data.forEach(function(d) {
//     d.time = d3.timeParse("%H:%M")(d.time);
//   });

//   // List of groups = header of the csv files
//   const keys = data.columns.slice(1)

//   // Add X axis
//   const x = d3.scaleTime()
//     .domain(d3.extent(data, function(d) { return d.time; }))
//     .range([0, width]);
//   svg.append("g")
//     .attr("transform", `translate(0, ${height*0.8})`)
//     .call(d3.axisBottom(x).tickSize(-height*.8))
//     .select(".domain").remove();

//     svg.selectAll(".tick line").attr("stroke", "#b8b8b8");

//     svg.append("text")
//     .attr("text-anchor", "end")
//     .attr("x", (width+50)/2)
//     .attr("y", height-30 )
//     .text("Time");
    

//   // Add Y axis
//   const y = d3.scaleLinear()
//     .domain([0, d3.max(data, function(d) {
//       return d3.max(keys, function(key) {
//         return +d[key];
//       });
//     })])
//     .range([height-margin.top-margin.bottom-150, 0]);
//   // svg.append("g")
//   //   .call(d3.axisLeft(y));

//   // color palette
//   const color = d3.scaleOrdinal()
//     .domain(keys)
//     .range(d3.schemeDark2);

//   // Stack the data with silhouette offset
//   const stackedData = d3.stack()
//     .offset(d3.stackOffsetSilhouette)
//     .keys(keys)
//     (data)

//   // Create a tooltip
//   const Tooltip = d3.select("#my_dataviz")
//     .append("div")
//     .style("opacity", 0)
//     .attr("class", "tooltip")
//     .style("background-color", "white")
//     .style("border", "solid")
//     .style("border-width", "2px")
//     .style("border-radius", "5px")
//     .style("padding", "5px")
//     .style("position", "absolute");

//   // Three functions that change the tooltip when user hover / move / leave a cell
//   const mouseover = function(event, d) {
//     Tooltip.style("opacity", 1);
//     d3.selectAll(".myArea").style("opacity", 0.2);
//     d3.select(this)
//       .style("stroke", "black")
//       .style("opacity", 1);
//   }
//   const mousemove = function(event, d) {
//     Tooltip.html("Event: " + d.key)
//       .style("left", (event.x)/2 + "px")
//       .style("top", (event.y)/2 - 30 + "px");
//   }
//   const mouseleave = function(event, d) {
//     Tooltip.style("opacity", 0);
//     d3.selectAll(".myArea").style("opacity", 1).style("stroke", "none");
//   }

//   // Area generator
//   const area = d3.area()
//     .x(function(d) { return x(d.data.time); })
//     .y0(function(d) { return y(d[0]); })
//     .y1(function(d) { return y(d[1]); });
  
  
  
//   // Show the areas
//   svg
//     .selectAll("mylayers")
//     .data(stackedData)
//     .join("path")
//       .attr("class", "myArea")
//       .style("fill", function(d) { return color(d.key); })
//       .attr("d", area)
//       .on("mouseover", mouseover)
//       .on("mousemove", mousemove)
//       .on("mouseleave", mouseleave)
//       .on("click", function(event, d) {
//         generateDensityPlot(d.key);
//       });

//       d3.select("#toggle-junk-spam").on("change", update);

//       // Update function
//       function update() {
//         // Check the checkbox state
//         const includeJunkSpam = d3.select("#toggle-junk-spam").property("checked");
        
//         // Filter keys based on the checkbox
//         const filteredKeys = includeJunkSpam ? keys : keys.filter(key => key !== 'junk/spam');
//         //console.log(filteredKeys);
//         // Recalculate the stack data with the filtered keys
//         const filteredStackedData = d3.stack()
//           .keys(filteredKeys)
//           .offset(d3.stackOffsetSilhouette)
//           (data);
      
//         // Bind the new data
//         const layers = svg.selectAll(".myArea")
//           .data(filteredStackedData);
      
//         // Enter + Update
//         layers.enter()
//           .append("path")
//           .attr("class", "myArea")
//           .merge(layers)
//           .style("fill", function(d) { return color(d.key); })
//           .attr("d", area);
      
//         // Exit
//         layers.exit().remove();
//       }

//     const brush = d3.brushX()
//     .extent([[0, 0], [width, height - margin.top - margin.bottom]])
//     .on("end", brushed);

//     svg.append("g")
//         .attr("class", "brush")
//         .call(brush);


      
//       // Initial call to update to draw the chart for the first time
//       update();

//       function brushed(event) {
//         if (!event.selection) {
//             return; // Only proceed if a selection was made
//         }
//         const [startTime, endTime] = event.selection.map(x.invert);
    
//         // Now use these start and end times to filter the data for the bubble chart
        
//         startTimeExp = startTime
//         endTimeExp = endTime
//         console.log("new startimt: " , startTimeExp)
//         updateBubbleChart(startTime, endTime);
//     }


      

// });

// function updateBubbleChart(startTime, endTime) {
//   //console.log("starting :", startTime)
//   //console.log("Ending :", endTime)
//   function formatTime(date) {
//     let hours = date.getHours().toString();
//     let minutes = date.getMinutes().toString();
//     let seconds = date.getSeconds().toString();

//     // Pad with leading zeros if necessary
//     hours = hours.length < 2 ? '0' + hours : hours;
//     minutes = minutes.length < 2 ? '0' + minutes : minutes;
//     seconds = seconds.length < 2 ? '0' + seconds : seconds;

//     return hours + minutes + seconds;
//   }

//   //const date = new Date("Mon Jan 01 1900 17:28:50 GMT-0700");
//   const starttime = formatTime(startTime);
//   //console.log(starttime);
//   const endtime = formatTime(endTime);
//   //console.log(endtime);
//   d3.select("#bubble_id svg").remove();
// // Code to find top 3 authors
//   d3.csv("data/Newdata.csv").then(function(data) {

//     // Filter for 'junk/spam' messages
//     const junkSpamMessages = data.filter(d => d.category === 'junk/spam' && d.date >= starttime && d.date <= endtime);

//     const countOfJunks = junkSpamMessages.length;

//     //console.log(countOfJunks);

//     // Aggregate counts by author
//     const countsByAuthor = {};
//     junkSpamMessages.forEach(d => {
//       if (countsByAuthor[d.author]) {
//         countsByAuthor[d.author]++;
//       } else {
//         countsByAuthor[d.author] = 1;
//       }
//     });

//     // Convert to an array and sort to find the top 3 authors
//     const sortedAuthors = Object.entries(countsByAuthor)
//       .map(([author, count]) => ({author, count}))
//       .sort((a, b) => b.count - a.count)
//       //.slice(0, 4);

//     // Display or use the result
//     //console.log('Top 3 authors with most junk/spam messages:', sortedAuthors);

//     const nonJunkSpamMessages = data.filter(d => d.category !== 'junk/spam' && d.date >= starttime && d.date <= endtime);

//     const countOfnotJunks = nonJunkSpamMessages.length;

//     //console.log(countOfnotJunks);

//     // Aggregate counts by author
//     const countsByAuthor2 = {};
//     nonJunkSpamMessages.forEach(d => {
//       if (countsByAuthor2[d.author]) {
//         countsByAuthor2[d.author]++;
//       } else {
//         countsByAuthor2[d.author] = 1;
//       }
//     });

//     // Convert to an array and sort to find the top 3 authors
//     const sortedAuthors2 = Object.entries(countsByAuthor2)
//       .map(([author, count]) => ({author, count}))
//       .sort((a, b) => b.count - a.count)
//       //.slice(0, 10);

//     // Display or use the result
//     //console.log('Top 3 authors with most non-junk/spam messages:', sortedAuthors2);





//     const junkSpamCount = countOfJunks; // Total count for junk/spam messages
//     const nonJunkSpamCount = countOfnotJunks; // Total count for non-junk/spam messages


//     const width = 800, height = 400;
//   var svg = d3.select('#bubble_id').append('svg')
//   .attr('width', width + margin.left + margin.right)
//   .attr('height', height + margin.top + margin.bottom) // Adjust height if necessary
//   .append('g')
//   .attr('transform', `translate(${margin.left},${margin.top+20})`);

//   const categoriesData = [
//     {
//       name: 'Junk/spam',
//       children: sortedAuthors.map(a => ({ name: a.author, value: a.count })),
//       count: sortedAuthors.reduce((acc, cur) => acc + cur.count, 0) // Sum of counts for scaling
//     },
//     {
//       name: 'Not junk/spam',
//       children: sortedAuthors2.map(a => ({ name: a.author, value: a.count })),
//       count: sortedAuthors2.reduce((acc, cur) => acc + cur.count, 0) // Sum of counts for scaling
//     }
//   ];

//   const mainCircleScale = d3.scaleSqrt().domain([0, d3.max(categoriesData, d => d.count)]).range([0, 200]); // Adjust 100 to your actual max count if needed


//   const pack = d3.pack()
//     .size([100, 100]) // The size will be dynamically set when drawing the circles
//     .padding(2); // Sets some padding between the circles

//   // Function to draw packed circles


//   drawCategoryCircle(categoriesData[0], 200);
//   drawCategoryCircle(categoriesData[1], 600);

//   function drawCategoryCircle(category, xCenter) {
//     // Set the dynamic size based on the category count
//     pack.size([mainCircleScale(category.count) * 2, mainCircleScale(category.count) * 2]);

//     // Create a root node with the hierarchical data and apply the pack layout
//     // Make sure that the structure passed to d3.hierarchy has a children property
//     const rootNode = d3.hierarchy({ children: category.children })
//       .sum(d => d.value); // Make sure this points to the numeric property for leaf nodes
    
//     const packedData = pack(rootNode).descendants();

//     // Offset to center the packed group
//     const offsetX = xCenter - packedData[0].x;
//     const offsetY = height / 2 - packedData[0].y;

//     const categoryGroup = svg.append('g')
//       .attr('class', 'category-group')
//       .attr('transform', `translate(${xCenter},${height / 2})`);

//     categoryGroup.append('text')
//       .text(category.name) // Use the name property from the category data
//       .attr('text-anchor', 'middle')
//       .attr('y', -mainCircleScale(category.count) - 20) // Position above the circle
//       .style('font-weight', 'bold')
//       .style('font-size', '20px')
//       .style('fill', 'black');
//     // Draw the large background circle for the category
//     categoryGroup.append('circle')
//       .attr('r', mainCircleScale(category.count))
//       .style('fill', category.name === 'Junk/spam' ? '#f3f723' : '#34c6eb')
//       .style('opacity', 0.6);

    

//     // Draw the packed circles using the unique group for the category
//     const nodes = categoryGroup.selectAll('.node')
//       .data(packedData.slice(1)) // Slice to skip the root node
//       .enter()
//       .append('g')
//         .attr('class', 'node')
//         .attr('transform', d => `translate(${d.x - packedData[0].x}, ${d.y - packedData[0].y})`);

//     nodes.append('circle')
//       .attr('r', d => d.r)
//       .style('fill', 'orange')
//       .style('opacity', 0.6)
//       .style('stroke-width', '2px') // Set initial stroke width
//       .style('stroke', 'none') // Set initial stroke color
//       .on('mouseover', function (event, d) {
//         d3.select(this)
//           .style('stroke', 'black')
//           .style('opacity', 0.9); // Add stroke on hover

//         d3.select(this.parentNode).select('text')
//           .text(d.data.name)
//           .attr('text-anchor', 'middle')
//           .attr('alignment-baseline', 'central')
//           .style('font-size', d => `${d.r/4 + 5}px`); // Change text to author's name
//       })
//       .on('mouseout', function (event, d) {
//         d3.select(this)
//           .style('stroke', 'none')
//           .style('opacity', 0.6); // Remove stroke on mouseout

//         d3.select(this.parentNode).select('text')
//           .text(d.data.value)
//           .attr('text-anchor', 'middle')
//           .attr('alignment-baseline', 'central')
//           .style('font-size', d => `${d.r / 3}px`); // Revert text to count
//       });

//     nodes.append('text')
//       .text(d => d.data.value)
//       .attr('text-anchor', 'middle')
//       .attr('alignment-baseline', 'central')
//       .style('font-size', d => `${d.r / 3}px`); // Adjust font size based on radius
//   }
//   });

//   console.log("return values")
//   console.log(startTimeExp)
//   localStorage.setItem('eventName', 'eventDetails');
//   return { startTimeExp,endTimeExp}
// }
// }