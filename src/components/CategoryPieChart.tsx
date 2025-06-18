import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Transaction } from "@/lib/csv-loader";

interface CategoryPieChartProps {
  data: Transaction[];
  onTopCategories?: (top3: {category: string, amount: number, percent: number, color: string}[]) => void;
}

const MAX_LABELS = 5; // Show external labels for top 5 or >5% slices
const MIN_PERCENT_FOR_LABEL = 5;
const ABBREV_LENGTH = 16;

const abbreviate = (str: string) =>
  str.length > ABBREV_LENGTH ? str.slice(0, ABBREV_LENGTH - 2) + "…" : str;

const PIE_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
  "#06b6d4", "#84cc16", "#f97316", "#ec4899", "#6366f1"
];

type PieDatum = {
  category: string;
  amount: number;
  count: number;
  avgAmount: number;
};

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data, onTopCategories }) => {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || !data.length) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 20, bottom: 20, left: 20 };
    const width = 500 - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;
    const radius = Math.min(width, height) / 2 - 20;

    // Filter only OUT transactions for spending categories
    const outTransactions = data.filter((d: Transaction) => d.direction === "OUT");

    const grouped = d3.rollups(
      outTransactions,
      (v: Transaction[]) => ({
        amount: d3.sum(v, (d: Transaction) => d.clean_amount),
        count: v.length,
        avgAmount: d3.mean(v, (d: Transaction) => d.clean_amount) || 0
      }),
      (d: Transaction) => d.category
    );

    const pieData: PieDatum[] = grouped
      .map(([category, values]: [string, {amount: number, count: number, avgAmount: number}]) => ({ 
        category, 
        amount: values.amount,
        count: values.count,
        avgAmount: values.avgAmount
      }))
      .sort((a: PieDatum, b: PieDatum) => b.amount - a.amount)
      .slice(0, 10); // Show top 10 categories

    const totalSpending = d3.sum(pieData, (d: PieDatum) => d.amount);

    // Create color scale
    const color = d3.scaleOrdinal<string>()
      .domain(pieData.map((d: PieDatum) => d.category))
      .range(PIE_COLORS);

    // Pass top 3 categories to parent if callback provided
    if (onTopCategories) {
      const top3 = pieData.slice(0, 3).map((d: PieDatum, i: number) => ({
        category: d.category,
        amount: d.amount,
        percent: +(d.amount / totalSpending * 100).toFixed(1),
        color: PIE_COLORS[i % PIE_COLORS.length]
      }));
      onTopCategories(top3);
    }

    const pie = d3.pie<PieDatum>()
      .value((d: PieDatum) => d.amount)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<PieDatum>>()
      .innerRadius(0)
      .outerRadius(radius);

    const outerArc = d3
      .arc<d3.PieArcDatum<PieDatum>>()
      .innerRadius(radius * 0.95)
      .outerRadius(radius * 0.95);

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2 + margin.left},${height / 2 + margin.top})`);

    // Add gradient definitions
    const defs = svg.append("defs");
    
    pieData.forEach((d: PieDatum, i: number) => {
      const gradient = defs
        .append("radialGradient")
        .attr("id", `gradient-${i}`)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("r", "50%");

      gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", color(d.category))
        .attr("stop-opacity", 1);

      gradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", d3.color(color(d.category))?.darker(0.3) as string)
        .attr("stop-opacity", 1);
    });

    const arcs = g.selectAll("arc").data(pie(pieData)).enter().append("g");

    // Add pie slices with gradients
    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (_d: d3.PieArcDatum<PieDatum>, i: number) => `url(#gradient-${i})`)
      .attr("stroke", "white")
      .style("stroke-width", "2px")
      .style("cursor", "pointer")
      .on("mouseover", function(this: SVGPathElement, event: MouseEvent, d: d3.PieArcDatum<PieDatum>) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("transform", "scale(1.05)");
        
        // Show tooltip
        const tooltip = d3.select("body")
          .append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background", "rgba(0,0,0,0.9)")
          .style("color", "white")
          .style("padding", "12px")
          .style("border-radius", "6px")
          .style("font-size", "13px")
          .style("pointer-events", "none")
          .style("z-index", "1000")
          .style("box-shadow", "0 4px 6px rgba(0,0,0,0.1)");

        const percentage = ((d.data.amount / totalSpending) * 100).toFixed(1);
        
        tooltip.html(`
          <div style=\"font-weight: bold; margin-bottom: 8px; color: ${color(d.data.category)}\">
            ${d.data.category}
          </div>
          <div style=\"margin-bottom: 4px\">
            <strong>Amount:</strong> KES ${d3.format(",")(Math.round(d.data.amount))}
          </div>
          <div style=\"margin-bottom: 4px\">
            <strong>Percentage:</strong> ${percentage}%
          </div>
          <div style=\"margin-bottom: 4px\">
            <strong>Transactions:</strong> ${d.data.count}
          </div>
          <div>
            <strong>Average:</strong> KES ${d3.format(",")(Math.round(d.data.avgAmount))}
          </div>
        `);

        tooltip
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mousemove", function(event: MouseEvent) {
        d3.select(".tooltip")
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function(this: SVGPathElement) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("transform", "scale(1)");
        d3.selectAll(".tooltip").remove();
      });

    // Only show external labels for top N or >5% slices
    const labelCandidates = pie(pieData)
      .map((d: d3.PieArcDatum<PieDatum>, i: number) => ({
        ...d,
        percentage: (d.data.amount / totalSpending) * 100,
        isLabel: i < MAX_LABELS || (d.data.amount / totalSpending) * 100 > MIN_PERCENT_FOR_LABEL
      }));

    // Add percentage labels on slices (only for larger slices)
    arcs
      .append("text")
      .attr("transform", (d: d3.PieArcDatum<PieDatum>, i: number) => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", "white")
      .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.7)")
      .text((d: d3.PieArcDatum<PieDatum>, i: number) => {
        const percentage = ((d.data.amount / totalSpending) * 100).toFixed(1);
        return (i < MAX_LABELS || +percentage > MIN_PERCENT_FOR_LABEL) ? percentage + "%" : "";
      });

    // Add polylines and external labels only for labelCandidates
    g.selectAll("polyline")
      .data(labelCandidates.filter((d: any) => d.isLabel))
      .enter()
      .append("polyline")
      .attr("points", (d: d3.PieArcDatum<PieDatum>) => {
        const pos = outerArc.centroid(d);
        const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        pos[0] = radius * 0.95 * (midAngle < Math.PI ? 1 : -1);
        return [arc.centroid(d), outerArc.centroid(d), pos];
      })
      .style("fill", "none")
      .style("stroke", "#666")
      .style("stroke-width", "1px")
      .style("opacity", 0.6);

    g.selectAll("text.category-label")
      .data(labelCandidates.filter((d: any) => d.isLabel))
      .enter()
      .append("text")
      .attr("class", "category-label")
      .attr("transform", (d: d3.PieArcDatum<PieDatum>) => {
        const pos = outerArc.centroid(d);
        const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        pos[0] = radius * 1.1 * (midAngle < Math.PI ? 1 : -1);
        return `translate(${pos})`;
      })
      .attr("text-anchor", (d: d3.PieArcDatum<PieDatum>) => {
        const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        return midAngle < Math.PI ? "start" : "end";
      })
      .style("font-size", "11px")
      .style("font-weight", "500")
      .style("fill", "#374151")
      .text((d: d3.PieArcDatum<PieDatum>) => abbreviate(d.data.category));

    // Add title
    svg
      .append("text")
      .attr("x", width / 2 + margin.left)
      .attr("y", margin.top - 20)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .style("fill", "#374151")
      .text("Spending by Category");

    // Add subtitle with total spending
    svg
      .append("text")
      .attr("x", width / 2 + margin.left)
      .attr("y", margin.top)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#6b7280")
      .text(`Total Spending: KES ${d3.format(",")(Math.round(totalSpending))}`);

    // (No summary rendering here)

  }, [data, onTopCategories]);

  return <svg ref={ref} width={700} height={350} />;
};

export default CategoryPieChart; 