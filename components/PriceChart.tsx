'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ProductWithHistory } from '@/lib/types';

interface PriceChartProps {
  products: ProductWithHistory[];
}

export function PriceChart({ products }: PriceChartProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [timeRange, setTimeRange] = useState('all');

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  // Build chart data from price history
  const allDates = new Set<string>();
  filteredProducts.forEach(p => {
    p.price_history.forEach(h => {
      const date = new Date(h.scraped_at).toLocaleDateString();
      allDates.add(date);
    });
  });

  const sortedDates = Array.from(allDates).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  // Limit dates based on time range
  let displayDates = sortedDates;
  if (timeRange === '7d') displayDates = sortedDates.slice(-7);
  if (timeRange === '30d') displayDates = sortedDates.slice(-30);

  const chartData = displayDates.map(date => {
    const point: any = { date };
    filteredProducts.forEach(p => {
      const historyEntry = p.price_history.find(h => 
        new Date(h.scraped_at).toLocaleDateString() === date
      );
      point[p.name] = historyEntry ? historyEntry.price : null;
    });
    return point;
  });

  // Stats
  const totalProducts = filteredProducts.length;
  const avgPrice = filteredProducts.length > 0
    ? filteredProducts.reduce((sum, p) => sum + p.price, 0) / filteredProducts.length
    : 0;
  const priceChanges = filteredProducts
    .map(p => p.price_change_percent)
    .filter((c): c is number => c !== null);
  const avgChange = priceChanges.length > 0
    ? priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length
    : 0;

  const colors = [
    '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Price Trends</h2>
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Time</option>
            <option value="30d">Last 30 Days</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">Products Tracked</div>
          <div className="text-2xl font-bold text-gray-900">{totalProducts}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">Average Price</div>
          <div className="text-2xl font-bold text-gray-900">${avgPrice.toFixed(2)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">Avg. Price Change</div>
          <div className={`flex items-center gap-1 text-2xl font-bold ${
            avgChange > 0 ? 'text-red-600' : avgChange < 0 ? 'text-green-600' : 'text-gray-900'
          }`}>
            {avgChange > 0 ? <TrendingUp className="h-5 w-5" /> : 
             avgChange < 0 ? <TrendingDown className="h-5 w-5" /> : 
             <Minus className="h-5 w-5" />}
            {Math.abs(avgChange).toFixed(1)}%
          </div>
        </div>
      </div>

      {chartData.length > 0 && filteredProducts.some(p => p.price_history.length > 0) ? (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
              />
              {filteredProducts.slice(0, 10).map((product, index) => (
                <Line
                  key={product.id}
                  type="monotone"
                  dataKey={product.name}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-80 flex items-center justify-center text-gray-400">
          No price history data available. Run a scrape to populate data.
        </div>
      )}
    </div>
  );
}
