/**
 * Tests for app/api/schedule/route.ts
 * 
 * Functionality covered:
 * - GET /api/schedule returns all schedules
 * - POST /api/schedule creates a new schedule with computed next_run
 * - POST /api/schedule rejects missing required fields
 */

jest.mock('@/lib/supabase', () => {
  return {
    getSchedules: jest.fn(),
    createSchedule: jest.fn(),
  };
});

jest.mock('@/lib/scheduler', () => {
  return {
    computeNextRun: jest.fn().mockReturnValue(new Date('2024-06-01T09:00:00Z')),
  };
});

import { GET, POST } from '@/app/api/schedule/route';
import { getSchedules, createSchedule } from '@/lib/supabase';

describe('/api/schedule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('returns schedules from database', async () => {
      const mockSchedules = [
        { id: '1', name: 'Daily', url: 'https://example.com', store_name: 'Ex', selectors: {}, cron_expression: '0 9 * * *', enabled: true },
      ];
      (getSchedules as jest.Mock).mockResolvedValue(mockSchedules);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.schedules).toEqual(mockSchedules);
    });

    it('returns empty array when no schedules exist', async () => {
      (getSchedules as jest.Mock).mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.schedules).toEqual([]);
    });
  });

  describe('POST', () => {
    it('creates a schedule with computed next_run and auto-detected selectors', async () => {
      const newSchedule = {
        id: 'new-1',
        name: 'Test',
        url: 'https://botiga.mascancadell.cat/productes',
        store_name: 'Mas Can Cadell',
        selectors: {
          productContainer: '.item.producte',
          name: '.titol-seccio a',
          price: '.preu',
          image: '.imatge_producte img',
          link: '.titol-seccio a',
        },
        cron_expression: '0 9 * * *',
        enabled: true,
        next_run: '2024-06-01T09:00:00Z',
      };
      (createSchedule as jest.Mock).mockResolvedValue(newSchedule);

      const request = new Request('http://localhost:3000/api/schedule', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          url: 'https://botiga.mascancadell.cat/productes',
          store_name: 'Mas Can Cadell',
          cron_expression: '0 9 * * *',
          enabled: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.schedule).toEqual(newSchedule);
      expect(createSchedule).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test',
        url: 'https://botiga.mascancadell.cat/productes',
        next_run: '2024-06-01T09:00:00.000Z',
        selectors: {
          productContainer: '.item.producte',
          name: '.titol-seccio a',
          price: '.preu',
          image: '.imatge_producte img',
          link: '.titol-seccio a',
        },
      }));
    });

    it('returns 400 for missing required fields', async () => {
      const request = new Request('http://localhost:3000/api/schedule', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }), // missing url, store_name, cron_expression
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('returns 500 when database insert fails', async () => {
      (createSchedule as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/schedule', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          url: 'https://botiga.mascancadell.cat/productes',
          store_name: 'Mas Can Cadell',
          cron_expression: '0 9 * * *',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create schedule');
    });
  });
});
