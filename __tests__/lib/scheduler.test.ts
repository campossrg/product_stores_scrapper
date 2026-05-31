/**
 * Tests for lib/scheduler.ts
 * 
 * Functionality covered:
 * - computeNextRun(): Computes next execution time from cron expression
 * - computeNextRun(): Falls back to daily 9 AM for invalid expressions
 * - executeSchedule(): Scrapes website, upserts products, logs result
 * - executeSchedule(): Handles errors gracefully and logs them
 * - getDueSchedules(): Returns only enabled schedules past their next_run
 * - runDueSchedules(): Executes all due schedules and returns logs
 */

jest.mock('cron-parser', () => {
  return {
    CronExpressionParser: {
      parse: jest.fn().mockImplementation((expr: string, opts: any) => {
        const baseDate = opts?.currentDate ? new Date(opts.currentDate) : new Date();
        return {
          next: jest.fn().mockReturnValue({
            toDate: jest.fn().mockReturnValue(new Date(baseDate.getTime() + 86400000)),
          }),
        };
      }),
    },
  };
});

jest.mock('@/lib/scraper', () => {
  return {
    scrapeWebsite: jest.fn(),
  };
});

jest.mock('@/lib/supabase', () => {
  const mockFrom = jest.fn();
  return {
    supabaseAdmin: { from: mockFrom },
    upsertProduct: jest.fn(),
    insertPriceHistory: jest.fn(),
    _mockFrom: mockFrom,
  };
});

import { computeNextRun, executeSchedule, getDueSchedules, runDueSchedules } from '@/lib/scheduler';
import { CronExpressionParser } from 'cron-parser';
import { scrapeWebsite } from '@/lib/scraper';
import { supabaseAdmin, upsertProduct, insertPriceHistory } from '@/lib/supabase';

describe('computeNextRun', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a Date 24 hours in the future for valid cron expression', () => {
    const now = new Date('2024-01-15T10:00:00Z');
    const result = computeNextRun('0 9 * * *', now);

    expect(CronExpressionParser.parse).toHaveBeenCalledWith('0 9 * * *', {
      currentDate: now,
    });
    expect(result).toBeInstanceOf(Date);
    expect(result.getTime()).toBe(now.getTime() + 86400000);
  });

  it('falls back to tomorrow 9 AM for invalid cron expression', () => {
    (CronExpressionParser.parse as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Invalid cron');
    });

    const now = new Date('2024-01-15T10:00:00Z');
    const result = computeNextRun('bad-cron', now);

    expect(result).toBeInstanceOf(Date);
    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(0);
    expect(result.getDate()).toBe(16);
  });
});

describe('executeSchedule', () => {
  const mockSchedule = {
    id: 'sched-1',
    name: 'Test Schedule',
    url: 'https://example.com',
    store_name: 'Test Store',
    selectors: {
      productContainer: '.product',
      name: '.name',
      price: '.price',
      image: 'img',
      link: 'a',
    },
    cron_expression: '0 9 * * *',
    enabled: true,
    last_run: null,
    next_run: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockProducts = [
    {
      name: 'Carrots',
      category: 'Vegetables',
      price: 2.5,
      currency: '$',
      unit: 'lb',
      image_url: null,
      source_url: 'https://example.com/carrots',
      store_name: 'Test Store',
      in_stock: true,
    },
  ];

  function setupSupabaseMocks(logData: any = { id: 'log-1', status: 'success', products_scraped: 1, error_message: null, ran_at: '2024-01-15T10:00:00Z' }, logError: any = null) {
    const updateEq = jest.fn().mockResolvedValue({ error: null });
    const updateMock = jest.fn().mockReturnValue({ eq: updateEq });

    const singleMock = jest.fn().mockResolvedValue({ data: logData, error: logError });
    const selectMock = jest.fn().mockReturnValue({ single: singleMock });
    const insertMock = jest.fn().mockReturnValue({ select: selectMock });
    const fromMock = jest.fn().mockReturnValue({ insert: insertMock, update: updateMock });

    (supabaseAdmin.from as jest.Mock).mockImplementation(fromMock);
    return { fromMock, insertMock, updateMock, updateEq };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('scrapes website, upserts products, inserts history, and logs success', async () => {
    (scrapeWebsite as jest.Mock).mockResolvedValue(mockProducts);
    (upsertProduct as jest.Mock).mockResolvedValue({ id: 'prod-1', price: 2.5, currency: '$', in_stock: true });
    setupSupabaseMocks({ id: 'log-1', status: 'success', products_scraped: 1, error_message: null, ran_at: '2024-01-15T10:00:00Z' });

    const log = await executeSchedule(mockSchedule as any);

    expect(scrapeWebsite).toHaveBeenCalledWith({
      url: mockSchedule.url,
      storeName: mockSchedule.store_name,
      selectors: mockSchedule.selectors,
    });
    expect(upsertProduct).toHaveBeenCalledWith(mockProducts[0]);
    expect(insertPriceHistory).toHaveBeenCalledWith('prod-1', 2.5, '$', true);

    expect(supabaseAdmin.from).toHaveBeenCalledWith('run_logs');
    expect(log.status).toBe('success');
    expect(log.products_scraped).toBe(1);
    expect(log.error_message).toBeNull();
  });

  it('logs error when scraping fails', async () => {
    (scrapeWebsite as jest.Mock).mockRejectedValue(new Error('Network timeout'));
    setupSupabaseMocks({ id: 'log-err', status: 'error', products_scraped: 0, error_message: 'Network timeout', ran_at: '2024-01-15T10:00:00Z' });

    const log = await executeSchedule(mockSchedule as any);

    expect(log.status).toBe('error');
    expect(log.error_message).toBe('Network timeout');
    expect(log.products_scraped).toBe(0);
  });

  it('updates schedule last_run and next_run after execution', async () => {
    (scrapeWebsite as jest.Mock).mockResolvedValue(mockProducts);
    (upsertProduct as jest.Mock).mockResolvedValue({ id: 'prod-1', price: 2.5, currency: '$', in_stock: true });
    setupSupabaseMocks();

    await executeSchedule(mockSchedule as any);

    expect(supabaseAdmin.from).toHaveBeenCalledWith('scrape_schedules');
    // The second call to from() should be for updating the schedule
    // (first call is for inserting the log)
  });
});

describe('getDueSchedules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns enabled schedules with next_run <= now', async () => {
    const mockSchedules = [
      { id: 'sched-1', name: 'Daily', enabled: true, next_run: '2024-01-01T00:00:00Z' },
    ];

    const orderMock = jest.fn().mockResolvedValue({ data: mockSchedules, error: null });
    const lteMock = jest.fn().mockReturnValue({ order: orderMock });
    const eqMock = jest.fn().mockReturnValue({ lte: lteMock });
    const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
    (supabaseAdmin.from as jest.Mock).mockReturnValue({ select: selectMock });

    const result = await getDueSchedules();

    expect(supabaseAdmin.from).toHaveBeenCalledWith('scrape_schedules');
    expect(eqMock).toHaveBeenCalledWith('enabled', true);
    expect(lteMock).toHaveBeenCalledWith('next_run', expect.any(String));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('sched-1');
  });

  it('returns empty array on database error', async () => {
    const orderMock = jest.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } });
    const lteMock = jest.fn().mockReturnValue({ order: orderMock });
    const eqMock = jest.fn().mockReturnValue({ lte: lteMock });
    const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
    (supabaseAdmin.from as jest.Mock).mockReturnValue({ select: selectMock });

    const result = await getDueSchedules();
    expect(result).toEqual([]);
  });
});

describe('runDueSchedules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes all due schedules and returns their logs', async () => {
    const dueSchedules = [
      { id: 'sched-1', name: 'Daily', url: 'https://a.com', store_name: 'A', selectors: {}, cron_expression: '0 9 * * *' },
      { id: 'sched-2', name: 'Weekly', url: 'https://b.com', store_name: 'B', selectors: {}, cron_expression: '0 9 * * 1' },
    ];

    // Mock getDueSchedules via supabaseAdmin.from()
    const orderMock = jest.fn().mockResolvedValue({ data: dueSchedules, error: null });
    const lteMock = jest.fn().mockReturnValue({ order: orderMock });
    const eqMock = jest.fn().mockReturnValue({ lte: lteMock });
    const selectMock = jest.fn().mockReturnValue({ eq: eqMock });

    // For executeSchedule, we need multiple from() calls (run_logs insert, schedules update)
    let fromCallCount = 0;
    (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
      fromCallCount++;
      if (fromCallCount === 1) {
        // First call is getDueSchedules
        return { select: selectMock };
      }
      // Subsequent calls are for executeSchedule
      const singleMock = jest.fn().mockResolvedValue({
        data: { id: `log-${fromCallCount}`, status: 'success', products_scraped: 1 },
        error: null,
      });
      const selectInsertMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectInsertMock });
      const updateEq = jest.fn().mockResolvedValue({ error: null });
      const updateMock = jest.fn().mockReturnValue({ eq: updateEq });
      return { insert: insertMock, update: updateMock };
    });

    (scrapeWebsite as jest.Mock).mockResolvedValue([
      { name: 'Item', category: 'General', price: 1, currency: '$', unit: 'unit', image_url: null, source_url: 'https://a.com', store_name: 'A', in_stock: true },
    ]);
    (upsertProduct as jest.Mock).mockResolvedValue({ id: 'prod-1', price: 1, currency: '$', in_stock: true });

    const logs = await runDueSchedules();

    expect(logs).toHaveLength(2);
    expect(scrapeWebsite).toHaveBeenCalledTimes(2);
  });
});
