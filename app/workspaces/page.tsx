'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Building, Plus, ArrowRight, ShieldCheck, Mail, CheckCircle2 } from 'lucide-react';

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchWorkspaces = () => {
    setLoading(true);
    fetch('/api/workspaces')
      .then((res) => res.json())
      .then((data) => {
        setWorkspaces(data.workspaces || []);
        setInvitations(data.invitations || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleCreate = async () => {
    if (!newWorkspaceName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWorkspaceName }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewWorkspaceName('');
        fetchWorkspaces();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create workspace');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleAcceptInvite = async (token: string) => {
    try {
      const res = await fetch(`/api/invitations/${token}/accept`, { method: 'POST' });
      if (res.ok) {
        fetchWorkspaces();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to accept invitation');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa]">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div>
            <h1 className="text-xl font-bold text-stone-950 flex items-center gap-2">
              <Building className="w-5 h-5 text-stone-700" />
              Workspaces Directory
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Select or administer your team's annotation organizations.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Workspace</span>
          </button>
        </div>

        {/* Pending Invitations Banner */}
        {invitations.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
            <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-amber-700" />
              <span>Pending Workspace Invitations ({invitations.length})</span>
            </div>
            <div className="space-y-2">
              {invitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between text-xs bg-white p-3 rounded border border-amber-200">
                  <div>
                    <span className="font-semibold text-stone-900">{inv.workspace_id}</span>
                    <span className="text-stone-500 text-[11px] ml-2 font-mono">Role: {inv.role}</span>
                  </div>
                  <button
                    onClick={() => handleAcceptInvite(inv.token)}
                    className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded text-xs font-medium cursor-pointer"
                  >
                    Accept Invite
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workspaces Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/workspaces/${ws.id}`}
              className="p-5 rounded-lg border border-stone-200 bg-white hover:border-stone-400 hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-stone-900 uppercase">
                    {ws.slug}
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                    {ws.user_role}
                  </span>
                </div>
                <h3 className="text-base font-bold text-stone-950 group-hover:text-violet-700 transition-colors">
                  {ws.name}
                </h3>
                <div className="text-xs text-stone-500 mt-1">
                  Owner ID: <span className="font-mono">{ws.owner_id}</span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-stone-700 group-hover:text-stone-950">
                <span>Enter Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-semibold text-stone-950">Create Organization Workspace</h3>
            <div className="space-y-1 text-xs">
              <label className="font-semibold text-stone-800 block">Workspace Name</label>
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="e.g. DeepReasoning Labs"
                className="w-full p-2.5 rounded-md border border-stone-200 bg-white text-stone-900 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={creating || !newWorkspaceName.trim()}
                onClick={handleCreate}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-md"
              >
                {creating ? 'Creating...' : 'Create Workspace'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
