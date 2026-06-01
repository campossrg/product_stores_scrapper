import { NextResponse } from 'next/server';
import { runDueSchedules, executeSchedule } from '@/lib/scheduler';
import { getScheduleById } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorizedCronRequest(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return true;
  }

  return request.headers.get('authorization') === `Bearer ${cronSecret}`;
}

async function handleCronRun(request: Request) {
  const { searchParams } = new URL(request.url);
  const scheduleId = searchParams.get('id');

  if (scheduleId) {
    const schedule = await getScheduleById(scheduleId);
    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    const log = await executeSchedule(schedule);
    return NextResponse.json({ logs: [log] });
  }

  const logs = await runDueSchedules();
  return NextResponse.json({ logs, count: logs.length });
}

/**
 * GET /api/cron/run
 * Trigger scraping for all due schedules, or a specific schedule if ?id= provided.
 * Intended for Vercel Cron or other server-to-server cron integrations.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    return await handleCronRun(request);
  } catch (error: any) {
    console.error('Cron run error:', error);
    return NextResponse.json(
      { error: error.message || 'Cron execution failed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/run
 * Supports manual runs from the UI without exposing CRON_SECRET in the browser.
 */
export async function POST(request: Request) {
  try {
    return await handleCronRun(request);
  } catch (error: any) {
    console.error('Cron run error:', error);
    return NextResponse.json(
      { error: error.message || 'Cron execution failed' },
      { status: 500 }
    );
  }
}
