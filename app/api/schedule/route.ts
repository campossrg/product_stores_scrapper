import { NextResponse } from 'next/server';
import { getSchedules, createSchedule } from '@/lib/supabase';
import { computeNextRun } from '@/lib/scheduler';
import { resolveScraperSelectors } from '@/lib/scraper-selectors';
import { requireAdminApi } from '@/lib/auth-guard';

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const schedules = await getSchedules();
  return NextResponse.json({ schedules });
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const { name, url, store_name, selectors, cron_expression, enabled } = body;

    if (!name || !url || !store_name || !cron_expression) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const resolvedSelectors = resolveScraperSelectors(url, selectors);
    const nextRun = computeNextRun(cron_expression).toISOString();

    const schedule = await createSchedule({
      name,
      url,
      store_name,
      selectors: resolvedSelectors,
      cron_expression,
      enabled: enabled ?? true,
      next_run: nextRun,
    });

    if (!schedule) {
      return NextResponse.json(
        { error: 'Failed to create schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Invalid request' },
      { status: 400 }
    );
  }
}
