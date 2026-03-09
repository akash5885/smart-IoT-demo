'use client';

import Link from 'next/link';
import { Cpu, Wifi, WifiOff, Users, PlusCircle, ArrowRight } from 'lucide-react';
import DeviceCard from '@/components/DeviceCard';

export default function DashboardClient({ user, devices, stats }) {
  const recentDevices = devices.slice(0, 4);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {user.name.split(' ')[0]}
        </h1>
        <p className="text-slate-400 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Cpu}
          label="Total Devices"
          value={stats.totalDevices}
          color="text-blue-400 bg-blue-400/10"
        />
        <StatCard
          icon={Wifi}
          label="Online"
          value={stats.onlineDevices}
          color="text-emerald-400 bg-emerald-400/10"
        />
        <StatCard
          icon={WifiOff}
          label="Offline"
          value={stats.offlineDevices}
          color="text-red-400 bg-red-400/10"
        />
        {['admin', 'support'].includes(user.role) ? (
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats.totalUsers}
            color="text-purple-400 bg-purple-400/10"
          />
        ) : (
          <div className="card flex flex-col items-center justify-center text-center">
            <Link href="/devices/register" className="flex flex-col items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors">
              <PlusCircle className="w-8 h-8" />
              <span className="text-sm font-medium">Add Device</span>
            </Link>
          </div>
        )}
      </div>

      {/* Recent devices */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          {['admin', 'support'].includes(user.role) ? 'All Devices' : 'Your Devices'}
        </h2>
        <Link href="/devices" className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors">
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {recentDevices.length === 0 ? (
        <div className="card text-center py-12">
          <Cpu className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-4">No devices registered yet</p>
          <Link href="/devices/register" className="btn-primary inline-flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> Register your first device
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentDevices.map((device) => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card">
      <div className={`inline-flex p-3 rounded-xl mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}
