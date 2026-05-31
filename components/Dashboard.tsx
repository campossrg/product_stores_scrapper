'use client';

import { useState, useCallback } from 'react';
import { ScraperControl } from './ScraperControl';
import { ProductTable } from './ProductTable';
import { PriceChart } from './PriceChart';
import { ScheduleManager } from './ScheduleManager';
import { ProductWithHistory } from '@/lib/types';

interface DashboardProps {
  initialProducts: ProductWithHistory[];
}

export function Dashboard({ initialProducts }: DashboardProps) {
  const [products, setProducts] = useState<ProductWithHistory[]>(initialProducts);
  const [activeTab, setActiveTab] = useState<'overview' | 'table' | 'schedules'>('overview');

  const refreshProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Failed to refresh products:', error);
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Price Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Track vegetable prices and monitor changes over time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-1">
          <ScraperControl onScrapeComplete={refreshProducts} />
        </div>
        <div className="lg:col-span-2">
          <PriceChart products={products} />
        </div>
      </div>

      <div className="mb-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Product Overview
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'table'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Full Table
            </button>
            <button
              onClick={() => setActiveTab('schedules')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'schedules'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Schedules
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'schedules' ? (
        <ScheduleManager />
      ) : (
        <ProductTable products={products} />
      )}
    </div>
  );
}
