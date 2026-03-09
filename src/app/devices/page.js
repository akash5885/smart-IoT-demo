import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getUserById, getDevicesByUserId, getAllDevices } from '@/lib/db';
import AppShell from '@/components/AppShell';
import DevicesClient from './DevicesClient';

export default async function DevicesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = getUserById(session.userId);
  if (!user) redirect('/login');

  const isPrivileged = ['admin', 'support'].includes(user.role);
  const devices = isPrivileged ? getAllDevices() : getDevicesByUserId(user.id);

  return (
    <AppShell user={user}>
      <DevicesClient user={user} initialDevices={devices} />
    </AppShell>
  );
}
