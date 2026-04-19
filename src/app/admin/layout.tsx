import { redirect } from 'next/navigation';
import { checkAdmin } from '@/lib/checkAdmin';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    redirect('/');
  }
  return <>{children}</>;
}
