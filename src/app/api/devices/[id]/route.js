import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDeviceById, deleteDevice } from '@/lib/db';

function canAccessDevice(session, device) {
  if (['admin', 'support'].includes(session.role)) return true;
  return device.userId === session.userId;
}

export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const device = getDeviceById(params.id);
  if (!device) return NextResponse.json({ error: 'Device not found' }, { status: 404 });

  if (!canAccessDevice(session, device)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ device });
}

export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const device = getDeviceById(params.id);
  if (!device) return NextResponse.json({ error: 'Device not found' }, { status: 404 });

  if (!canAccessDevice(session, device)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  deleteDevice(params.id);
  return NextResponse.json({ message: 'Device deleted' });
}
