import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getUserById, getDevicesByUserId, getAllDevices, getAllUsers } from '@/lib/db';
import AppShell from '@/components/AppShell';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = getUserById(session.userId);
  if (!user) redirect('/login');

  const isPrivileged = ['admin', 'support'].includes(user.role);
  const devices = isPrivileged ? getAllDevices() : getDevicesByUserId(user.id);
  const users = isPrivileged ? getAllUsers() : [];

  const stats = {
    totalDevices: devices.length,
    onlineDevices: devices.filter((d) => d.status === 'online').length,
    offlineDevices: devices.filter((d) => d.status === 'offline').length,
    totalUsers: users.length,
  };

  return (
    <AppShell user={user}>
      <DashboardClient user={user} devices={devices} stats={stats} />
    </AppShell>
  );
}
