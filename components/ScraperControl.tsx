'use client';

import { useState } from 'react';
import { RefreshCw, Play, Settings2 } from 'lucide-react';

export function ScraperControl() {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [config, setConfig] = useState({
    url: '',
    storeName: '',
    productContainer: '',
    nameSelector: '',
    priceSelector: '',
    imageSelector: '',
    linkSelector: '',
  });

  const handleScrape = async (useDemo: boolean) => {
    setIsLoading(true);
    setResult(null);

    try {
      const body: any = { useDemo };
      
      if (!useDemo) {
        const hasManualSelectors = [
          config.productContainer,
          config.nameSelector,
          config.priceSelector,
          config.imageSelector,
          config.linkSelector,
        ].some(Boolean);

        body.config = {
          url: config.url,
          storeName: config.storeName,
          ...(hasManualSelectors
            ? {
                selectors: {
                  productContainer: config.productContainer,
                  name: config.nameSelector,
                  price: config.priceSelector,
                  image: config.imageSelector,
                  link: config.linkSelector,
                },
              }
            : {}),
        };
      }

      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to scrape. Check console for details.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Scraper Control</h2>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600"
        >
          <Settings2 className="h-4 w-4" />
          {showConfig ? 'Hide Config' : 'Custom Website'}
        </button>
      </div>

      {showConfig && (
        <div className="mb-6 p-4 bg-gray-50 rounded-md space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
            <input
              type="url"
              value={config.url}
              onChange={(e) => setConfig({ ...config, url: e.target.value })}
              placeholder="https://example.com/vegetables"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
            <input
              type="text"
              value={config.storeName}
              onChange={(e) => setConfig({ ...config, storeName: e.target.value })}
              placeholder="My Local Store"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            The app will try to detect product, name, price, image, and link selectors automatically.
            Use advanced selectors only if auto-detection is not supported for that store.
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-gray-600 hover:text-primary-600"
          >
            {showAdvanced ? 'Hide advanced selectors' : 'Advanced: enter selectors manually'}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Container</label>
                <input
                  type="text"
                  value={config.productContainer}
                  onChange={(e) => setConfig({ ...config, productContainer: e.target.value })}
                  placeholder=".product-item"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name Selector</label>
                <input
                  type="text"
                  value={config.nameSelector}
                  onChange={(e) => setConfig({ ...config, nameSelector: e.target.value })}
                  placeholder=".product-title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Selector</label>
                <input
                  type="text"
                  value={config.priceSelector}
                  onChange={(e) => setConfig({ ...config, priceSelector: e.target.value })}
                  placeholder=".price"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image Selector</label>
                <input
                  type="text"
                  value={config.imageSelector}
                  onChange={(e) => setConfig({ ...config, imageSelector: e.target.value })}
                  placeholder="img"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Link Selector</label>
                <input
                  type="text"
                  value={config.linkSelector}
                  onChange={(e) => setConfig({ ...config, linkSelector: e.target.value })}
                  placeholder="a"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}

          <button
            onClick={() => handleScrape(false)}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Scrape Website
          </button>
        </div>
      )}

      {!showConfig && (
        <button
          onClick={() => handleScrape(true)}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="h-4 w-4" />
          Run Demo Scrape
        </button>
      )}

      {result && (
        <div className={`mt-4 p-3 rounded-md ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {result.success ? (
            <div>
              <p className="font-medium">Scraping completed successfully!</p>
              <p className="text-sm mt-1">
                Scraped {result.scraped} products, saved {result.saved} to database.
              </p>
              {result.errors && result.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="text-sm cursor-pointer">{result.errors.length} errors</summary>
                  <ul className="mt-1 text-xs space-y-1">
                    {result.errors.map((err: any, i: number) => (
                      <li key={i}>{err.name}: {err.error}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ) : (
            <p>{result.error || 'An error occurred'}</p>
          )}
        </div>
      )}
    </div>
  );
}
