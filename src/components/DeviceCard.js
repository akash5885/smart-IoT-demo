'use client';

import Link from 'next/link';
import {
  Thermometer,
  Lightbulb,
  Thermometer as ThermoIcon,
  Camera,
  Zap,
  Droplets,
  Plug,
  Cpu,
  BarChart2,
  Settings2,
  Trash2,
} from 'lucide-react';

const DEVICE_ICONS = {
  temperature_sensor: Thermometer,
  smart_light: Lightbulb,
  thermostat: ThermoIcon,
  security_camera: Camera,
  energy_meter: Zap,
  humidity_sensor: Droplets,
  smart_plug: Plug,
};

const DEVICE_COLORS = {
  temperature_sensor: 'text-orange-400 bg-orange-400/10',
  smart_light: 'text-yellow-400 bg-yellow-400/10',
  thermostat: 'text-blue-400 bg-blue-400/10',
  security_camera: 'text-purple-400 bg-purple-400/10',
  energy_meter: 'text-green-400 bg-green-400/10',
  humidity_sensor: 'text-cyan-400 bg-cyan-400/10',
  smart_plug: 'text-red-400 bg-red-400/10',
};

export default function DeviceCard({ device, onDelete }) {
  const Icon = DEVICE_ICONS[device.type] || Cpu;
  const colorClass = DEVICE_COLORS[device.type] || 'text-slate-400 bg-slate-400/10';

  const typeLabel = device.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="card hover:border-slate-600 transition-colors group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className={device.status === 'online' ? 'badge-online' : 'badge-offline'}>
          <span className={`w-1.5 h-1.5 rounded-full ${device.status === 'online' ? 'bg-emerald-400' : 'bg-red-400'}`} />
          {device.status}
        </span>
      </div>

      <h3 className="font-semibold text-white mb-1 truncate">{device.name}</h3>
      <p className="text-xs text-slate-400 mb-1">{typeLabel}</p>
      <p className="text-xs text-slate-500 mb-4">{device.location}</p>

      <div className="flex items-center gap-2">
        <Link
          href={`/devices/${device.id}/stats`}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors flex-1 btn-secondary justify-center py-1.5"
        >
          <BarChart2 className="w-3.5 h-3.5" />
          Stats
        </Link>
        <Link
          href={`/devices/${device.id}/control`}
          className="flex items-center gap-1.5 text-xs flex-1 btn-primary justify-center py-1.5"
        >
          <Settings2 className="w-3.5 h-3.5" />
          Control
        </Link>
        {onDelete && (
          <button
            onClick={() => onDelete(device.id)}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
