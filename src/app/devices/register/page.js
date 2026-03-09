import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getUserById } from '@/lib/db';
import AppShell from '@/components/AppShell';
import RegisterDeviceClient from './RegisterDeviceClient';

export default async function RegisterDevicePage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = getUserById(session.userId);
  if (!user) redirect('/login');

  if (user.role === 'support') redirect('/devices');

  return (
    <AppShell user={user}>
      <RegisterDeviceClient />
    </AppShell>
  );
}
