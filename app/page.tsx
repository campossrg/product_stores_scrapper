import { Dashboard } from '@/components/Dashboard';
import { getProductsWithHistory } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const products = await getProductsWithHistory();

  return <Dashboard initialProducts={products} />;
}
