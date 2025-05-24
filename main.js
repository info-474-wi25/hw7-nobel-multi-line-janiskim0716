// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 60, left: 70 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create the SVG container and group element for the chart
const svgLine = d3.select("#lineChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// 2: LOAD DATA
d3.csv("nobel_laureates.csv").then(data => {
    // 2.a: REFORMAT DATA
    data.forEach(d => {
        d.year = +d.year;
        d.name = d.fullname;
    });

    // 3.a: Categorize data into STEM and Non-STEM
    const stemCategories = ["medicine", "physics", "chemistry"];
    const categorizedData = data.map(d => ({
        ...d,
        categoryGroup: stemCategories.includes(d.category) ? "STEM" : "Non-STEM"
    }));

    // 3.b: Group data by categoryGroup and year
    const categories = d3.rollup(
        categorizedData,
        v => d3.rollup(
            v,
            values => values.length,
            d => d.year
        ),
        d => d.categoryGroup
    );

    // 4: SET SCALES
    const allYears = Array.from(categories.values())
        .flatMap(yearMap => Array.from(yearMap.keys()));

    const yearCounts = Array.from(categories.values())
        .map(categoryMap => Array.from(categoryMap.values()));

    const maxCount = d3.max(yearCounts, values => d3.max(values));

    const xScale = d3.scaleLinear()
        .domain(d3.extent(allYears))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, maxCount + 1])
        .range([height, 0]);

    const colorScale = d3.scaleOrdinal()
        .domain(Array.from(categories.keys()))
        .range(d3.schemeCategory10);

    // 5: PLOT LINES
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.count));

    const dataArray = Array.from(categories.entries());

    svgLine.selectAll(".line-path")
        .data(dataArray)
        .enter()
        .append("path")
        .attr("class", "line-path")
        .attr("fill", "none")
        .attr("stroke", d => colorScale(d[0]))
        .attr("stroke-width", 2)
        .attr("d", d => {
            const yearMap = d[1];
            const values = Array.from(yearMap.entries())
                .map(([year, count]) => ({ year, count }))
                .sort((a, b) => a.year - b.year);
            return line(values);
        });

    // 6: ADD AXES
    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
    svgLine.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);

    const yAxis = d3.axisLeft(yScale);
    svgLine.append("g").call(yAxis);

    // 7: ADD LABELS
    svgLine.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .attr("class", "chart-title")
        .text("Nobel Laureates in STEM vs Non-STEM by Year");

    svgLine.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .text("Year");

    svgLine.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .text("Number of Laureates");

    // 8: LEGEND
    const legend = svgLine.selectAll(".legend")
        .data(Array.from(categories.keys()))
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", colorScale);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(d => d);
});
