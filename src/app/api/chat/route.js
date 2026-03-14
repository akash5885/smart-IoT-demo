import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
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

// ── Tool definitions (OpenAI-compatible format, works with Groq) ─────
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'list_devices',
      description:
        'List all IoT devices for the current user with their name, type, location, and online/offline status.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_device_status',
      description: 'Get the current status and full settings of a specific IoT device.',
      parameters: {
        type: 'object',
        properties: {
          device_id: { type: 'string', description: 'The device ID (if known)' },
          device_name: {
            type: 'string',
            description: 'Device name or partial name (e.g. "kitchen light", "thermostat")',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_device_stats',
      description:
        'Retrieve recent sensor readings for a device (temperature, humidity, power usage, etc.).',
      parameters: {
        type: 'object',
        properties: {
          device_id: { type: 'string', description: 'The device ID (if known)' },
          device_name: { type: 'string', description: 'Device name or partial name' },
          limit: {
            type: 'number',
            description: 'Number of recent readings to return (default 5, max 24)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'control_device',
      description:
        'Control an IoT device: turn it on/off, toggle power, or update settings like brightness, temperature, color, mode, recording.',
      parameters: {
        type: 'object',
        properties: {
          device_id: { type: 'string', description: 'The device ID (if known)' },
          device_name: { type: 'string', description: 'Device name or partial name' },
          action: {
            type: 'string',
            enum: ['turn_on', 'turn_off', 'toggle', 'update_settings'],
            description: 'Action to perform on the device',
          },
          settings: {
            type: 'object',
            description:
              'New settings to apply (only for update_settings). E.g. {brightness:80} for lights, {targetTemp:22, mode:"heat"} for thermostats.',
          },
        },
        required: ['action'],
      },
    },
  },
];

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
      return {
        device: { id: d.id, name: d.name, type: d.type, location: d.location, status: d.status, settings: d.settings },
      };
    }

    case 'get_device_stats': {
      const d = findDevice(args.device_id, args.device_name);
      if (!d) return { error: `No device found matching "${args.device_name || args.device_id}"` };
      const limit = Math.min(args.limit || 5, 24);
      const stats = getDeviceStats(d.id, limit);
      const latest = stats[stats.length - 1]?.data || null;
      return {
        device: { id: d.id, name: d.name, type: d.type, status: d.status },
        latest_reading: latest,
        readings_count: stats.length,
      };
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
        if (!settings || Object.keys(settings).length === 0)
          return { error: 'No settings provided for update_settings' };
        updateDeviceSettings(d.id, settings);
      }
      const updated = getDeviceById(d.id);
      return {
        success: true,
        action,
        device: { id: updated.id, name: updated.name, status: updated.status, settings: updated.settings },
      };
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

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY is not configured on this server.' }, { status: 503 });
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

  // Build message array — skip leading assistant messages (UI greeting)
  // Keep only from first user message onwards
  const firstUserIdx = messages.findIndex((m) => m.role === 'user');
  const trimmedMessages = firstUserIdx >= 0 ? messages.slice(firstUserIdx) : messages;

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...trimmedMessages.map(({ role, content }) => ({ role, content })),
  ];

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const executedTools = [];
  const MAX_ROUNDS = 6;

  try {
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: apiMessages,
        tools: TOOLS,
        tool_choice: 'auto',
        temperature: 0.3,
        max_tokens: 1024,
      });

      const choice = response.choices[0];
      const assistantMsg = choice.message;
      apiMessages.push(assistantMsg);

      if (choice.finish_reason !== 'tool_calls') {
        return NextResponse.json({ reply: assistantMsg.content, toolCalls: executedTools });
      }

      // Execute all tool calls
      for (const tc of assistantMsg.tool_calls) {
        let args = {};
        try { args = JSON.parse(tc.function.arguments); } catch {}

        const result = runTool(tc.function.name, args, userDevices);
        executedTools.push({ name: tc.function.name, args, result });

        apiMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }
    }

    return NextResponse.json({
      reply: 'I was unable to complete the request within the allowed steps. Please try rephrasing.',
      toolCalls: executedTools,
    });
  } catch (err) {
    console.error('Groq error:', err);
    return NextResponse.json({ error: err?.message || 'AI request failed' }, { status: 500 });
  }
}
