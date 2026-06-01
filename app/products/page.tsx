import { ProductTable } from '@/components/ProductTable';
import { getProductsWithHistory } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const products = await getProductsWithHistory();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
        <p className="mt-2 text-gray-600">
          Complete list of tracked products with price history
        </p>
      </div>
      <ProductTable products={products} />
    </div>
  );
}
