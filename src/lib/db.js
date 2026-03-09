import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// In-memory database singleton
// Uses global to survive Next.js hot-reloads in dev mode
// NOTE: Data resets on Vercel cold starts (expected for in-memory DB)

function createDb() {
  const adminId = 'user-admin-001';
  const supportId = 'user-support-001';
  const userId1 = 'user-end-001';
  const userId2 = 'user-end-002';

  const adminPass = bcrypt.hashSync('admin123', 10);
  const supportPass = bcrypt.hashSync('support123', 10);
  const userPass = bcrypt.hashSync('user123', 10);

  const device1Id = 'device-001';
  const device2Id = 'device-002';
  const device3Id = 'device-003';
  const device4Id = 'device-004';
  const device5Id = 'device-005';

  return {
    users: [
      {
        id: adminId,
        name: 'Administrator',
        email: 'admin@smartiot.com',
        password: adminPass,
        role: 'admin',
        createdAt: new Date('2024-01-01').toISOString(),
        createdBy: null,
      },
      {
        id: supportId,
        name: 'Support Agent',
        email: 'support@smartiot.com',
        password: supportPass,
        role: 'support',
        createdAt: new Date('2024-01-15').toISOString(),
        createdBy: adminId,
      },
      {
        id: userId1,
        name: 'John Doe',
        email: 'john@example.com',
        password: userPass,
        role: 'user',
        createdAt: new Date('2024-02-01').toISOString(),
        createdBy: null,
      },
      {
        id: userId2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: userPass,
        role: 'user',
        createdAt: new Date('2024-02-10').toISOString(),
        createdBy: null,
      },
    ],

    devices: [
      {
        id: device1Id,
        name: 'Living Room Sensor',
        type: 'temperature_sensor',
        userId: userId1,
        status: 'online',
        location: 'Living Room',
        settings: { unit: 'celsius', alertThreshold: 30 },
        createdAt: new Date('2024-02-05').toISOString(),
      },
      {
        id: device2Id,
        name: 'Kitchen Smart Light',
        type: 'smart_light',
        userId: userId1,
        status: 'online',
        location: 'Kitchen',
        settings: { brightness: 80, color: '#ffffff', on: true },
        createdAt: new Date('2024-02-06').toISOString(),
      },
      {
        id: device3Id,
        name: 'Bedroom Thermostat',
        type: 'thermostat',
        userId: userId1,
        status: 'online',
        location: 'Bedroom',
        settings: { targetTemp: 22, mode: 'auto', on: true },
        createdAt: new Date('2024-02-07').toISOString(),
      },
      {
        id: device4Id,
        name: 'Front Door Camera',
        type: 'security_camera',
        userId: userId1,
        status: 'offline',
        location: 'Front Door',
        settings: { resolution: '1080p', motionAlert: true, recording: false },
        createdAt: new Date('2024-02-08').toISOString(),
      },
      {
        id: device5Id,
        name: 'Home Energy Meter',
        type: 'energy_meter',
        userId: userId1,
        status: 'online',
        location: 'Utility Room',
        settings: { ratePerKwh: 0.12, alertThreshold: 5 },
        createdAt: new Date('2024-02-09').toISOString(),
      },
    ],

    // deviceId -> array of { timestamp, data }
    deviceStats: {
      [device1Id]: generateTempStats(device1Id, 48),
      [device2Id]: generateLightStats(device2Id, 48),
      [device3Id]: generateThermostatStats(device3Id, 48),
      [device4Id]: [],
      [device5Id]: generateEnergyStats(device5Id, 48),
    },
  };
}

function generateTempStats(deviceId, hours) {
  const stats = [];
  const now = Date.now();
  for (let i = hours; i >= 0; i--) {
    stats.push({
      id: uuidv4(),
      deviceId,
      timestamp: new Date(now - i * 3600000).toISOString(),
      data: {
        temperature: +(18 + Math.random() * 8).toFixed(1),
        humidity: +(40 + Math.random() * 30).toFixed(1),
      },
    });
  }
  return stats;
}

function generateLightStats(deviceId, hours) {
  const stats = [];
  const now = Date.now();
  for (let i = hours; i >= 0; i--) {
    stats.push({
      id: uuidv4(),
      deviceId,
      timestamp: new Date(now - i * 3600000).toISOString(),
      data: {
        brightness: Math.floor(60 + Math.random() * 40),
        powerUsage: +(5 + Math.random() * 10).toFixed(2),
        on: Math.random() > 0.2,
      },
    });
  }
  return stats;
}

function generateThermostatStats(deviceId, hours) {
  const stats = [];
  const now = Date.now();
  for (let i = hours; i >= 0; i--) {
    stats.push({
      id: uuidv4(),
      deviceId,
      timestamp: new Date(now - i * 3600000).toISOString(),
      data: {
        currentTemp: +(20 + Math.random() * 5).toFixed(1),
        targetTemp: 22,
        humidity: +(45 + Math.random() * 20).toFixed(1),
        mode: 'auto',
      },
    });
  }
  return stats;
}

function generateEnergyStats(deviceId, hours) {
  const stats = [];
  const now = Date.now();
  for (let i = hours; i >= 0; i--) {
    stats.push({
      id: uuidv4(),
      deviceId,
      timestamp: new Date(now - i * 3600000).toISOString(),
      data: {
        powerUsage: +(1 + Math.random() * 4).toFixed(2),
        voltage: +(220 + Math.random() * 10).toFixed(1),
        current: +(4 + Math.random() * 3).toFixed(2),
        totalKwh: +(100 + Math.random() * 50).toFixed(2),
      },
    });
  }
  return stats;
}

// Initialize DB on global to persist across hot-reloads
if (!global.__smartIoTDb) {
  global.__smartIoTDb = createDb();
}

const db = global.__smartIoTDb;

// ─── User helpers ───────────────────────────────────────────────────

export function getAllUsers() {
  return db.users.map(safeUser);
}

export function getUserById(id) {
  const user = db.users.find((u) => u.id === id);
  return user ? safeUser(user) : null;
}

export function getUserByEmail(email) {
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export function createUser({ name, email, password, role, createdBy }) {
  if (db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('Email already in use');
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: uuidv4(),
    name,
    email,
    password: hashedPassword,
    role: role || 'user',
    createdAt: new Date().toISOString(),
    createdBy: createdBy || null,
  };
  db.users.push(newUser);
  return safeUser(newUser);
}

export function validatePassword(user, password) {
  return bcrypt.compareSync(password, user.password);
}

function safeUser(u) {
  const { password, ...rest } = u;
  return rest;
}

// ─── Device helpers ─────────────────────────────────────────────────

export function getAllDevices() {
  return db.devices;
}

export function getDevicesByUserId(userId) {
  return db.devices.filter((d) => d.userId === userId);
}

export function getDeviceById(id) {
  return db.devices.find((d) => d.id === id) || null;
}

export function createDevice({ name, type, userId, location, settings }) {
  const newDevice = {
    id: uuidv4(),
    name,
    type,
    userId,
    status: 'online',
    location: location || 'Unknown',
    settings: settings || getDefaultSettings(type),
    createdAt: new Date().toISOString(),
  };
  db.devices.push(newDevice);
  db.deviceStats[newDevice.id] = [];
  return newDevice;
}

export function updateDeviceSettings(id, settings) {
  const device = db.devices.find((d) => d.id === id);
  if (!device) return null;
  device.settings = { ...device.settings, ...settings };
  device.updatedAt = new Date().toISOString();

  // Record a stat entry for the update
  addDeviceStat(id, { ...device.settings, action: 'settings_update' });
  return device;
}

export function updateDeviceStatus(id, status) {
  const device = db.devices.find((d) => d.id === id);
  if (!device) return null;
  device.status = status;
  return device;
}

export function deleteDevice(id) {
  const idx = db.devices.findIndex((d) => d.id === id);
  if (idx === -1) return false;
  db.devices.splice(idx, 1);
  delete db.deviceStats[id];
  return true;
}

// ─── Stats helpers ──────────────────────────────────────────────────

export function getDeviceStats(deviceId, limit = 24) {
  const stats = db.deviceStats[deviceId] || [];
  return stats.slice(-limit);
}

export function addDeviceStat(deviceId, data) {
  if (!db.deviceStats[deviceId]) {
    db.deviceStats[deviceId] = [];
  }
  const entry = {
    id: uuidv4(),
    deviceId,
    timestamp: new Date().toISOString(),
    data,
  };
  db.deviceStats[deviceId].push(entry);
  // Keep only last 200 entries
  if (db.deviceStats[deviceId].length > 200) {
    db.deviceStats[deviceId] = db.deviceStats[deviceId].slice(-200);
  }
  return entry;
}

// ─── Device type defaults ────────────────────────────────────────────

export function getDefaultSettings(type) {
  const defaults = {
    temperature_sensor: { unit: 'celsius', alertThreshold: 35 },
    smart_light: { brightness: 100, color: '#ffffff', on: false },
    thermostat: { targetTemp: 21, mode: 'auto', on: true },
    security_camera: { resolution: '1080p', motionAlert: true, recording: false },
    energy_meter: { ratePerKwh: 0.12, alertThreshold: 10 },
    humidity_sensor: { alertThreshold: 70 },
    smart_plug: { on: false, schedule: null },
  };
  return defaults[type] || {};
}

export const DEVICE_TYPES = [
  { value: 'temperature_sensor', label: 'Temperature Sensor' },
  { value: 'smart_light', label: 'Smart Light' },
  { value: 'thermostat', label: 'Thermostat' },
  { value: 'security_camera', label: 'Security Camera' },
  { value: 'energy_meter', label: 'Energy Meter' },
  { value: 'humidity_sensor', label: 'Humidity Sensor' },
  { value: 'smart_plug', label: 'Smart Plug' },
];
