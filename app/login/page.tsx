'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Shield, ArrowRight, UserCheck } from 'lucide-react';
import { DEMO_USERS } from '@/lib/auth/constants';

export default function LoginPage() {
  const router = useRouter();
  const [loadingUser, setLoadingUser] = useState<string | null>(null);

  const loginAs = async (userId: string) => {
    setLoadingUser(userId);
    try {
      await fetch('/api/auth/current', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      router.push('/workspaces/ws_core');
    } catch (e) {
      console.error(e);
      setLoadingUser(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa]">
      <Header />

      <main className="flex-1 max-w-md w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <div className="w-8 h-8 rounded bg-stone-900 text-stone-50 flex items-center justify-center font-mono font-bold text-sm mb-3">
              LF
            </div>
            <h1 className="text-xl font-bold text-stone-950">Authenticate into LabelForge</h1>
            <p className="text-xs text-stone-500 mt-1">
              Select an authorized evaluation identity to enter the workbench.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-mono uppercase text-stone-400 tracking-wider">
              Choose Test Account
            </div>
            {DEMO_USERS.map((u) => (
              <button
                key={u.id}
                disabled={loadingUser !== null}
                onClick={() => loginAs(u.id)}
                className="w-full p-3 rounded-lg border border-stone-200 bg-white hover:border-stone-400 hover:bg-stone-50 flex items-center justify-between transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-stone-900 text-white font-mono text-xs flex items-center justify-center font-bold">
                    {u.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-stone-900 text-xs">{u.name}</div>
                    <div className="text-[10px] text-stone-500 font-mono">{u.title} · {u.roles.join(', ')}</div>
                  </div>
                </div>

                <div className="text-stone-400 group-hover:text-stone-900">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-stone-100 text-center text-xs text-stone-500">
            Protected by role-based access control and session encryption.
          </div>
        </div>
      </main>
    </div>
  );
}
