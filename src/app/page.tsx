"use client";

import React, { useEffect, useState } from "react";
import { loadTransactions, Transaction } from "@/lib/csv-loader";
import InOutBarChart from "@/components/InOutBarChart";
import CategoryPieChart from "@/components/CategoryPieChart";
import MonthlyTrendChart from "@/components/MonthlyTrendChart";
import SummaryStats from "@/components/SummaryStats";
import WeekdayChart from "@/components/WeekdayChart";
import CategoryPieSummary from "@/components/CategoryPieSummary";

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [top3Categories, setTop3Categories] = useState<{
    category: string;
    amount: number;
    percent: number;
    color: string;
  }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await loadTransactions("/cleaned_mpesa_data.csv");
        setTransactions(data);
      } catch (err) {
        setError("Failed to load transaction data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading M-Pesa transaction data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            M-Pesa Spending Analysis
          </h1>
          <p className="text-lg text-gray-600">
            Comprehensive analysis of personal M-Pesa transaction data from June 2024 to June 2025
          </p>
        </div>

        {/* Summary Statistics */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Key Metrics</h2>
          <SummaryStats data={transactions} />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Inflow vs Outflow */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Inflow vs Outflow</h3>
            <InOutBarChart data={transactions} />
          </div>

          {/* Category Breakdown */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Spending by Category</h3>
            <div className="flex flex-row gap-4 items-start">
              <CategoryPieChart data={transactions} onTopCategories={setTop3Categories} />
              <CategoryPieSummary top3={top3Categories} />
            </div>
          </div>
        </div>

        {/* Monthly and Weekday Trends Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Trend */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Monthly Spending Trend</h3>
            <MonthlyTrendChart data={transactions} />
          </div>

          {/* Weekday Analysis */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Spending Patterns by Day of Week</h3>
            <WeekdayChart data={transactions} />
          </div>
        </div>

        {/* Project Overview */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Project Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Key Features</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Monthly spending trend analysis with interactive visualizations</li>
                <li>Category-wise expense breakdown and insights</li>
                <li>Inflow vs Outflow comparison and analysis</li>
                <li>Weekly spending patterns by day of the week</li>
                <li>Data cleaning and preprocessing pipeline</li>
                <li>Interactive dashboard for spending insights</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Implementation Details</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Time Series Analysis with D3.js visualizations</li>
                <li>Comprehensive data processing and aggregation</li>
                <li>Statistical analysis for spending patterns</li>
                <li>Responsive design with Tailwind CSS</li>
                <li>TypeScript for type safety</li>
                <li>Next.js for modern React development</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
