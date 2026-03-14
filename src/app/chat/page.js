import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getUserById } from '@/lib/db';
import AppShell from '@/components/AppShell';
import ChatClient from './ChatClient';

export default async function ChatPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = getUserById(session.userId);
  if (!user) redirect('/login');

  return (
    <AppShell user={user}>
      <ChatClient user={user} />
    </AppShell>
  );
}
