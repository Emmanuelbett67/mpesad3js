import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Transaction } from "@/lib/csv-loader";

interface InOutBarChartProps {
  data: Transaction[];
}

const InOutBarChart: React.FC<InOutBarChartProps> = ({ data }) => {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || !data.length) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const margin = { top: 30, right: 20, bottom: 40, left: 60 };
    const width = 400 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const grouped = d3.rollups(
      data,
      (v) => d3.sum(v, (d) => d.clean_amount),
      (d) => d.direction
    );

    const totals = grouped.map(([direction, amount]) => ({
      direction,
      amount,
      label: `KES ${d3.format(",")(Math.round(amount))}`,
    }));

    const x = d3
      .scaleBand()
      .domain(["IN", "OUT"])
      .range([0, width])
      .padding(0.4);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(totals, (d) => d.amount) || 0])
      .nice()
      .range([height, 0]);

    const color = d3
      .scaleOrdinal()
      .domain(["IN", "OUT"])
      .range(["#1b9e77", "#d95f02"]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("g").call(d3.axisLeft(y));
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    g.selectAll("rect")
      .data(totals)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.direction) || 0)
      .attr("y", (d) => y(d.amount))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - y(d.amount))
      .attr("fill", (d) => color(d.direction));

    g.selectAll("text.label")
      .data(totals)
      .enter()
      .append("text")
      .attr("x", (d) => (x(d.direction) || 0) + x.bandwidth() / 2)
      .attr("y", (d) => y(d.amount) - 10)
      .attr("text-anchor", "middle")
      .text((d) => d.label)
      .style("font-weight", "bold");
  }, [data]);

  return <svg ref={ref} width={400} height={250} />;
};

export default InOutBarChart; 