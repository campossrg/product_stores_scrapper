import { NextResponse } from 'next/server';
import { getScheduleById, updateSchedule, deleteSchedule } from '@/lib/supabase';
import { computeNextRun } from '@/lib/scheduler';
import { resolveScraperSelectors } from '@/lib/scraper-selectors';
import { requireAdminApi } from '@/lib/auth-guard';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const schedule = await getScheduleById(params.id);

  if (!schedule) {
    return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
  }

  return NextResponse.json({ schedule });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const updates: any = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.url !== undefined) updates.url = body.url;
    if (body.store_name !== undefined) updates.store_name = body.store_name;
    if (body.enabled !== undefined) updates.enabled = body.enabled;
    if (body.cron_expression !== undefined) {
      updates.cron_expression = body.cron_expression;
      updates.next_run = computeNextRun(body.cron_expression).toISOString();
    }

    if (body.url !== undefined || body.selectors !== undefined) {
      const currentSchedule = await getScheduleById(params.id);

      if (!currentSchedule) {
        return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
      }

      updates.selectors = resolveScraperSelectors(
        body.url ?? currentSchedule.url,
        body.selectors ?? currentSchedule.selectors
      );
    }

    const schedule = await updateSchedule(params.id, updates);

    if (!schedule) {
      return NextResponse.json(
        { error: 'Failed to update schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json({ schedule });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Invalid request' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const success = await deleteSchedule(params.id);

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to delete schedule' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
