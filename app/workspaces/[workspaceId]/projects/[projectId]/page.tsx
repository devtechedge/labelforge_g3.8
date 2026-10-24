'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { ProjectNav } from '@/components/ProjectNav';
import {
  PenTool,
  ShieldCheck,
  Scale,
  UploadCloud,
  BarChart3,
  Package,
  Layers,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export default function ProjectDashboardPage() {
  const params = useParams();
  const workspaceId = (params.workspaceId as string) || 'ws_core';
  const projectId = (params.projectId as string) || 'proj_feedback';
  const router = useRouter();

  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((res) => res.json())
      .then((data) => setProjectData(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleStartAnnotating = async () => {
    try {
      const res = await fetch(`/api/tasks/next?projectId=${projectId}`);
      const data = await res.json();
      if (data.taskId) {
        router.push(`/workspaces/${workspaceId}/projects/${projectId}/annotate/${data.taskId}`);
      } else {
        router.push(`/workspaces/${workspaceId}/projects/${projectId}/tasks`);
      }
    } catch {
      router.push(`/workspaces/${workspaceId}/projects/${projectId}/tasks`);
    }
  };

  const counts = projectData?.taskCounts || {
    total: 0,
    unassigned: 0,
    inProgress: 0,
    inReview: 0,
    accepted: 0,
    returned: 0,
    disputed: 0,
  };

  const total = counts.total || 1;
  const pctAccepted = Math.round((counts.accepted / total) * 100);

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa]">
      <Header workspaceId={workspaceId} projectId={projectId} />
      <ProjectNav
        workspaceId={workspaceId}
        projectId={projectId}
        projectName={projectData?.project?.name}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Project Header Card */}
        <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs text-stone-400 uppercase tracking-wider">PROJECT</span>
                <span className="text-stone-300">·</span>
                <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded">
                  {projectData?.project?.redundancy_count === 2
                    ? 'Dual-Annotator Redundancy (Agreement Enabled)'
                    : 'Single Annotator Flow'}
                </span>
              </div>
              <h1 className="text-xl font-bold text-stone-950">
                {projectData?.project?.name || 'Customer Feedback Categorization'}
              </h1>
              <p className="text-xs text-stone-600 mt-1 max-w-3xl leading-relaxed">
                {projectData?.project?.description}
              </p>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleStartAnnotating}
                className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Start Annotating</span>
              </button>

              <Link
                href={`/workspaces/${workspaceId}/projects/${projectId}/review`}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 rounded-md text-xs font-semibold transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-violet-700" />
                <span>Review Queue ({counts.inReview})</span>
              </Link>
            </div>
          </div>

          {/* Progress Meter Bar */}
          <div className="pt-3 border-t border-stone-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-800">
                Workflow Progress ({counts.accepted} of {counts.total} completed)
              </span>
              <span className="font-mono font-bold text-stone-900">{pctAccepted}%</span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${(counts.accepted / total) * 100}%` }}
                className="bg-emerald-600"
                title={`Accepted: ${counts.accepted}`}
              />
              <div
                style={{ width: `${(counts.inReview / total) * 100}%` }}
                className="bg-blue-500"
                title={`In Review: ${counts.inReview}`}
              />
              <div
                style={{ width: `${(counts.disputed / total) * 100}%` }}
                className="bg-amber-500"
                title={`Disputed: ${counts.disputed}`}
              />
              <div
                style={{ width: `${(counts.returned / total) * 100}%` }}
                className="bg-red-400"
                title={`Returned: ${counts.returned}`}
              />
              <div
                style={{ width: `${(counts.inProgress / total) * 100}%` }}
                className="bg-violet-400"
                title={`In Progress: ${counts.inProgress}`}
              />
            </div>
          </div>
        </div>

        {/* Status Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-4 bg-white border border-stone-200 rounded-lg">
            <div className="text-[10px] font-mono text-stone-400 uppercase">Total Tasks</div>
            <div className="text-xl font-bold font-mono text-stone-900 mt-1">{counts.total}</div>
          </div>

          <div className="p-4 bg-white border border-stone-200 rounded-lg">
            <div className="text-[10px] font-mono text-stone-400 uppercase">Unassigned</div>
            <div className="text-xl font-bold font-mono text-stone-600 mt-1">{counts.unassigned}</div>
          </div>

          <div className="p-4 bg-white border border-stone-200 rounded-lg">
            <div className="text-[10px] font-mono text-violet-700 uppercase">In Progress</div>
            <div className="text-xl font-bold font-mono text-violet-950 mt-1">{counts.inProgress}</div>
          </div>

          <div className="p-4 bg-white border border-stone-200 rounded-lg">
            <div className="text-[10px] font-mono text-blue-700 uppercase">In Review</div>
            <div className="text-xl font-bold font-mono text-blue-950 mt-1">{counts.inReview}</div>
          </div>

          <div className="p-4 bg-white border border-amber-200 bg-amber-50/30 rounded-lg">
            <div className="text-[10px] font-mono text-amber-800 uppercase flex items-center justify-between">
              <span>Disputed</span>
              {counts.disputed > 0 && <span className="w-2 h-2 rounded-full bg-amber-500" />}
            </div>
            <div className="text-xl font-bold font-mono text-amber-950 mt-1">{counts.disputed}</div>
          </div>

          <div className="p-4 bg-white border border-emerald-200 bg-emerald-50/30 rounded-lg">
            <div className="text-[10px] font-mono text-emerald-800 uppercase">Accepted</div>
            <div className="text-xl font-bold font-mono text-emerald-950 mt-1">{counts.accepted}</div>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Review & Adjudication */}
          <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-2 text-stone-900 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4 text-violet-700" />
              <span>Review & Adjudication</span>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              Verify submitted annotator records, request targeted corrections, and adjudicate disputed items.
            </p>
            <div className="pt-2">
              <Link
                href={`/workspaces/${workspaceId}/projects/${projectId}/review`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 hover:text-violet-900"
              >
                <span>Open Review Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Quality & Inter-Annotator Agreement */}
          <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-2 text-stone-900 font-semibold text-sm">
              <BarChart3 className="w-4 h-4 text-violet-700" />
              <span>Quality & Agreement</span>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              Compute Cohen's Kappa, Multi-Label Jaccard, character span IoU, and review outcome distributions.
            </p>
            <div className="pt-2">
              <Link
                href={`/workspaces/${workspaceId}/projects/${projectId}/quality`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 hover:text-violet-900"
              >
                <span>View Agreement Metrics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Releases & Provenance */}
          <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-2 text-stone-900 font-semibold text-sm">
              <Package className="w-4 h-4 text-violet-700" />
              <span>Immutable Releases</span>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              Publish frozen dataset releases with SHA-256 provenance manifests, JSONL, and formula-safe CSV exports.
            </p>
            <div className="pt-2">
              <Link
                href={`/workspaces/${workspaceId}/projects/${projectId}/releases`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 hover:text-violet-900"
              >
                <span>Manage Releases ({projectData?.releases?.length || 0})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Dataset & Schema Versions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Active Schema */}
          <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="font-semibold text-stone-900">Current Schema Version</span>
              <span className="font-mono text-stone-500">v{projectData?.currentSchema?.version_num || 1}</span>
            </div>
            <div className="font-medium text-stone-800">{projectData?.currentSchema?.name}</div>
            <div className="text-stone-500 text-[11px]">
              Fields: {projectData?.currentSchema?.fields?.map((f: any) => f.label || f.name).join(', ')}
            </div>
            <div className="pt-2">
              <Link
                href={`/workspaces/${workspaceId}/projects/${projectId}/schema`}
                className="text-violet-700 hover:underline font-medium"
              >
                Configure schema or publish new version →
              </Link>
            </div>
          </div>

          {/* Dataset Version */}
          <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="font-semibold text-stone-900">Source Dataset Version</span>
              <span className="font-mono text-stone-500">v{projectData?.datasetVersions?.[0]?.version_num || 1}</span>
            </div>
            <div className="font-medium text-stone-800">
              {projectData?.datasetVersions?.[0]?.source_name || 'feedback_batch_2026.csv'}
            </div>
            <div className="text-stone-500 text-[11px] font-mono">
              Records: {projectData?.datasetVersions?.[0]?.record_count || 12} rows · SHA-256 Verified
            </div>
            <div className="pt-2">
              <Link
                href={`/workspaces/${workspaceId}/projects/${projectId}/import`}
                className="text-violet-700 hover:underline font-medium"
              >
                Import additional CSV or JSONL batches →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
