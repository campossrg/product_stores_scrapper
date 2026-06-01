import { NextResponse } from 'next/server';
import { scrapeWebsite, scrapeDemo } from '@/lib/scraper';
import { upsertProduct, insertPriceHistory } from '@/lib/supabase';
import { ScraperConfig } from '@/lib/types';
import { requireAdminApi } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const { useDemo, config } = body;

    let products;

    if (useDemo) {
      products = await scrapeDemo();
    } else if (config) {
      const scraperConfig: ScraperConfig = {
        ...config,
        selectors: config.selectors,
      };
      products = await scrapeWebsite(scraperConfig);
    } else {
      return NextResponse.json(
        { error: 'Either useDemo must be true or a config must be provided' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const product of products) {
      try {
        const upserted = await upsertProduct(product);
        if (upserted) {
          await insertPriceHistory(
            upserted.id,
            product.price,
            product.currency,
            product.in_stock
          );
          results.push({ name: product.name, status: 'success' });
        } else {
          errors.push({ name: product.name, error: 'Failed to upsert' });
        }
      } catch (err: any) {
        errors.push({ name: product.name, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      scraped: products.length,
      saved: results.length,
      errors: errors.length > 0 ? errors : undefined,
      products: products.map(p => ({
        name: p.name,
        price: p.price,
        category: p.category,
      })),
    });
  } catch (error: any) {
    console.error('Scrape API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
