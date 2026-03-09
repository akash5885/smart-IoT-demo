import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDeviceById, updateDeviceSettings, updateDeviceStatus } from '@/lib/db';

export async function POST(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const device = getDeviceById(params.id);
  if (!device) return NextResponse.json({ error: 'Device not found' }, { status: 404 });

  const isOwner = device.userId === session.userId;
  const isPrivileged = ['admin', 'support'].includes(session.role);
  if (!isOwner && !isPrivileged) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { action, settings, status } = await request.json();

    if (status !== undefined) {
      updateDeviceStatus(params.id, status);
    }

    if (settings) {
      updateDeviceSettings(params.id, settings);
    }

    const updated = getDeviceById(params.id);
    return NextResponse.json({
      device: updated,
      message: `Action '${action || 'update'}' applied successfully`,
    });
  } catch (err) {
    console.error('Control error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
