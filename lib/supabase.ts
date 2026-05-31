import { createClient } from '@supabase/supabase-js';
import { Product, PriceHistory, ProductWithHistory, ScrapedProduct, ScrapeSchedule, ScrapeRunLog } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey)
  : supabase;

export async function upsertProduct(product: ScrapedProduct): Promise<Product | null> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .upsert(
      {
        name: product.name,
        store_name: product.store_name,
        category: product.category,
        price: product.price,
        currency: product.currency,
        unit: product.unit,
        image_url: product.image_url,
        source_url: product.source_url,
        in_stock: product.in_stock,
      },
      { onConflict: 'name,store_name' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error upserting product:', error);
    return null;
  }

  return data as Product;
}

export async function insertPriceHistory(productId: string, price: number, currency: string, inStock: boolean): Promise<void> {
  const { error } = await supabaseAdmin
    .from('price_history')
    .insert({
      product_id: productId,
      price,
      currency,
      in_stock: inStock,
    });

  if (error) {
    console.error('Error inserting price history:', error);
  }
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return (data as Product[]) || [];
}

export async function getProductHistory(productId: string): Promise<PriceHistory[]> {
  const { data, error } = await supabase
    .from('price_history')
    .select('*')
    .eq('product_id', productId)
    .order('scraped_at', { ascending: true });

  if (error) {
    console.error('Error fetching price history:', error);
    return [];
  }

  return (data as PriceHistory[]) || [];
}

export async function getSchedules(): Promise<ScrapeSchedule[]> {
  const { data, error } = await supabaseAdmin
    .from('scrape_schedules')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching schedules:', error);
    return [];
  }

  return (data as ScrapeSchedule[]) || [];
}

export async function getScheduleById(id: string): Promise<ScrapeSchedule | null> {
  const { data, error } = await supabaseAdmin
    .from('scrape_schedules')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching schedule:', error);
    return null;
  }

  return data as ScrapeSchedule;
}

export async function createSchedule(schedule: Omit<ScrapeSchedule, 'id' | 'created_at' | 'updated_at' | 'last_run' | 'next_run'> & { next_run?: string }): Promise<ScrapeSchedule | null> {
  const { data, error } = await supabaseAdmin
    .from('scrape_schedules')
    .insert(schedule)
    .select()
    .single();

  if (error) {
    console.error('Error creating schedule:', error);
    return null;
  }

  return data as ScrapeSchedule;
}

export async function updateSchedule(id: string, updates: Partial<ScrapeSchedule>): Promise<ScrapeSchedule | null> {
  const { data, error } = await supabaseAdmin
    .from('scrape_schedules')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating schedule:', error);
    return null;
  }

  return data as ScrapeSchedule;
}

export async function deleteSchedule(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('scrape_schedules')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting schedule:', error);
    return false;
  }

  return true;
}

export async function getRunLogs(scheduleId?: string, limit: number = 20): Promise<ScrapeRunLog[]> {
  let query = supabaseAdmin
    .from('run_logs')
    .select('*')
    .order('ran_at', { ascending: false })
    .limit(limit);

  if (scheduleId) {
    query = query.eq('schedule_id', scheduleId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching run logs:', error);
    return [];
  }

  return (data as ScrapeRunLog[]) || [];
}

export async function getProductsWithHistory(): Promise<ProductWithHistory[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      price_history:price_history(*)
    `)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching products with history:', error);
    return [];
  }

  const products = (data as any[]) || [];
  
  return products.map(p => {
    const history = p.price_history || [];
    const latest = history[history.length - 1];
    const previous = history.length > 1 ? history[history.length - 2] : null;
    
    let priceChange = null;
    let priceChangePercent = null;
    
    if (latest && previous) {
      priceChange = latest.price - previous.price;
      priceChangePercent = previous.price > 0 ? ((latest.price - previous.price) / previous.price) * 100 : 0;
    }

    return {
      ...p,
      price_history: history,
      price_change: priceChange,
      price_change_percent: priceChangePercent,
    };
  });
}
