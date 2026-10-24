'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import {
  Building,
  Plus,
  ArrowRight,
  FolderKanban,
  Users,
  Settings,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export default function WorkspaceCatalogPage() {
  const params = useParams();
  const workspaceId = (params.workspaceId as string) || 'ws_core';

  const [workspaceData, setWorkspaceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/workspaces/${workspaceId}`)
      .then((res) => res.json())
      .then((data) => setWorkspaceData(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const stats = workspaceData?.stats || {
    total: 0,
    unassigned: 0,
    inProgress: 0,
    inReview: 0,
    disputed: 0,
    accepted: 0,
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa]">
      <Header workspaceId={workspaceId} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Workspace Title & Settings Link */}
        <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs text-stone-400 uppercase tracking-wider">WORKSPACE</span>
                <span className="text-stone-300">·</span>
                <span className="font-mono text-xs text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                  ROLE: {workspaceData?.userRole || 'OWNER'}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-stone-950">
                {workspaceData?.workspace?.name || 'Acme Research & AI Systems'}
              </h1>
              <p className="text-xs text-stone-500 mt-1">
                Workspace Slug: <span className="font-mono">{workspaceData?.workspace?.slug}</span> · ID: <span className="font-mono">{workspaceId}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/workspaces/${workspaceId}/settings`}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 rounded-md text-xs font-semibold transition-colors"
              >
                <Settings className="w-4 h-4 text-stone-500" />
                <span>Settings & Audit</span>
              </Link>

              <Link
                href={`/workspaces/${workspaceId}/projects/new`}
                className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </Link>
            </div>
          </div>

          {/* Aggregate Workload Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 mt-4 border-t border-stone-100 text-xs">
            <div className="p-3 bg-stone-50 rounded-md">
              <div className="text-[10px] font-mono text-stone-400 uppercase">Total Tasks</div>
              <div className="text-lg font-bold font-mono text-stone-900 mt-0.5">{stats.total}</div>
            </div>
            <div className="p-3 bg-stone-50 rounded-md">
              <div className="text-[10px] font-mono text-stone-400 uppercase">In Progress</div>
              <div className="text-lg font-bold font-mono text-violet-950 mt-0.5">{stats.inProgress}</div>
            </div>
            <div className="p-3 bg-stone-50 rounded-md">
              <div className="text-[10px] font-mono text-stone-400 uppercase">In Review</div>
              <div className="text-lg font-bold font-mono text-blue-950 mt-0.5">{stats.inReview}</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-md border border-amber-200/60">
              <div className="text-[10px] font-mono text-amber-800 uppercase">Disputed</div>
              <div className="text-lg font-bold font-mono text-amber-950 mt-0.5">{stats.disputed}</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-md border border-emerald-200/60">
              <div className="text-[10px] font-mono text-emerald-800 uppercase">Accepted</div>
              <div className="text-lg font-bold font-mono text-emerald-950 mt-0.5">{stats.accepted}</div>
            </div>
          </div>
        </div>

        {/* Projects Catalogue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-900">Annotation Projects ({workspaceData?.projects?.length || 0})</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workspaceData?.projects?.map((proj: any) => (
              <Link
                key={proj.id}
                href={`/workspaces/${workspaceId}/projects/${proj.id}`}
                className="p-5 rounded-lg border border-stone-200 bg-white hover:border-stone-400 hover:shadow-xs transition-all flex flex-col justify-between group space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs text-stone-400">{proj.id}</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                      {proj.redundancy_count === 2 ? 'Dual-Annotator Redundancy' : 'Single Annotator'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-stone-950 group-hover:text-violet-700 transition-colors">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                    {proj.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-mono text-stone-500">
                  <div>
                    <span className="font-bold text-stone-900">{proj.completed_tasks || 0}</span> / {proj.total_tasks || 0} tasks accepted
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-stone-800 group-hover:text-stone-950 font-sans">
                    <span>Open Project</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
