import { auth } from '@/auth';

export async function checkAdmin(): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminUserIds = (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean);
  return Boolean(
    (adminEmail && session.user.email === adminEmail) ||
    (adminUserIds.length > 0 && adminUserIds.includes(session.user.id ?? ''))
  );
}
