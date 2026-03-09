'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, BarChart2, Settings2, Wifi, WifiOff, Cpu } from 'lucide-react';

const TYPE_LABELS = {
  temperature_sensor: 'Temperature Sensor',
  smart_light: 'Smart Light',
  thermostat: 'Thermostat',
  security_camera: 'Security Camera',
  energy_meter: 'Energy Meter',
  humidity_sensor: 'Humidity Sensor',
  smart_plug: 'Smart Plug',
};

export default function AdminDevicesClient({ currentUser, devices, users }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const filtered = devices.filter((d) => {
    const owner = userMap[d.userId];
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.location.toLowerCase().includes(search.toLowerCase()) ||
      owner?.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;
    const matchType = filterType === 'all' || d.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const types = [...new Set(devices.map((d) => d.type))];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">All Devices</h1>
        <p className="text-slate-400 text-sm mt-1">
          {devices.length} devices across {users.filter((u) => u.role === 'user').length} users
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            className="input-field pl-9"
            placeholder="Search devices or owners..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input-field sm:w-40" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
        <select className="input-field sm:w-52" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          {types.map((t) => (
            <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
          ))}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-400/10 text-blue-400"><Cpu className="w-5 h-5" /></div>
          <div><p className="text-xl font-bold text-white">{devices.length}</p><p className="text-sm text-slate-400">Total</p></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-400/10 text-emerald-400"><Wifi className="w-5 h-5" /></div>
          <div><p className="text-xl font-bold text-white">{devices.filter((d) => d.status === 'online').length}</p><p className="text-sm text-slate-400">Online</p></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-400/10 text-red-400"><WifiOff className="w-5 h-5" /></div>
          <div><p className="text-xl font-bold text-white">{devices.filter((d) => d.status === 'offline').length}</p><p className="text-sm text-slate-400">Offline</p></div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Device</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Type</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Owner</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    No devices match your search
                  </td>
                </tr>
              ) : (
                filtered.map((device) => {
                  const owner = userMap[device.userId];
                  return (
                    <tr key={device.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-white">{device.name}</p>
                        <p className="text-xs text-slate-400">{device.location}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-400">
                        {TYPE_LABELS[device.type] || device.type}
                      </td>
                      <td className="px-5 py-4">
                        {owner ? (
                          <div>
                            <p className="text-sm text-white">{owner.name}</p>
                            <p className="text-xs text-slate-400">{owner.email}</p>
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={device.status === 'online' ? 'badge-online' : 'badge-offline'}>
                          <span className={`w-1.5 h-1.5 rounded-full ${device.status === 'online' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          {device.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/devices/${device.id}/stats`}
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-400 transition-colors"
                          >
                            <BarChart2 className="w-3.5 h-3.5" /> Stats
                          </Link>
                          {currentUser.role === 'admin' && (
                            <Link
                              href={`/devices/${device.id}/control`}
                              className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-400 transition-colors"
                            >
                              <Settings2 className="w-3.5 h-3.5" /> Control
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
