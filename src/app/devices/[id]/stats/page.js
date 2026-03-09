import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getUserById, getDeviceById, getDeviceStats } from '@/lib/db';
import AppShell from '@/components/AppShell';
import StatsClient from './StatsClient';

export default async function StatsPage({ params }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = getUserById(session.userId);
  if (!user) redirect('/login');

  const device = getDeviceById(params.id);
  if (!device) notFound();

  const canAccess =
    ['admin', 'support'].includes(user.role) || device.userId === user.id;
  if (!canAccess) redirect('/devices');

  const stats = getDeviceStats(params.id, 24);

  return (
    <AppShell user={user}>
      <StatsClient device={device} initialStats={stats} />
    </AppShell>
  );
}
