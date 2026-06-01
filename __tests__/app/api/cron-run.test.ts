/**
 * Tests for app/api/cron/run/route.ts
 */

jest.mock('@/lib/scheduler', () => ({
  runDueSchedules: jest.fn(),
  executeSchedule: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  getScheduleById: jest.fn(),
}));

import { GET, POST } from '@/app/api/cron/run/route';
import { runDueSchedules, executeSchedule } from '@/lib/scheduler';
import { getScheduleById } from '@/lib/supabase';

describe('/api/cron/run', () => {
  const originalCronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = 'test-cron-secret';
  });

  afterAll(() => {
    if (originalCronSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalCronSecret;
    }
  });

  it('rejects GET requests without the cron secret', async () => {
    const response = await GET(new Request('http://localhost:3000/api/cron/run'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('allows authorized GET requests to run due schedules', async () => {
    const logs = [{ id: 'log-1', status: 'success', products_scraped: 3 }];
    (runDueSchedules as jest.Mock).mockResolvedValue(logs);

    const response = await GET(
      new Request('http://localhost:3000/api/cron/run', {
        headers: {
          authorization: 'Bearer test-cron-secret',
        },
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.logs).toEqual(logs);
    expect(data.count).toBe(1);
    expect(runDueSchedules).toHaveBeenCalledTimes(1);
  });

  it('allows POST requests from the UI to run a specific schedule', async () => {
    const schedule = {
      id: 'schedule-1',
      name: 'Daily scrape',
      url: 'https://example.com',
      store_name: 'Example Store',
      selectors: {},
      cron_expression: '0 9 * * *',
      enabled: true,
    };
    const log = {
      id: 'log-2',
      schedule_id: 'schedule-1',
      status: 'success',
      products_scraped: 5,
    };

    (getScheduleById as jest.Mock).mockResolvedValue(schedule);
    (executeSchedule as jest.Mock).mockResolvedValue(log);

    const response = await POST(
      new Request('http://localhost:3000/api/cron/run?id=schedule-1', {
        method: 'POST',
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(getScheduleById).toHaveBeenCalledWith('schedule-1');
    expect(executeSchedule).toHaveBeenCalledWith(schedule);
    expect(data.logs).toEqual([log]);
  });
});
