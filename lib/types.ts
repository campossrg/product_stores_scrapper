export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  unit: string;
  image_url: string | null;
  source_url: string;
  store_name: string;
  in_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface PriceHistory {
  id: string;
  product_id: string;
  price: number;
  currency: string;
  in_stock: boolean;
  scraped_at: string;
}

export interface ProductWithHistory extends Product {
  price_history: PriceHistory[];
  price_change: number | null;
  price_change_percent: number | null;
}

export interface ScrapedProduct {
  name: string;
  category: string;
  price: number;
  currency: string;
  unit: string;
  image_url: string | null;
  source_url: string;
  store_name: string;
  in_stock: boolean;
}

export interface ScraperSelectors {
  productContainer: string;
  name: string;
  price: string;
  image: string;
  link: string;
  category?: string;
  inStock?: string;
}

export interface ScraperConfig {
  url: string;
  storeName: string;
  selectors?: Partial<ScraperSelectors>;
  categoryMap?: Record<string, string>;
}

export interface ScrapeSchedule {
  id: string;
  name: string;
  url: string;
  store_name: string;
  selectors: Partial<ScraperSelectors>;
  cron_expression: string;
  enabled: boolean;
  last_run: string | null;
  next_run: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScrapeRunLog {
  id: string;
  schedule_id: string | null;
  status: 'success' | 'error';
  products_scraped: number;
  error_message: string | null;
  ran_at: string;
}
