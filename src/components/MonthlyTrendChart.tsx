import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Transaction } from "@/lib/csv-loader";

interface MonthlyTrendChartProps {
  data: Transaction[];
}

const CHART_WIDTH = 700;
const CHART_HEIGHT = 350;

const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({ data }) => {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || !data.length) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 30, bottom: 60, left: 80 };
    const width = CHART_WIDTH - margin.left - margin.right;
    const height = CHART_HEIGHT - margin.top - margin.bottom;

    // Process data by month
    const monthlyData = d3.rollups(
      data,
      (v) => ({
        total: d3.sum(v, (d) => d.clean_amount),
        in: d3.sum(v.filter((d) => d.direction === "IN"), (d) => d.clean_amount),
        out: d3.sum(v.filter((d) => d.direction === "OUT"), (d) => d.clean_amount),
        transactionCount: v.length,
      }),
      (d) => d3.timeMonth(new Date(d.date))
    );

    const chartData = monthlyData
      .map(([date, values]) => ({
        date: date as Date,
        ...values,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const x = d3
      .scaleTime()
      .domain(d3.extent(chartData, (d) => d.date) as [Date, Date])
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(chartData, (d) => Math.max(d.in, d.out)) * 1.1 || 0,
      ])
      .nice()
      .range([height, 0]);

    // Create lines
    const lineIn = d3
      .line<{ date: Date; in: number; out: number }>()
      .x((d) => x(d.date))
      .y((d) => y(d.in))
      .curve(d3.curveMonotoneX);

    const lineOut = d3
      .line<{ date: Date; in: number; out: number }>()
      .x((d) => x(d.date))
      .y((d) => y(d.out))
      .curve(d3.curveMonotoneX);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add gradient definitions
    const defs = svg.append("defs");
    
    // Gradient for inflow
    const gradientIn = defs
      .append("linearGradient")
      .attr("id", "gradientIn")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0)
      .attr("y1", y(0))
      .attr("x2", 0)
      .attr("y2", y(d3.max(chartData, d => d.in) || 0));

    gradientIn
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#10b981")
      .attr("stop-opacity", 0.8);

    gradientIn
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#10b981")
      .attr("stop-opacity", 0.1);

    // Gradient for outflow
    const gradientOut = defs
      .append("linearGradient")
      .attr("id", "gradientOut")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0)
      .attr("y1", y(0))
      .attr("x2", 0)
      .attr("y2", y(d3.max(chartData, d => d.out) || 0));

    gradientOut
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#ef4444")
      .attr("stop-opacity", 0.8);

    gradientOut
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#ef4444")
      .attr("stop-opacity", 0.1);

    // Add grid lines
    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3.axisBottom(x)
          .tickSize(-height)
          .tickFormat(() => "")
          .tickValues(x.ticks(12))
      )
      .style("opacity", 0.2);

    g.append("g")
      .attr("class", "grid")
      .call(
        d3.axisLeft(y)
          .tickSize(-width)
          .tickFormat(() => "")
          .tickValues(y.ticks(8))
      )
      .style("opacity", 0.2);

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3.axisBottom(x)
          .tickFormat(d3.timeFormat("%b %Y"))
          .tickValues(x.ticks(12))
      )
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    g.append("g")
      .call(d3.axisLeft(y).tickFormat(d => `KES ${d3.format(",")(d)}`));

    // Add area for inflow
    const areaIn = d3
      .area<{ date: Date; in: number; out: number }>()
      .x((d) => x(d.date))
      .y0(y(0))
      .y1((d) => y(d.in))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(chartData)
      .attr("fill", "url(#gradientIn)")
      .attr("d", areaIn);

    // Add area for outflow
    const areaOut = d3
      .area<{ date: Date; in: number; out: number }>()
      .x((d) => x(d.date))
      .y0(y(0))
      .y1((d) => y(d.out))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(chartData)
      .attr("fill", "url(#gradientOut)")
      .attr("d", areaOut);

    // Add lines
    g.append("path")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", "#10b981")
      .attr("stroke-width", 3)
      .attr("d", lineIn);

    g.append("path")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 3)
      .attr("d", lineOut);

    // Add dots for inflow
    g.selectAll("circle.in")
      .data(chartData)
      .enter()
      .append("circle")
      .attr("class", "in")
      .attr("cx", (d) => x(d.date))
      .attr("cy", (d) => y(d.in))
      .attr("r", 5)
      .attr("fill", "#10b981")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("r", 8);
        
        // Show tooltip
        const tooltip = d3.select("body")
          .append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background", "rgba(0,0,0,0.8)")
          .style("color", "white")
          .style("padding", "8px")
          .style("border-radius", "4px")
          .style("font-size", "12px")
          .style("pointer-events", "none")
          .style("z-index", "1000");

        tooltip.html(`
          <strong>${d3.timeFormat("%B %Y")(d.date)}</strong><br/>
          Inflow: KES ${d3.format(",")(Math.round(d.in))}<br/>
          Outflow: KES ${d3.format(",")(Math.round(d.out))}<br/>
          Net: KES ${d3.format(",")(Math.round(d.in - d.out))}<br/>
          Transactions: ${d.transactionCount}
        `);

        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("r", 5);
        d3.selectAll(".tooltip").remove();
      });

    // Add dots for outflow
    g.selectAll("circle.out")
      .data(chartData)
      .enter()
      .append("circle")
      .attr("class", "out")
      .attr("cx", (d) => x(d.date))
      .attr("cy", (d) => y(d.out))
      .attr("r", 5)
      .attr("fill", "#ef4444")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("r", 8);
        
        // Show tooltip
        const tooltip = d3.select("body")
          .append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background", "rgba(0,0,0,0.8)")
          .style("color", "white")
          .style("padding", "8px")
          .style("border-radius", "4px")
          .style("font-size", "12px")
          .style("pointer-events", "none")
          .style("z-index", "1000");

        tooltip.html(`
          <strong>${d3.timeFormat("%B %Y")(d.date)}</strong><br/>
          Inflow: KES ${d3.format(",")(Math.round(d.in))}<br/>
          Outflow: KES ${d3.format(",")(Math.round(d.out))}<br/>
          Net: KES ${d3.format(",")(Math.round(d.in - d.out))}<br/>
          Transactions: ${d.transactionCount}
        `);

        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("r", 5);
        d3.selectAll(".tooltip").remove();
      });

    // Add legend
    const legend = svg
      .append("g")
      .attr("transform", `translate(${width + margin.left + 20}, ${margin.top})`);

    // Legend for inflow
    legend
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", "#10b981");

    legend
      .append("text")
      .attr("x", 20)
      .attr("y", 12)
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("Inflow");

    // Legend for outflow
    legend
      .append("rect")
      .attr("x", 0)
      .attr("y", 25)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", "#ef4444");

    legend
      .append("text")
      .attr("x", 20)
      .attr("y", 37)
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("Outflow");
  }, [data]);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        ref={ref}
        width="100%"
        height={CHART_HEIGHT}
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        preserveAspectRatio="xMinYMin meet"
        style={{ display: "block", maxWidth: "100%" }}
      />
    </div>
  );
};

export default MonthlyTrendChart; 