'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusCircle, Cpu, Search } from 'lucide-react';
import DeviceCard from '@/components/DeviceCard';

export default function DevicesClient({ user, initialDevices }) {
  const router = useRouter();
  const [devices, setDevices] = useState(initialDevices);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = devices.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.location.toLowerCase().includes(search.toLowerCase()) ||
      d.type.includes(search.toLowerCase());
    const matchFilter = filter === 'all' || d.status === filter;
    return matchSearch && matchFilter;
  });

  async function handleDelete(id) {
    if (!confirm('Delete this device?')) return;
    const res = await fetch(`/api/devices/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setDevices((prev) => prev.filter((d) => d.id !== id));
    } else {
      alert('Failed to delete device');
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {['admin', 'support'].includes(user.role) ? 'All Devices' : 'My Devices'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">{devices.length} device{devices.length !== 1 ? 's' : ''} registered</p>
        </div>
        {user.role !== 'support' && (
          <Link href="/devices/register" className="btn-primary flex items-center gap-2 self-start sm:self-auto">
            <PlusCircle className="w-4 h-4" /> Add Device
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            className="input-field pl-9"
            placeholder="Search by name, location, or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field sm:w-40"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Cpu className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-4">
            {devices.length === 0 ? 'No devices yet' : 'No devices match your search'}
          </p>
          {devices.length === 0 && user.role !== 'support' && (
            <Link href="/devices/register" className="btn-primary inline-flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> Register your first device
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onDelete={user.role !== 'support' ? handleDelete : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
