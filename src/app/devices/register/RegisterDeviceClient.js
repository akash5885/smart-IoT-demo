'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Cpu } from 'lucide-react';

const DEVICE_TYPES = [
  { value: 'temperature_sensor', label: 'Temperature Sensor', desc: 'Monitors ambient temperature and humidity' },
  { value: 'smart_light', label: 'Smart Light', desc: 'Controllable LED smart bulb or fixture' },
  { value: 'thermostat', label: 'Thermostat', desc: 'Smart heating and cooling control' },
  { value: 'security_camera', label: 'Security Camera', desc: 'IP camera with motion detection' },
  { value: 'energy_meter', label: 'Energy Meter', desc: 'Tracks power usage and consumption' },
  { value: 'humidity_sensor', label: 'Humidity Sensor', desc: 'Monitors relative humidity levels' },
  { value: 'smart_plug', label: 'Smart Plug', desc: 'Remote-controlled electrical outlet' },
];

export default function RegisterDeviceClient() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', type: '', location: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to register device');
      } else {
        router.push(`/devices/${data.device.id}/control`);
        router.refresh();
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Register New Device</h1>
        <p className="text-slate-400 mt-1">Add a new IoT device to your account</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Device type selection */}
        <div>
          <label className="label">Device Type *</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {DEVICE_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setForm({ ...form, type: type.value })}
                className={`p-4 rounded-xl border text-left transition-all ${
                  form.type === type.value
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >
                <p className="font-medium text-white text-sm">{type.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{type.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="card space-y-4">
          <div>
            <label className="label">Device Name *</label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="e.g. Living Room Sensor"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Location</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Living Room, Kitchen, Backyard"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => router.back()}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={loading || !form.name || !form.type}
          >
            <PlusCircle className="w-4 h-4" />
            {loading ? 'Registering...' : 'Register Device'}
          </button>
        </div>
      </form>
    </div>
  );
}
