import { NextResponse } from 'next/server';
import { deleteProduct } from '@/lib/supabase';
import { requireAdminApi } from '@/lib/auth-guard';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Product id is required' }, { status: 400 });
  }

  try {
    const deleted = await deleteProduct(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete product API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
