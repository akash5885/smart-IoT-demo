import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getUserById } from '@/lib/db';
import AppShell from '@/components/AppShell';
import DevicesClient from './DevicesClient';

export default async function DevicesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = getUserById(session.userId);
  if (!user) redirect('/login');

  return (
    <AppShell user={user}>
      {/* Devices fetched client-side so status is always current */}
      <DevicesClient user={user} />
    </AppShell>
  );
}
