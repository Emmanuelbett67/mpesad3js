import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Transaction } from "@/lib/csv-loader";

interface WeekdayChartProps {
  data: Transaction[];
}

const WeekdayChart: React.FC<WeekdayChartProps> = ({ data }) => {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || !data.length) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const margin = { top: 30, right: 20, bottom: 40, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    // Process data by weekday
    const weekdayData = d3.rollups(
      data.filter((d) => d.direction === "OUT"),
      (v) => d3.sum(v, (d) => d.clean_amount),
      (d) => d3.timeFormat("%A")(new Date(d.date))
    );

    const weekdays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    const chartData = weekdays.map((day) => ({
      day,
      amount: weekdayData.find(([d]) => d === day)?.[1] || 0,
    }));

    const x = d3
      .scaleBand()
      .domain(weekdays)
      .range([0, width])
      .padding(0.4);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(chartData, (d) => d.amount) || 0])
      .nice()
      .range([height, 0]);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("g").call(d3.axisLeft(y));
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    g.selectAll("rect")
      .data(chartData)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.day) || 0)
      .attr("y", (d) => y(d.amount))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - y(d.amount))
      .attr("fill", (d, i) => color(i.toString()));

    g.selectAll("text.label")
      .data(chartData)
      .enter()
      .append("text")
      .attr("x", (d) => (x(d.day) || 0) + x.bandwidth() / 2)
      .attr("y", (d) => y(d.amount) - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .text((d) => `KES ${d3.format(",")(Math.round(d.amount))}`);
  }, [data]);

  return <svg ref={ref} width={500} height={250} />;
};

export default WeekdayChart; 