import { NextResponse } from 'next/server';
import { getUserByEmail, validatePassword } from '@/lib/db';
import { signToken, setTokenCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = getUserByEmail(email);
    if (!user || !validatePassword(user, password)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await signToken({ userId: user.id, role: user.role, name: user.name });

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    setTokenCookie(response, token);
    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
