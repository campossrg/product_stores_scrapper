-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT '$',
  unit TEXT DEFAULT 'unit',
  image_url TEXT,
  source_url TEXT,
  store_name TEXT NOT NULL DEFAULT 'Unknown',
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, store_name)
);

-- Create price_history table
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT '$',
  in_stock BOOLEAN DEFAULT true,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_scraped_at ON price_history(scraped_at);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated and anon users (personal use)
-- You may want to restrict this in production
CREATE POLICY "Allow all operations on products" ON products
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on price_history" ON price_history
  FOR ALL USING (true) WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create scrape_schedules table for automated scraping
CREATE TABLE IF NOT EXISTS scrape_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  store_name TEXT NOT NULL,
  selectors JSONB NOT NULL DEFAULT '{}',
  cron_expression TEXT NOT NULL DEFAULT '0 9 * * *',
  enabled BOOLEAN DEFAULT true,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create run_logs table to track execution history
CREATE TABLE IF NOT EXISTS run_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES scrape_schedules(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  products_scraped INTEGER DEFAULT 0,
  error_message TEXT,
  ran_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE scrape_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE run_logs ENABLE ROW LEVEL SECURITY;

-- Policies for personal use
CREATE POLICY "Allow all operations on scrape_schedules" ON scrape_schedules
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on run_logs" ON run_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Indexes for schedule queries
CREATE INDEX IF NOT EXISTS idx_schedules_enabled ON scrape_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_schedules_next_run ON scrape_schedules(next_run);
CREATE INDEX IF NOT EXISTS idx_run_logs_schedule ON run_logs(schedule_id);
CREATE INDEX IF NOT EXISTS idx_run_logs_ran_at ON run_logs(ran_at);

-- Trigger for scrape_schedules updated_at
DROP TRIGGER IF EXISTS update_schedules_updated_at ON scrape_schedules;
CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON scrape_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
