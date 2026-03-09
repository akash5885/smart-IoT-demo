import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getUserById, getAllDevices, getAllUsers } from '@/lib/db';
import AppShell from '@/components/AppShell';
import AdminDevicesClient from './AdminDevicesClient';

export default async function AdminDevicesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = getUserById(session.userId);
  if (!user) redirect('/login');

  if (!['admin', 'support'].includes(user.role)) redirect('/dashboard');

  const devices = getAllDevices();
  const users = getAllUsers();

  return (
    <AppShell user={user}>
      <AdminDevicesClient currentUser={user} devices={devices} users={users} />
    </AppShell>
  );
}
