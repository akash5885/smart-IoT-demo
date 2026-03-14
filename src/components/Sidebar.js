'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Cpu,
  PlusCircle,
  Users,
  LogOut,
  Wifi,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'support', 'user'] },
  { href: '/devices', label: 'My Devices', icon: Cpu, roles: ['admin', 'support', 'user'] },
  { href: '/devices/register', label: 'Add Device', icon: PlusCircle, roles: ['user', 'admin'] },
  { href: '/chat', label: 'AI Assistant', icon: Sparkles, roles: ['admin', 'support', 'user'] },
  { href: '/admin/users', label: 'User Management', icon: Users, roles: ['admin'] },
  { href: '/admin/devices', label: 'All Devices', icon: ShieldCheck, roles: ['admin', 'support'] },
];

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const allowed = navItems.filter((item) => item.roles.includes(user?.role));

  return (
    <aside className="w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Wifi className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm">SmartIoT</h1>
            <p className="text-xs text-slate-400">Device Manager</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {allowed.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User info & logout */}
      <div className="p-4 border-t border-slate-800">
        <div className="mb-3 px-3">
          <p className="text-sm font-medium text-white truncate">{user?.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`badge-role ${
                user?.role === 'admin'
                  ? 'bg-purple-500/20 text-purple-400'
                  : user?.role === 'support'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              {user?.role}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
