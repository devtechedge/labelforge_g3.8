'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Mail, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

export default function AcceptInvitationPage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();

  const [accepting, setAccepting] = useState(false);
  const [success, setSuccess] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch(`/api/invitations/${token}/accept`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }
      setSuccess(data);
      setTimeout(() => {
        router.push(`/workspaces/${data.workspaceId}`);
      }, 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa]">
      <Header />

      <main className="flex-1 max-w-md w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-stone-950">Workspace Invitation</h1>
            <p className="text-xs text-stone-500 mt-1">
              You have been invited to collaborate on an annotation organization.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800 rounded-md">
              {error}
            </div>
          )}

          {success ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 rounded-md space-y-1">
              <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto" />
              <div className="font-semibold">Invitation Accepted!</div>
              <div>Redirecting to workspace...</div>
            </div>
          ) : (
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-md text-xs font-semibold disabled:opacity-50 transition-colors cursor-pointer"
            >
              {accepting ? 'Accepting...' : 'Accept Invitation & Join Workspace'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
