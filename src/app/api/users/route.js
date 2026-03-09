import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAllUsers, createUser } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'support'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const users = getAllUsers();
  return NextResponse.json({ users });
}

export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can create users' }, { status: 403 });
  }

  try {
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const allowedRoles = ['support', 'user'];
    if (role && !allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Allowed: support, user' }, { status: 400 });
    }

    const user = createUser({ name, email, password, role: role || 'support', createdBy: session.userId });
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err.message === 'Email already in use') {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
