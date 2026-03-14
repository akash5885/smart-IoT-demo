'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Send, Bot, User, Cpu, BarChart2, Settings2, List,
  ChevronDown, ChevronUp, Loader2, AlertCircle, Sparkles,
} from 'lucide-react';

const TOOL_META = {
  list_devices:     { icon: List,      label: 'Listed devices',         color: 'text-blue-400  bg-blue-400/10' },
  get_device_status:{ icon: Cpu,       label: 'Checked device status',  color: 'text-emerald-400 bg-emerald-400/10' },
  get_device_stats: { icon: BarChart2, label: 'Retrieved stats',        color: 'text-purple-400 bg-purple-400/10' },
  control_device:   { icon: Settings2, label: 'Controlled device',      color: 'text-amber-400 bg-amber-400/10' },
};

const SUGGESTIONS = [
  'Show me all my devices',
  'What is the current temperature in the living room?',
  'Turn on the kitchen light',
  'Set the bedroom thermostat to 22°C',
  'Show the energy meter stats',
  'Which devices are offline?',
];

export default function ChatClient({ user }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi ${user.name.split(' ')[0]}! I'm your SmartIoT Assistant powered by OpenAI. I can check device status, read sensor data, and control your devices. What would you like to do?`,
      toolCalls: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(text) {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    setInput('');
    setError('');

    const userMsg = { role: 'user', content: userText };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);

    // Build the API message array (only role+content, no toolCalls UI field)
    const apiMessages = history
      .filter((m) => m.role !== 'system')
      .map(({ role, content }) => ({ role, content }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Check that GEMINI_API_KEY is set.');
        setMessages((prev) => prev.slice(0, -1)); // remove the user msg on error
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.reply, toolCalls: data.toolCalls || [] },
        ]);
      }
    } catch {
      setError('Network error. Please check your connection.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2.5 rounded-xl">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">SmartIoT Assistant</h1>
          <p className="text-xs text-slate-400">Powered by Google Gemini 2.0 Flash (Free) · Can control &amp; monitor your devices</p>
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {loading && <TypingIndicator />}

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions (shown when only the greeting exists) */}
      {messages.length === 1 && (
        <div className="shrink-0 mb-3">
          <p className="text-xs text-slate-500 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg px-3 py-1.5 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 flex gap-3 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            rows={1}
            className="input-field resize-none pr-4 py-3 leading-normal max-h-32"
            placeholder="Ask about your devices or give a command..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
            style={{ scrollbarWidth: 'none' }}
          />
        </div>
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="btn-primary p-3 rounded-xl shrink-0 self-end"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}

// ── Individual message ───────────────────────────────────────────────
function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold
        ${isUser ? 'bg-blue-600' : 'bg-gradient-to-br from-blue-500 to-purple-600'}`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={`flex flex-col gap-2 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Tool call badges */}
        {!isUser && message.toolCalls?.length > 0 && (
          <ToolCallList toolCalls={message.toolCalls} />
        )}

        {/* Message bubble */}
        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap
          ${isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-sm'
          }`}>
          {message.content}
        </div>
      </div>
    </div>
  );
}

// ── Tool call list ───────────────────────────────────────────────────
function ToolCallList({ toolCalls }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-1"
      >
        <Cpu className="w-3 h-3" />
        {toolCalls.length} agent action{toolCalls.length > 1 ? 's' : ''} taken
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {open && (
        <div className="space-y-2 mb-2">
          {toolCalls.map((tc, i) => (
            <ToolCallCard key={i} tc={tc} />
          ))}
        </div>
      )}
    </div>
  );
}

function ToolCallCard({ tc }) {
  const [expanded, setExpanded] = useState(false);
  const meta = TOOL_META[tc.name] || { icon: Cpu, label: tc.name, color: 'text-slate-400 bg-slate-400/10' };
  const Icon = meta.icon;
  const hasError = tc.result?.error;

  return (
    <div className={`rounded-lg border text-xs overflow-hidden
      ${hasError ? 'border-red-500/30 bg-red-500/5' : 'border-slate-700 bg-slate-900/60'}`}>
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <span className={`p-1 rounded ${meta.color}`}>
          <Icon className="w-3 h-3" />
        </span>
        <span className={`font-medium ${hasError ? 'text-red-400' : 'text-slate-300'}`}>
          {meta.label}
          {tc.args?.device_name && <span className="text-slate-500 font-normal"> · {tc.args.device_name}</span>}
          {tc.args?.action && <span className="text-slate-500 font-normal"> · {tc.args.action}</span>}
        </span>
        <span className="ml-auto text-slate-600">
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-slate-700/50 px-3 py-2 space-y-2">
          {Object.keys(tc.args).length > 0 && (
            <div>
              <p className="text-slate-500 mb-1">Input:</p>
              <pre className="text-slate-400 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(tc.args, null, 2)}
              </pre>
            </div>
          )}
          <div>
            <p className="text-slate-500 mb-1">Result:</p>
            <pre className={`overflow-x-auto whitespace-pre-wrap ${hasError ? 'text-red-400' : 'text-slate-400'}`}>
              {JSON.stringify(tc.result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Typing indicator ─────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
