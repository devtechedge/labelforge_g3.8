'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Check, ChevronDown, Shield, User as UserIcon, Building, Layers } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Header({
  workspaceId = 'ws_core',
  projectId,
}: {
  workspaceId?: string;
  projectId?: string;
}) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/current')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
          setAvailableUsers(data.availableUsers || []);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const switchUser = async (userId: string) => {
    setIsSwitching(true);
    try {
      await fetch('/api/auth/current', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      setMenuOpen(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
      setIsSwitching(false);
    }
  };

  return (
    <header className="border-b border-stone-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
        {/* Brand & Workspace */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded bg-stone-900 text-stone-50 flex items-center justify-center font-mono font-bold text-sm tracking-wider shadow-sm group-hover:bg-violet-950 transition-colors">
              LF
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-stone-950 text-base leading-tight tracking-tight">LabelForge</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500">Annotation Workbench</span>
            </div>
          </Link>

          <div className="h-4 w-[1px] bg-stone-200 hidden sm:block" />

          {/* Workspace Nav Link */}
          <Link
            href={`/workspaces/${workspaceId}`}
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-stone-700 hover:text-stone-950 px-2 py-1 rounded transition-colors"
          >
            <Building className="w-3.5 h-3.5 text-stone-400" />
            <span>Acme Research & AI Systems</span>
          </Link>
        </div>

        {/* Global actions & Persona Switcher */}
        <div className="flex items-center gap-3">
          <Link
            href="/workspaces"
            className="text-xs font-medium text-stone-600 hover:text-stone-900 px-2.5 py-1.5 rounded transition-colors hidden md:block"
          >
            All Workspaces
          </Link>

          <ThemeToggle />

          {/* Persona Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-md border border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 transition-colors text-xs font-medium text-stone-800"
              aria-label="Switch User Persona"
            >
              <div className="w-6 h-6 rounded-full bg-violet-700 text-white font-mono text-[10px] flex items-center justify-center font-bold">
                {currentUser?.avatar || 'EV'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="leading-tight font-medium text-stone-900">{currentUser?.name || 'Elena Vance'}</div>
                <div className="text-[10px] text-stone-500 leading-tight">
                  {currentUser?.roles?.[0] || 'OWNER'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg border border-stone-200 shadow-xl py-2 z-50 text-xs">
                <div className="px-3 py-1.5 border-b border-stone-100 mb-1">
                  <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider">Switch Persona / Role</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">Test permissions, reviews, and workflows:</div>
                </div>

                <div className="space-y-0.5">
                  {availableUsers.map((u) => {
                    const isSelected = currentUser?.id === u.id;
                    return (
                      <button
                        key={u.id}
                        disabled={isSwitching}
                        onClick={() => switchUser(u.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-stone-50 transition-colors ${
                          isSelected ? 'bg-violet-50/60' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-6 h-6 rounded-full text-white font-mono text-[10px] flex items-center justify-center font-bold ${
                            u.roles.includes('OWNER') ? 'bg-stone-900' : u.roles.includes('REVIEWER') ? 'bg-violet-700' : 'bg-amber-700'
                          }`}>
                            {u.avatar}
                          </div>
                          <div>
                            <div className="font-medium text-stone-900 leading-tight">{u.name}</div>
                            <div className="text-[10px] text-stone-500">{u.title} · <span className="font-mono font-semibold text-stone-700">{u.roles.join(', ')}</span></div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-violet-700" />}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2 pt-2 border-t border-stone-100 px-3 flex justify-between items-center text-[11px] text-stone-500">
                  <Link href={`/workspaces/${workspaceId}/settings`} className="hover:text-stone-900">
                    Workspace Settings
                  </Link>
                  <Link href="/terms" className="hover:text-stone-900">
                    Policy & Privacy
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
