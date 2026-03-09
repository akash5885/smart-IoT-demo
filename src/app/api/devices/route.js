import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAllDevices, getDevicesByUserId, createDevice } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let devices;
  if (['admin', 'support'].includes(session.role)) {
    devices = getAllDevices();
  } else {
    devices = getDevicesByUserId(session.userId);
  }

  return NextResponse.json({ devices });
}

export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, type, location, settings } = await request.json();

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    const device = createDevice({
      name,
      type,
      userId: session.userId,
      location,
      settings,
    });

    return NextResponse.json({ device }, { status: 201 });
  } catch (err) {
    console.error('Create device error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
