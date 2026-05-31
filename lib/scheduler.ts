import { CronExpressionParser } from 'cron-parser';
import { scrapeWebsite } from './scraper';
import { upsertProduct, insertPriceHistory, supabaseAdmin } from './supabase';
import { ScrapeSchedule, ScrapeRunLog, ScrapedProduct } from './types';

/**
 * Compute the next run time from a cron expression, starting from now.
 */
export function computeNextRun(cronExpression: string, fromDate: Date = new Date()): Date {
  try {
    const interval = CronExpressionParser.parse(cronExpression, {
      currentDate: fromDate,
    });
    return interval.next().toDate();
  } catch {
    // Fallback: daily at 9 AM if expression is invalid
    const tomorrow = new Date(fromDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  }
}

/**
 * Execute a single scraping schedule.
 * Scrapes the website, upserts products, inserts price history, and logs the result.
 */
export async function executeSchedule(schedule: ScrapeSchedule): Promise<ScrapeRunLog> {
  const startTime = new Date();
  let products: ScrapedProduct[] = [];
  let errorMessage: string | null = null;

  try {
    products = await scrapeWebsite({
      url: schedule.url,
      storeName: schedule.store_name,
      selectors: schedule.selectors,
    });

    for (const product of products) {
      const saved = await upsertProduct(product);
      if (saved) {
        await insertPriceHistory(saved.id, saved.price, saved.currency, saved.in_stock);
      }
    }
  } catch (err: any) {
    errorMessage = err?.message || String(err);
  }

  const log: Omit<ScrapeRunLog, 'id'> = {
    schedule_id: schedule.id,
    status: errorMessage ? 'error' : 'success',
    products_scraped: products.length,
    error_message: errorMessage,
    ran_at: startTime.toISOString(),
  };

  // Insert log into database
  const { data, error } = await supabaseAdmin
    .from('run_logs')
    .insert(log)
    .select()
    .single();

  if (error) {
    console.error('Error inserting run log:', error);
  }

  // Update schedule's last_run and next_run
  const nextRun = computeNextRun(schedule.cron_expression, startTime);
  await supabaseAdmin
    .from('scrape_schedules')
    .update({ last_run: startTime.toISOString(), next_run: nextRun.toISOString() })
    .eq('id', schedule.id);

  return data as ScrapeRunLog || { ...log, id: 'local' };
}

/**
 * Find all enabled schedules that are due (next_run <= now).
 */
export async function getDueSchedules(): Promise<ScrapeSchedule[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('scrape_schedules')
    .select('*')
    .eq('enabled', true)
    .lte('next_run', now)
    .order('next_run', { ascending: true });

  if (error) {
    console.error('Error fetching due schedules:', error);
    return [];
  }

  return (data as ScrapeSchedule[]) || [];
}

/**
 * Run all schedules that are currently due.
 * Returns the run logs for each executed schedule.
 */
export async function runDueSchedules(): Promise<ScrapeRunLog[]> {
  const due = await getDueSchedules();
  const logs: ScrapeRunLog[] = [];

  for (const schedule of due) {
    const log = await executeSchedule(schedule);
    logs.push(log);
  }

  return logs;
}
