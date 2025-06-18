import React from "react";
import { Transaction } from "@/lib/csv-loader";
import * as d3 from "d3";

interface SummaryStatsProps {
  data: Transaction[];
}

const SummaryStats: React.FC<SummaryStatsProps> = ({ data }) => {
  if (!data.length) return <div>Loading...</div>;

  const totalIn = d3.sum(data.filter((d) => d.direction === "IN"), (d) => d.clean_amount);
  const totalOut = d3.sum(data.filter((d) => d.direction === "OUT"), (d) => d.clean_amount);
  const netFlow = totalIn - totalOut;
  const totalTransactions = data.length;
  const avgTransaction = d3.mean(data, (d) => d.clean_amount) || 0;

  const topCategories = d3
    .rollups(
      data.filter((d) => d.direction === "OUT"),
      (v) => d3.sum(v, (d) => d.clean_amount),
      (d) => d.category
    )
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Total Inflow</h3>
        <p className="text-2xl font-bold text-green-600">
          KES {d3.format(",")(Math.round(totalIn))}
        </p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Total Outflow</h3>
        <p className="text-2xl font-bold text-red-600">
          KES {d3.format(",")(Math.round(totalOut))}
        </p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Net Flow</h3>
        <p className={`text-2xl font-bold ${netFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
          KES {d3.format(",")(Math.round(netFlow))}
        </p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
        <p className="text-2xl font-bold text-blue-600">{totalTransactions}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Average Transaction</h3>
        <p className="text-2xl font-bold text-purple-600">
          KES {d3.format(",")(Math.round(avgTransaction))}
        </p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Top Spending Category</h3>
        <p className="text-lg font-bold text-orange-600">
          {topCategories[0]?.category || "N/A"}
        </p>
        <p className="text-sm text-gray-500">
          KES {d3.format(",")(Math.round(topCategories[0]?.amount || 0))}
        </p>
      </div>
    </div>
  );
};

export default SummaryStats; 