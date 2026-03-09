import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDeviceById, getDeviceStats, addDeviceStat } from '@/lib/db';

export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const device = getDeviceById(params.id);
  if (!device) return NextResponse.json({ error: 'Device not found' }, { status: 404 });

  const isOwner = device.userId === session.userId;
  const isPrivileged = ['admin', 'support'].includes(session.role);
  if (!isOwner && !isPrivileged) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '24', 10);

  // Simulate a new live reading
  const liveData = simulateLiveData(device);
  if (liveData) {
    addDeviceStat(params.id, liveData);
  }

  const stats = getDeviceStats(params.id, limit);
  return NextResponse.json({ stats, device });
}

function simulateLiveData(device) {
  switch (device.type) {
    case 'temperature_sensor':
      return {
        temperature: +(18 + Math.random() * 8).toFixed(1),
        humidity: +(40 + Math.random() * 30).toFixed(1),
      };
    case 'smart_light':
      return {
        brightness: device.settings.brightness || 80,
        powerUsage: +(5 + Math.random() * 10).toFixed(2),
        on: device.settings.on !== false,
      };
    case 'thermostat':
      return {
        currentTemp: +(19 + Math.random() * 5).toFixed(1),
        targetTemp: device.settings.targetTemp || 22,
        humidity: +(45 + Math.random() * 20).toFixed(1),
        mode: device.settings.mode || 'auto',
      };
    case 'energy_meter':
      return {
        powerUsage: +(1 + Math.random() * 4).toFixed(2),
        voltage: +(220 + Math.random() * 10).toFixed(1),
        current: +(4 + Math.random() * 3).toFixed(2),
        totalKwh: +(100 + Math.random() * 50).toFixed(2),
      };
    case 'humidity_sensor':
      return {
        humidity: +(40 + Math.random() * 40).toFixed(1),
        temperature: +(18 + Math.random() * 8).toFixed(1),
      };
    default:
      return null;
  }
}
