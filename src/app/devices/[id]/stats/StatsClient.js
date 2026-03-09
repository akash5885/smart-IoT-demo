'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { ArrowLeft, Settings2, RefreshCw } from 'lucide-react';

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  tertiary: '#f59e0b',
  quaternary: '#ef4444',
};

export default function StatsClient({ device, initialStats }) {
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/stats?limit=24`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } finally {
      setLoading(false);
    }
  }, [device.id]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchStats]);

  const chartData = stats.map((s) => ({
    time: formatTime(s.timestamp),
    ...s.data,
  }));

  const latest = stats[stats.length - 1]?.data || {};

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/devices" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{device.name}</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {device.location} · {device.type.replace(/_/g, ' ')} · Last 24 readings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-colors ${
              autoRefresh
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-slate-700 text-slate-400 hover:border-slate-600'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Live' : 'Auto'}
          </button>
          <button onClick={fetchStats} disabled={loading} className="btn-secondary text-sm flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link href={`/devices/${device.id}/control`} className="btn-primary flex items-center gap-2 text-sm">
            <Settings2 className="w-4 h-4" /> Control
          </Link>
        </div>
      </div>

      {/* Latest values */}
      <LatestValues device={device} data={latest} />

      {/* Charts */}
      <Charts device={device} chartData={chartData} />
    </div>
  );
}

function LatestValues({ device, data }) {
  const cards = getLatestValueCards(device.type, data);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map(({ label, value, unit, color }) => (
        <div key={label} className="card">
          <p className="text-xs text-slate-400 mb-1">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>
            {value !== undefined && value !== null ? value : '--'}
            <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

function getLatestValueCards(type, data) {
  switch (type) {
    case 'temperature_sensor':
      return [
        { label: 'Temperature', value: data.temperature, unit: '°C', color: 'text-orange-400' },
        { label: 'Humidity', value: data.humidity, unit: '%', color: 'text-cyan-400' },
      ];
    case 'smart_light':
      return [
        { label: 'Brightness', value: data.brightness, unit: '%', color: 'text-yellow-400' },
        { label: 'Power Usage', value: data.powerUsage, unit: 'W', color: 'text-green-400' },
        { label: 'State', value: data.on ? 'On' : 'Off', unit: '', color: data.on ? 'text-emerald-400' : 'text-slate-400' },
      ];
    case 'thermostat':
      return [
        { label: 'Current Temp', value: data.currentTemp, unit: '°C', color: 'text-blue-400' },
        { label: 'Target Temp', value: data.targetTemp, unit: '°C', color: 'text-orange-400' },
        { label: 'Humidity', value: data.humidity, unit: '%', color: 'text-cyan-400' },
      ];
    case 'energy_meter':
      return [
        { label: 'Power Usage', value: data.powerUsage, unit: 'kW', color: 'text-green-400' },
        { label: 'Voltage', value: data.voltage, unit: 'V', color: 'text-blue-400' },
        { label: 'Current', value: data.current, unit: 'A', color: 'text-amber-400' },
        { label: 'Total', value: data.totalKwh, unit: 'kWh', color: 'text-purple-400' },
      ];
    case 'humidity_sensor':
      return [
        { label: 'Humidity', value: data.humidity, unit: '%', color: 'text-cyan-400' },
        { label: 'Temperature', value: data.temperature, unit: '°C', color: 'text-orange-400' },
      ];
    default:
      return [];
  }
}

function Charts({ device, chartData }) {
  if (chartData.length === 0) {
    return (
      <div className="card text-center py-12 text-slate-400">
        No statistics available yet. Data will appear here as the device reports.
      </div>
    );
  }

  switch (device.type) {
    case 'temperature_sensor':
    case 'humidity_sensor':
      return (
        <div className="space-y-4">
          <ChartCard title="Temperature (°C)">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="temperature" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary + '20'} name="Temperature (°C)" dot={false} />
            </AreaChart>
          </ChartCard>
          <ChartCard title="Humidity (%)">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="humidity" stroke={CHART_COLORS.secondary} fill={CHART_COLORS.secondary + '20'} name="Humidity (%)" dot={false} />
            </AreaChart>
          </ChartCard>
        </div>
      );

    case 'thermostat':
      return (
        <ChartCard title="Temperature (°C)">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
            <Legend />
            <Line type="monotone" dataKey="currentTemp" stroke={CHART_COLORS.primary} name="Current (°C)" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="targetTemp" stroke={CHART_COLORS.tertiary} name="Target (°C)" dot={false} strokeWidth={2} strokeDasharray="5 5" />
          </LineChart>
        </ChartCard>
      );

    case 'smart_light':
      return (
        <div className="space-y-4">
          <ChartCard title="Brightness (%)">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="brightness" stroke="#f59e0b" fill="#f59e0b20" name="Brightness (%)" dot={false} />
            </AreaChart>
          </ChartCard>
          <ChartCard title="Power Usage (W)">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="powerUsage" stroke={CHART_COLORS.secondary} fill={CHART_COLORS.secondary + '20'} name="Power (W)" dot={false} />
            </AreaChart>
          </ChartCard>
        </div>
      );

    case 'energy_meter':
      return (
        <div className="space-y-4">
          <ChartCard title="Power Usage (kW)">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="powerUsage" stroke={CHART_COLORS.secondary} fill={CHART_COLORS.secondary + '20'} name="Power (kW)" dot={false} />
            </AreaChart>
          </ChartCard>
          <ChartCard title="Voltage & Current">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Legend />
              <Line type="monotone" dataKey="voltage" stroke={CHART_COLORS.primary} name="Voltage (V)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="current" stroke={CHART_COLORS.tertiary} name="Current (A)" dot={false} strokeWidth={2} />
            </LineChart>
          </ChartCard>
        </div>
      );

    default:
      return (
        <div className="card text-center py-12 text-slate-400">
          Charts not available for this device type
        </div>
      );
  }
}

function ChartCard({ title, children }) {
  return (
    <div className="card">
      <h3 className="font-medium text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}
