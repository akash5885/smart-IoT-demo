import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSession } from '@/lib/auth';
import {
  getUserById,
  getDevicesByUserId,
  getAllDevices,
  getDeviceById,
  getDeviceStats,
  updateDeviceSettings,
  updateDeviceStatus,
} from '@/lib/db';

// ── Tool definitions (Gemini function calling format) ────────────────
const TOOL_DECLARATIONS = {
  functionDeclarations: [
    {
      name: 'list_devices',
      description:
        'List all IoT devices for the current user with their name, type, location, and online/offline status.',
      parameters: { type: 'OBJECT', properties: {}, required: [] },
    },
    {
      name: 'get_device_status',
      description:
        'Get the current status and full settings of a specific IoT device.',
      parameters: {
        type: 'OBJECT',
        properties: {
          device_id: { type: 'STRING', description: 'The device ID (if known)' },
          device_name: {
            type: 'STRING',
            description: 'Device name or partial name (e.g. "kitchen light", "thermostat")',
          },
        },
        required: [],
      },
    },
    {
      name: 'get_device_stats',
      description:
        'Retrieve recent sensor readings for a device (temperature, humidity, power usage, etc.).',
      parameters: {
        type: 'OBJECT',
        properties: {
          device_id: { type: 'STRING', description: 'The device ID (if known)' },
          device_name: { type: 'STRING', description: 'Device name or partial name' },
          limit: {
            type: 'NUMBER',
            description: 'Number of recent readings to return (default 5, max 24)',
          },
        },
        required: [],
      },
    },
    {
      name: 'control_device',
      description:
        'Control an IoT device: turn it on/off, toggle power, or update its settings such as brightness, temperature target, color, mode, or recording.',
      parameters: {
        type: 'OBJECT',
        properties: {
          device_id: { type: 'STRING', description: 'The device ID (if known)' },
          device_name: { type: 'STRING', description: 'Device name or partial name' },
          action: {
            type: 'STRING',
            enum: ['turn_on', 'turn_off', 'toggle', 'update_settings'],
            description: 'Action to perform',
          },
          settings: {
            type: 'OBJECT',
            description:
              'Settings to apply (only for update_settings). E.g. {brightness:80} for lights, {targetTemp:22, mode:"heat"} for thermostats.',
            properties: {
              brightness:  { type: 'NUMBER' },
              color:       { type: 'STRING' },
              on:          { type: 'BOOLEAN' },
              targetTemp:  { type: 'NUMBER' },
              mode:        { type: 'STRING' },
              motionAlert: { type: 'BOOLEAN' },
              recording:   { type: 'BOOLEAN' },
              resolution:  { type: 'STRING' },
              alertThreshold: { type: 'NUMBER' },
              unit:        { type: 'STRING' },
              ratePerKwh:  { type: 'NUMBER' },
            },
          },
        },
        required: ['action'],
      },
    },
  ],
};

// ── Tool executor ────────────────────────────────────────────────────
function runTool(name, args, userDevices) {
  function findDevice(device_id, device_name) {
    if (device_id) return userDevices.find((d) => d.id === device_id) || null;
    if (device_name) {
      const q = device_name.toLowerCase();
      return (
        userDevices.find((d) => d.name.toLowerCase() === q) ||
        userDevices.find((d) => d.name.toLowerCase().includes(q)) ||
        null
      );
    }
    return null;
  }

  switch (name) {
    case 'list_devices':
      return {
        count: userDevices.length,
        devices: userDevices.map((d) => ({
          id: d.id,
          name: d.name,
          type: d.type.replace(/_/g, ' '),
          location: d.location,
          status: d.status,
        })),
      };

    case 'get_device_status': {
      const d = findDevice(args.device_id, args.device_name);
      if (!d) return { error: `No device found matching "${args.device_name || args.device_id}"` };
      return { device: { id: d.id, name: d.name, type: d.type, location: d.location, status: d.status, settings: d.settings } };
    }

    case 'get_device_stats': {
      const d = findDevice(args.device_id, args.device_name);
      if (!d) return { error: `No device found matching "${args.device_name || args.device_id}"` };
      const limit = Math.min(args.limit || 5, 24);
      const stats = getDeviceStats(d.id, limit);
      const latest = stats[stats.length - 1]?.data || null;
      return { device: { id: d.id, name: d.name, type: d.type, status: d.status }, latest_reading: latest, readings_count: stats.length };
    }

    case 'control_device': {
      const d = findDevice(args.device_id, args.device_name);
      if (!d) return { error: `No device found matching "${args.device_name || args.device_id}"` };
      const { action, settings } = args;
      if (action === 'turn_on') {
        updateDeviceStatus(d.id, 'online');
        updateDeviceSettings(d.id, { on: true });
      } else if (action === 'turn_off') {
        updateDeviceStatus(d.id, 'offline');
        updateDeviceSettings(d.id, { on: false });
      } else if (action === 'toggle') {
        const next = d.status === 'online' ? 'offline' : 'online';
        updateDeviceStatus(d.id, next);
        updateDeviceSettings(d.id, { on: next === 'online' });
      } else if (action === 'update_settings') {
        if (!settings || Object.keys(settings).length === 0) {
          return { error: 'No settings provided for update_settings' };
        }
        updateDeviceSettings(d.id, settings);
      }
      const updated = getDeviceById(d.id);
      return { success: true, action, device: { id: updated.id, name: updated.name, status: updated.status, settings: updated.settings } };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ── Route handler ────────────────────────────────────────────────────
export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = getUserById(session.userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 });

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured on this server.' }, { status: 503 });
  }

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { messages = [] } = body;
  const userDevices =
    ['admin', 'support'].includes(user.role) ? getAllDevices() : getDevicesByUserId(user.id);

  const systemPrompt = `You are SmartIoT Assistant, an AI agent helping ${user.name} manage their smart home IoT devices.
You have real-time access to their devices via tools. Always use tools to fetch live data rather than guessing.
When asked about device status or readings, call the appropriate tool first.
When controlling devices, confirm the action performed and the resulting state.
Be concise, friendly, and precise. Use the device's actual name from tool results.
User role: ${user.role}. Total devices available: ${userDevices.length}.`;

  // Convert chat history to Gemini format
  // Gemini uses 'user' and 'model' roles (not 'assistant')
  // Gemini also requires history to start with a 'user' message —
  // so we drop any leading 'model' messages (e.g. the UI greeting).
  const rawHistory = messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const firstUserIdx = rawHistory.findIndex((m) => m.role === 'user');
  const history = firstUserIdx >= 0 ? rawHistory.slice(firstUserIdx) : [];

  const lastUserMessage = messages[messages.length - 1]?.content || '';

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
      tools: [TOOL_DECLARATIONS],
    });

    const chat = model.startChat({ history });

    // Agentic loop
    const executedTools = [];
    let currentMessage = lastUserMessage;
    let currentResult = await chat.sendMessage(currentMessage);
    const MAX_ROUNDS = 6;

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const response = currentResult.response;
      const candidate = response.candidates?.[0];

      // Check if there are function calls in this response
      const functionCalls = candidate?.content?.parts
        ?.filter((p) => p.functionCall)
        ?.map((p) => p.functionCall) || [];

      if (functionCalls.length === 0) {
        // Final text answer
        const text = response.text();
        return NextResponse.json({ reply: text, toolCalls: executedTools });
      }

      // Execute all function calls and collect results
      const functionResponses = [];
      for (const fc of functionCalls) {
        let args = fc.args || {};
        const result = runTool(fc.name, args, userDevices);
        executedTools.push({ name: fc.name, args, result });
        functionResponses.push({
          functionResponse: { name: fc.name, response: result },
        });
      }

      // Send tool results back to the model
      currentResult = await chat.sendMessage(functionResponses);
    }

    return NextResponse.json({
      reply: 'I was unable to complete the request within the allowed steps. Please try rephrasing.',
      toolCalls: executedTools,
    });
  } catch (err) {
    console.error('Gemini error:', err);
    return NextResponse.json({ error: err?.message || 'AI request failed' }, { status: 500 });
  }
}
