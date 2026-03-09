'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, BarChart2, Wifi, WifiOff, Save,
  Lightbulb, Thermometer, Camera, Zap, Droplets, Plug, Cpu
} from 'lucide-react';

export default function ControlClient({ device: initialDevice, user }) {
  const [device, setDevice] = useState(initialDevice);
  const [settings, setSettings] = useState(initialDevice.settings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function sendControl(payload) {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`/api/devices/${device.id}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setDevice(data.device);
        setSettings(data.device.settings);
        setMessage('Settings saved successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error: ' + (data.error || 'Failed'));
      }
    } catch {
      setMessage('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus() {
    const newStatus = device.status === 'online' ? 'offline' : 'online';
    await sendControl({ action: 'toggle_status', status: newStatus });
  }

  const isReadOnly = user.role === 'support';

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/devices" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{device.name}</h1>
            <span className={device.status === 'online' ? 'badge-online' : 'badge-offline'}>
              <span className={`w-1.5 h-1.5 rounded-full ${device.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              {device.status}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-0.5">{device.location} · {device.type.replace(/_/g, ' ')}</p>
        </div>
        <Link
          href={`/devices/${device.id}/stats`}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <BarChart2 className="w-4 h-4" /> Stats
        </Link>
      </div>

      {message && (
        <div className={`text-sm rounded-lg px-4 py-3 mb-4 ${
          message.startsWith('Error')
            ? 'bg-red-500/10 border border-red-500/30 text-red-400'
            : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
        }`}>
          {message}
        </div>
      )}

      {isReadOnly && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm rounded-lg px-4 py-3 mb-4">
          View-only mode — support users cannot modify device settings
        </div>
      )}

      {/* Power toggle */}
      <div className="card mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-white">Device Power</h3>
            <p className="text-sm text-slate-400 mt-0.5">
              Toggle device {device.status === 'online' ? 'offline' : 'online'}
            </p>
          </div>
          {!isReadOnly && (
            <button
              onClick={toggleStatus}
              disabled={saving}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                device.status === 'online' ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform ${
                  device.status === 'online' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          )}
          {isReadOnly && (
            <div className={`relative inline-flex h-7 w-12 items-center rounded-full ${device.status === 'online' ? 'bg-emerald-500' : 'bg-slate-600'}`}>
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transform ${device.status === 'online' ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
          )}
        </div>
      </div>

      {/* Type-specific controls */}
      <DeviceControls
        device={device}
        settings={settings}
        setSettings={setSettings}
        onSave={sendControl}
        saving={saving}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}

function DeviceControls({ device, settings, setSettings, onSave, saving, isReadOnly }) {
  function handleSave() {
    onSave({ action: 'update_settings', settings });
  }

  switch (device.type) {
    case 'smart_light':
      return (
        <div className="card space-y-5">
          <h3 className="font-medium text-white flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-400" /> Light Controls
          </h3>
          <Toggle
            label="Power"
            value={settings.on}
            onChange={(v) => setSettings({ ...settings, on: v })}
            disabled={isReadOnly}
          />
          <RangeControl
            label="Brightness"
            value={settings.brightness || 100}
            min={1} max={100}
            unit="%"
            onChange={(v) => setSettings({ ...settings, brightness: v })}
            disabled={isReadOnly}
          />
          <div>
            <label className="label">Color</label>
            <input
              type="color"
              disabled={isReadOnly}
              value={settings.color || '#ffffff'}
              onChange={(e) => setSettings({ ...settings, color: e.target.value })}
              className="h-10 w-full rounded-lg border border-slate-600 bg-slate-700 cursor-pointer disabled:opacity-50"
            />
          </div>
          {!isReadOnly && <SaveButton onClick={handleSave} saving={saving} />}
        </div>
      );

    case 'thermostat':
      return (
        <div className="card space-y-5">
          <h3 className="font-medium text-white flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-blue-400" /> Thermostat Controls
          </h3>
          <Toggle
            label="Active"
            value={settings.on}
            onChange={(v) => setSettings({ ...settings, on: v })}
            disabled={isReadOnly}
          />
          <RangeControl
            label="Target Temperature"
            value={settings.targetTemp || 21}
            min={16} max={30}
            unit="°C"
            onChange={(v) => setSettings({ ...settings, targetTemp: v })}
            disabled={isReadOnly}
          />
          <div>
            <label className="label">Mode</label>
            <select
              disabled={isReadOnly}
              className="input-field"
              value={settings.mode || 'auto'}
              onChange={(e) => setSettings({ ...settings, mode: e.target.value })}
            >
              <option value="auto">Auto</option>
              <option value="heat">Heat</option>
              <option value="cool">Cool</option>
              <option value="fan">Fan Only</option>
            </select>
          </div>
          {!isReadOnly && <SaveButton onClick={handleSave} saving={saving} />}
        </div>
      );

    case 'security_camera':
      return (
        <div className="card space-y-5">
          <h3 className="font-medium text-white flex items-center gap-2">
            <Camera className="w-4 h-4 text-purple-400" /> Camera Controls
          </h3>
          <Toggle
            label="Motion Alerts"
            value={settings.motionAlert}
            onChange={(v) => setSettings({ ...settings, motionAlert: v })}
            disabled={isReadOnly}
          />
          <Toggle
            label="Recording"
            value={settings.recording}
            onChange={(v) => setSettings({ ...settings, recording: v })}
            disabled={isReadOnly}
          />
          <div>
            <label className="label">Resolution</label>
            <select
              disabled={isReadOnly}
              className="input-field"
              value={settings.resolution || '1080p'}
              onChange={(e) => setSettings({ ...settings, resolution: e.target.value })}
            >
              <option value="480p">480p</option>
              <option value="720p">720p (HD)</option>
              <option value="1080p">1080p (Full HD)</option>
              <option value="4k">4K</option>
            </select>
          </div>
          {!isReadOnly && <SaveButton onClick={handleSave} saving={saving} />}
        </div>
      );

    case 'smart_plug':
      return (
        <div className="card space-y-5">
          <h3 className="font-medium text-white flex items-center gap-2">
            <Plug className="w-4 h-4 text-red-400" /> Smart Plug Controls
          </h3>
          <Toggle
            label="Power"
            value={settings.on}
            onChange={(v) => setSettings({ ...settings, on: v })}
            disabled={isReadOnly}
          />
          {!isReadOnly && <SaveButton onClick={handleSave} saving={saving} />}
        </div>
      );

    case 'temperature_sensor':
    case 'humidity_sensor':
      return (
        <div className="card space-y-5">
          <h3 className="font-medium text-white flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-orange-400" /> Sensor Settings
          </h3>
          <RangeControl
            label="Alert Threshold"
            value={settings.alertThreshold || 35}
            min={10} max={60}
            unit={device.type === 'humidity_sensor' ? '%' : '°C'}
            onChange={(v) => setSettings({ ...settings, alertThreshold: v })}
            disabled={isReadOnly}
          />
          {device.type === 'temperature_sensor' && (
            <div>
              <label className="label">Unit</label>
              <select
                disabled={isReadOnly}
                className="input-field"
                value={settings.unit || 'celsius'}
                onChange={(e) => setSettings({ ...settings, unit: e.target.value })}
              >
                <option value="celsius">Celsius (°C)</option>
                <option value="fahrenheit">Fahrenheit (°F)</option>
              </select>
            </div>
          )}
          {!isReadOnly && <SaveButton onClick={handleSave} saving={saving} />}
        </div>
      );

    case 'energy_meter':
      return (
        <div className="card space-y-5">
          <h3 className="font-medium text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-green-400" /> Energy Meter Settings
          </h3>
          <div>
            <label className="label">Rate per kWh ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              disabled={isReadOnly}
              className="input-field"
              value={settings.ratePerKwh || 0.12}
              onChange={(e) => setSettings({ ...settings, ratePerKwh: parseFloat(e.target.value) })}
            />
          </div>
          <RangeControl
            label="Alert Threshold (kW)"
            value={settings.alertThreshold || 10}
            min={1} max={50}
            unit=" kW"
            onChange={(v) => setSettings({ ...settings, alertThreshold: v })}
            disabled={isReadOnly}
          />
          {!isReadOnly && <SaveButton onClick={handleSave} saving={saving} />}
        </div>
      );

    default:
      return (
        <div className="card text-center py-8 text-slate-400">
          <Cpu className="w-8 h-8 mx-auto mb-2" />
          <p>No controls available for this device type</p>
        </div>
      );
  }
}

function Toggle({ label, value, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-300">{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:opacity-50 ${
          value ? 'bg-blue-600' : 'bg-slate-600'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function RangeControl({ label, value, min, max, unit, onChange, disabled }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <label className="label mb-0">{label}</label>
        <span className="text-sm font-medium text-white">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-500 disabled:opacity-50"
      />
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

function SaveButton({ onClick, saving }) {
  return (
    <button onClick={onClick} disabled={saving} className="btn-primary flex items-center gap-2">
      <Save className="w-4 h-4" />
      {saving ? 'Saving...' : 'Save Settings'}
    </button>
  );
}
