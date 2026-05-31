'use client';

import { useState, useEffect, useCallback } from 'react';
import { ScrapeSchedule, ScrapeRunLog } from '@/lib/types';
import { Play, Pause, Trash2, Plus, Clock, CheckCircle, XCircle, Loader2, Calendar } from 'lucide-react';

const CRON_PRESETS = [
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Daily at 9:00 AM', value: '0 9 * * *' },
  { label: 'Daily at 6:00 PM', value: '0 18 * * *' },
  { label: 'Weekly (Mon 9 AM)', value: '0 9 * * 1' },
  { label: 'Custom', value: '' },
];

export function ScheduleManager() {
  const [schedules, setSchedules] = useState<ScrapeSchedule[]>([]);
  const [logs, setLogs] = useState<ScrapeRunLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    url: 'https://botiga.mascancadell.cat/productes',
    store_name: 'Mas Can Cadell',
    cron_expression: '0 9 * * *',
    enabled: true,
    preset: '0 9 * * *',
  });

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch('/api/schedule');
      const data = await res.json();
      setSchedules(data.schedules || []);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/schedule?logs=1');
      // Logs are fetched from a separate endpoint conceptually,
      // but for simplicity we'll fetch them inline after runs.
      // For now, we'll just keep the latest logs per schedule.
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  }, []);

  useEffect(() => {
    fetchSchedules().finally(() => setLoading(false));
  }, [fetchSchedules]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cron = form.preset === '' ? form.cron_expression : form.preset;

    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          url: form.url,
          store_name: form.store_name,
          cron_expression: cron,
          enabled: form.enabled,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Failed to create schedule');
        return;
      }

      setSchedules((prev) => [data.schedule, ...prev]);
      setShowForm(false);
      setForm({
        name: '',
        url: 'https://botiga.mascancadell.cat/productes',
        store_name: 'Mas Can Cadell',
        cron_expression: '0 9 * * *',
        enabled: true,
        preset: '0 9 * * *',
      });
    } catch (err: any) {
      setFormError(err.message || 'Network error');
    }
  };

  const toggleEnabled = async (schedule: ScrapeSchedule) => {
    try {
      const res = await fetch(`/api/schedule/${schedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !schedule.enabled }),
      });

      if (res.ok) {
        setSchedules((prev) =>
          prev.map((s) =>
            s.id === schedule.id ? { ...s, enabled: !s.enabled } : s
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle schedule:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const res = await fetch(`/api/schedule/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSchedules((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete schedule:', err);
    }
  };

  const handleRunNow = async (id: string) => {
    setRunning(id);
    try {
      const res = await fetch(`/api/cron/run?id=${id}`, { method: 'POST' });
      const data = await res.json();

      if (res.ok && data.logs?.[0]) {
        const log = data.logs[0];
        // Refresh schedules to get updated last_run
        await fetchSchedules();
        alert(
          log.status === 'success'
            ? `Scraped ${log.products_scraped} products successfully!`
            : `Error: ${log.error_message || 'Unknown error'}`
        );
      } else {
        alert('Failed to run schedule');
      }
    } catch (err) {
      console.error('Failed to run schedule:', err);
      alert('Failed to run schedule');
    } finally {
      setRunning(null);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleString();
  };

  const getCronLabel = (expr: string) => {
    const preset = CRON_PRESETS.find((p) => p.value === expr);
    return preset ? preset.label : expr;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Scrape Schedules</h2>
          <p className="text-sm text-gray-500 mt-1">
            Automatically scrape websites on a recurring schedule
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Cancel' : 'New Schedule'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl border border-gray-200 p-6 space-y-4"
        >
          <h3 className="text-lg font-medium text-gray-900">Create New Schedule</h3>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            Selectors are auto-detected for supported stores, so you only need the website URL and store name.
          </div>

          {formError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{formError}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schedule Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Mas Can Cadell Daily"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Name
              </label>
              <input
                type="text"
                required
                value={form.store_name}
                onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                placeholder="e.g. Mas Can Cadell"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website URL
              </label>
              <input
                type="url"
                required
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://botiga.mascancadell.cat/productes"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select
                value={form.preset}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({
                    ...form,
                    preset: val,
                    cron_expression: val,
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {CRON_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {form.preset === '' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Cron Expression
                </label>
                <input
                  type="text"
                  required
                  value={form.cron_expression}
                  onChange={(e) => setForm({ ...form, cron_expression: e.target.value })}
                  placeholder="0 9 * * *"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="enabled" className="text-sm text-gray-700">
              Enable immediately
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create Schedule
            </button>
          </div>
        </form>
      )}

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No schedules yet. Create one to start automatic scraping.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col md:flex-row md:items-center gap-4"
            >
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">{schedule.name}</h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      schedule.enabled
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {schedule.enabled ? (
                      <>
                        <CheckCircle className="w-3 h-3" /> Active
                      </>
                    ) : (
                      <>
                        <Pause className="w-3 h-3" /> Paused
                      </>
                    )}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">{schedule.url}</p>
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {getCronLabel(schedule.cron_expression)}
                  </span>
                  <span>Last run: {formatDate(schedule.last_run)}</span>
                  <span>
                    Next run:{' '}
                    {schedule.enabled ? formatDate(schedule.next_run) : '—'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleRunNow(schedule.id)}
                  disabled={running === schedule.id}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors disabled:opacity-50"
                >
                  {running === schedule.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Run Now
                </button>

                <button
                  onClick={() => toggleEnabled(schedule)}
                  className={`p-2 rounded-lg transition-colors ${
                    schedule.enabled
                      ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                      : 'text-green-600 bg-green-50 hover:bg-green-100'
                  }`}
                  title={schedule.enabled ? 'Pause' : 'Resume'}
                >
                  {schedule.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => handleDelete(schedule.id)}
                  className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
