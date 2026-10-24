'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import {
  Settings,
  Users,
  ShieldCheck,
  UserPlus,
  Clock,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Copy,
} from 'lucide-react';
import { WorkspaceRole } from '@/lib/domain/types';

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const workspaceId = (params.workspaceId as string) || 'ws_core';

  const [workspaceData, setWorkspaceData] = useState<any>(null);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('ANNOTATOR');
  const [inviting, setInviting] = useState(false);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/workspaces/${workspaceId}`).then((r) => r.json()),
      fetch(`/api/audit?workspaceId=${workspaceId}`).then((r) => r.json()),
    ])
      .then(([ws, audit]) => {
        setWorkspaceData(ws);
        setAuditEvents(audit.events || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [workspaceId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setGeneratedInviteUrl(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send invite');
      }

      setGeneratedInviteUrl(`${window.location.origin}${data.inviteUrl}`);
      setInviteEmail('');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa]">
      <Header workspaceId={workspaceId} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="pb-4 border-b border-stone-200">
          <h1 className="text-xl font-bold text-stone-950 flex items-center gap-2">
            <Settings className="w-5 h-5 text-stone-700" />
            Workspace Administration & Audit Log
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage team roles, send invitations, and inspect immutable compliance audit events.
          </p>
        </div>

        {/* Section 1: Members & Roles */}
        <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h2 className="text-sm font-semibold text-stone-950 flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-700" />
                Team Members ({workspaceData?.members?.length || 0})
              </h2>
              <p className="text-xs text-stone-500">
                Four enterprise roles: Owner, Manager, Reviewer, and Annotator.
              </p>
            </div>
          </div>

          <div className="divide-y divide-stone-100 text-xs">
            {workspaceData?.members?.map((m: any) => (
              <div key={m.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-stone-900 text-white font-mono text-xs flex items-center justify-center font-bold">
                    {m.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-stone-900">{m.name}</div>
                    <div className="text-stone-500 text-[11px] font-mono">{m.email} · {m.title}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    m.role === 'OWNER'
                      ? 'bg-stone-900 text-white'
                      : m.role === 'REVIEWER'
                      ? 'bg-violet-100 text-violet-800'
                      : 'bg-stone-100 text-stone-700'
                  }`}>
                    {m.role}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Invite Member Form */}
          <form onSubmit={handleInvite} className="pt-4 border-t border-stone-100 space-y-3">
            <div className="text-xs font-semibold text-stone-900">Invite New Teammate</div>
            <div className="flex flex-col sm:flex-row items-center gap-3 text-xs">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full sm:flex-1 p-2 rounded-md border border-stone-200 bg-white text-stone-900"
              />

              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
                className="w-full sm:w-44 p-2 rounded-md border border-stone-200 bg-white text-stone-800 font-mono"
              >
                <option value="ANNOTATOR">ANNOTATOR</option>
                <option value="REVIEWER">REVIEWER</option>
                <option value="MANAGER">MANAGER</option>
              </select>

              <button
                type="submit"
                disabled={inviting || !inviteEmail.trim()}
                className="w-full sm:w-auto px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-md font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {inviting ? 'Generating...' : 'Create Invite Link'}
              </button>
            </div>

            {generatedInviteUrl && (
              <div className="p-3 bg-violet-50 border border-violet-200 rounded-md text-xs space-y-1">
                <div className="font-semibold text-violet-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-violet-700" />
                  Invitation Link Generated (Expires in 7 days):
                </div>
                <div className="font-mono text-[11px] text-violet-900 break-all select-all bg-white p-2 rounded border border-violet-200">
                  {generatedInviteUrl}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Section 2: Workspace Audit Log */}
        <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h2 className="text-sm font-semibold text-stone-950 flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-700" />
                Compliance & Workflow Audit Trail
              </h2>
              <p className="text-xs text-stone-500">
                Immutable, timestamped event log for every state transition, review, and release.
              </p>
            </div>
            <span className="text-xs font-mono text-stone-500">{auditEvents.length} recorded events</span>
          </div>

          <div className="overflow-x-auto border border-stone-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 font-mono uppercase text-[10px] text-stone-500 tracking-wider">
                <tr>
                  <th className="p-2.5">Timestamp</th>
                  <th className="p-2.5">Actor</th>
                  <th className="p-2.5">Action</th>
                  <th className="p-2.5">Target</th>
                  <th className="p-2.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                {auditEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-stone-50">
                    <td className="p-2.5 text-stone-500 whitespace-nowrap">
                      {new Date(evt.created_at).toLocaleString()}
                    </td>
                    <td className="p-2.5 text-stone-800 font-sans font-semibold">
                      {evt.actor_name || evt.actor_id}
                    </td>
                    <td className="p-2.5 text-violet-800 font-bold">{evt.action}</td>
                    <td className="p-2.5 text-stone-600">
                      {evt.target_type} ({evt.target_id.slice(0, 10)})
                    </td>
                    <td className="p-2.5 text-stone-500 font-sans max-w-xs truncate">
                      {evt.details ? JSON.stringify(evt.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Data Retention & Governance */}
        <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-3 shadow-2xs text-xs">
          <h2 className="text-sm font-semibold text-stone-950">Data Retention & Governance</h2>
          <p className="text-stone-600 leading-relaxed">
            LabelForge isolates all datasets per workspace. Uploaded records and schema versions are immutable once referenced by completed annotations. Published releases cannot be overwritten; new releases receive distinct cryptographic SHA-256 hashes.
          </p>
        </div>
      </main>
    </div>
  );
}
