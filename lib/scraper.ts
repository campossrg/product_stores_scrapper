import * as cheerio from 'cheerio';
import { ScrapedProduct, ScraperConfig } from './types';
import { resolveScraperSelectors } from './scraper-selectors';

export async function scrapeWebsite(config: ScraperConfig): Promise<ScrapedProduct[]> {
  try {
    const selectors = resolveScraperSelectors(config.url, config.selectors);
    const response = await fetch(config.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const products: ScrapedProduct[] = [];

    $(selectors.productContainer).each((_, element) => {
      const el = $(element);
      
      const name = el.find(selectors.name).first().text().trim();
      const priceText = el.find(selectors.price).first().text().trim();
      const image = el.find(selectors.image).first().attr('src') || 
                   el.find(selectors.image).first().attr('data-src') || null;
      const link = el.find(selectors.link).first().attr('href') || config.url;
      const category = selectors.category 
        ? el.find(selectors.category).first().text().trim()
        : 'General';
      const inStock = selectors.inStock 
        ? el.find(selectors.inStock).length > 0
        : true;

      if (!name || !priceText) return;

      const priceMatch = priceText.replace(/,/g, '').match(/[\d.]+/);
      const price = priceMatch ? parseFloat(priceMatch[0]) : 0;
      const currency = priceText.match(/[$€£¥]/)?.[0] || '$';

      const resolvedImage = image && !image.startsWith('http') 
        ? new URL(image, config.url).href 
        : image;

      const resolvedLink = link && !link.startsWith('http')
        ? new URL(link, config.url).href
        : link;

      if (name && price > 0) {
        products.push({
          name,
          category: config.categoryMap?.[category.toLowerCase()] || category || 'Vegetables',
          price,
          currency,
          unit: 'unit',
          image_url: resolvedImage,
          source_url: resolvedLink || config.url,
          store_name: config.storeName,
          in_stock: inStock,
        });
      }
    });

    return products;
  } catch (error) {
    console.error('Scraping error:', error);
    throw error;
  }
}

// Demo scraper that generates sample vegetable data
// Use this when you don't have a specific website configured yet
export async function scrapeDemo(): Promise<ScrapedProduct[]> {
  const demoProducts: ScrapedProduct[] = [
    { name: 'Organic Carrots', category: 'Root Vegetables', price: 2.49, currency: '$', unit: 'bunch', image_url: null, source_url: 'https://example.com/carrots', store_name: 'Demo Store', in_stock: true },
    { name: 'Roma Tomatoes', category: 'Tomatoes', price: 3.99, currency: '$', unit: 'lb', image_url: null, source_url: 'https://example.com/tomatoes', store_name: 'Demo Store', in_stock: true },
    { name: 'Broccoli Crowns', category: 'Cruciferous', price: 1.89, currency: '$', unit: 'lb', image_url: null, source_url: 'https://example.com/broccoli', store_name: 'Demo Store', in_stock: true },
    { name: 'Red Bell Peppers', category: 'Peppers', price: 1.79, currency: '$', unit: 'each', image_url: null, source_url: 'https://example.com/peppers', store_name: 'Demo Store', in_stock: true },
    { name: 'Spinach Bunch', category: 'Leafy Greens', price: 2.29, currency: '$', unit: 'bunch', image_url: null, source_url: 'https://example.com/spinach', store_name: 'Demo Store', in_stock: true },
    { name: 'Yellow Onions', category: 'Alliums', price: 1.49, currency: '$', unit: 'lb', image_url: null, source_url: 'https://example.com/onions', store_name: 'Demo Store', in_stock: true },
    { name: 'Garlic Bulb', category: 'Alliums', price: 0.99, currency: '$', unit: 'each', image_url: null, source_url: 'https://example.com/garlic', store_name: 'Demo Store', in_stock: true },
    { name: 'Zucchini', category: 'Squash', price: 1.69, currency: '$', unit: 'lb', image_url: null, source_url: 'https://example.com/zucchini', store_name: 'Demo Store', in_stock: true },
    { name: 'Cucumber', category: 'Cucurbits', price: 1.29, currency: '$', unit: 'each', image_url: null, source_url: 'https://example.com/cucumber', store_name: 'Demo Store', in_stock: true },
    { name: 'Sweet Potatoes', category: 'Root Vegetables', price: 1.19, currency: '$', unit: 'lb', image_url: null, source_url: 'https://example.com/sweet-potatoes', store_name: 'Demo Store', in_stock: true },
    { name: 'Cauliflower', category: 'Cruciferous', price: 3.49, currency: '$', unit: 'each', image_url: null, source_url: 'https://example.com/cauliflower', store_name: 'Demo Store', in_stock: false },
    { name: 'Asparagus', category: 'Shoots', price: 4.99, currency: '$', unit: 'lb', image_url: null, source_url: 'https://example.com/asparagus', store_name: 'Demo Store', in_stock: true },
  ];

  // Add some random variation to prices to simulate real changes
  return demoProducts.map(p => ({
    ...p,
    price: parseFloat((p.price * (0.9 + Math.random() * 0.2)).toFixed(2)),
  }));
}
