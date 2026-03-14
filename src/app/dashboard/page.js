import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getUserById, getAllUsers } from '@/lib/db';
import AppShell from '@/components/AppShell';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = getUserById(session.userId);
  if (!user) redirect('/login');

  const isPrivileged = ['admin', 'support'].includes(user.role);
  // User count is stable (admin only) — ok to read server-side
  const users = isPrivileged ? getAllUsers() : [];

  return (
    <AppShell user={user}>
      {/* Devices are fetched client-side so live status is always current */}
      <DashboardClient user={user} totalUsers={users.length} />
    </AppShell>
  );
}
