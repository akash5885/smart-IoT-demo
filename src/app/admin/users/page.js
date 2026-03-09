import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getUserById, getAllUsers } from '@/lib/db';
import AppShell from '@/components/AppShell';
import UsersClient from './UsersClient';

export default async function UsersPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = getUserById(session.userId);
  if (!user) redirect('/login');

  if (user.role !== 'admin') redirect('/dashboard');

  const users = getAllUsers();

  return (
    <AppShell user={user}>
      <UsersClient currentUser={user} initialUsers={users} />
    </AppShell>
  );
}
