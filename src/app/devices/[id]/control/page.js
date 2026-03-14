import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getUserById } from '@/lib/db';
import AppShell from '@/components/AppShell';
import ControlClient from './ControlClient';

export default async function ControlPage({ params }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = getUserById(session.userId);
  if (!user) redirect('/login');

  // Device lookup is done client-side to avoid serverless in-memory isolation issues
  return (
    <AppShell user={user}>
      <ControlClient deviceId={params.id} user={user} />
    </AppShell>
  );
}
