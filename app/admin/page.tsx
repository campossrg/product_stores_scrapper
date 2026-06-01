import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { ScraperControl } from '@/components/ScraperControl';
import { ScheduleManager } from '@/components/ScheduleManager';
import { AdminProductManager } from '@/components/AdminProductManager';
import { isAllowedAdminEmail } from '@/lib/admin-access';

export default async function AdminPage() {
  const session = await auth();

  if (!isAllowedAdminEmail(session?.user?.email)) {
    redirect('/login?callbackUrl=/admin');
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin controls</h1>
        <p className="mt-2 text-gray-600">
          Manage manual scraping and recurring schedules without exposing these controls publicly.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <ScraperControl onScrapeComplete={() => undefined} />
        </div>
        <div className="xl:col-span-2">
          <ScheduleManager />
        </div>
      </div>

      <div className="mt-8">
        <AdminProductManager />
      </div>
    </div>
  );
}
