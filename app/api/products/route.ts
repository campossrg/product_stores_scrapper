import { NextResponse } from 'next/server';
import { getProductsWithHistory } from '@/lib/supabase';

export async function GET() {
  try {
    const products = await getProductsWithHistory();
    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
