import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { checkAdmin } from '@/lib/checkAdmin';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    redirect('/');
  }
  return <>{children}</>;
}
