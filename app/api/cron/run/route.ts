import { NextResponse } from 'next/server';
import { runDueSchedules, executeSchedule } from '@/lib/scheduler';
import { getScheduleById } from '@/lib/supabase';

/**
 * POST /api/cron/run
 * Trigger scraping for all due schedules, or a specific schedule if ?id= provided.
 * Can be called manually, by Vercel Cron, or by any external cron service.
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('id');

    // If a specific schedule ID is provided, run just that one
    if (scheduleId) {
      const schedule = await getScheduleById(scheduleId);
      if (!schedule) {
        return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
      }
      const log = await executeSchedule(schedule);
      return NextResponse.json({ logs: [log] });
    }

    // Otherwise, run all schedules that are due
    const logs = await runDueSchedules();
    return NextResponse.json({ logs, count: logs.length });
  } catch (error: any) {
    console.error('Cron run error:', error);
    return NextResponse.json(
      { error: error.message || 'Cron execution failed' },
      { status: 500 }
    );
  }
}
