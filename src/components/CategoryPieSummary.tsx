import React from "react";

interface TopCategory {
  category: string;
  amount: number;
  percent: number;
  color: string;
}

interface CategoryPieSummaryProps {
  top3: TopCategory[];
}

const CategoryPieSummary: React.FC<CategoryPieSummaryProps> = ({ top3 }) => {
  return (
    <div className="flex flex-col gap-3 p-2">
      <h4 className="text-lg font-bold text-gray-800 mb-2">Top 3 Categories:</h4>
      {top3.map((cat, i) => (
        <div key={cat.category} className="flex items-center gap-2">
          <span
            className="inline-block w-4 h-4 rounded mr-2"
            style={{ backgroundColor: cat.color }}
          ></span>
          <div className="flex flex-col">
            <span className="font-medium text-gray-700">
              {cat.category} <span className="text-xs text-gray-500">({cat.percent}%)</span>
            </span>
            <span className="text-xs text-gray-500">
              KES {cat.amount.toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategoryPieSummary; 