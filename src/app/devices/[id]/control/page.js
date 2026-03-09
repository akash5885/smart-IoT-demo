import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getUserById, getDeviceById } from '@/lib/db';
import AppShell from '@/components/AppShell';
import ControlClient from './ControlClient';

export default async function ControlPage({ params }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = getUserById(session.userId);
  if (!user) redirect('/login');

  const device = getDeviceById(params.id);
  if (!device) notFound();

  const canAccess =
    ['admin', 'support'].includes(user.role) || device.userId === user.id;
  if (!canAccess) redirect('/devices');

  return (
    <AppShell user={user}>
      <ControlClient device={device} user={user} />
    </AppShell>
  );
}
