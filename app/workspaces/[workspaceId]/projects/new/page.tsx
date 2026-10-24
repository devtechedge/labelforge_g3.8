'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { FolderPlus, ArrowLeft } from 'lucide-react';

export default function NewProjectPage() {
  const params = useParams();
  const workspaceId = (params.workspaceId as string) || 'ws_core';
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [redundancyCount, setRedundancyCount] = useState<number>(2);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          name,
          description,
          redundancyCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      router.push(`/workspaces/${workspaceId}/projects/${data.projectId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa]">
      <Header workspaceId={workspaceId} />

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-stone-200">
          <Link
            href={`/workspaces/${workspaceId}`}
            className="p-1.5 rounded-md border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-stone-950 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-violet-700" />
              Create Annotation Project
            </h1>
            <p className="text-xs text-stone-500">
              Configure dataset schema policy, redundancy mode, and evaluation workflow.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-lg p-6 space-y-5 shadow-2xs">
          <div className="space-y-1 text-xs">
            <label className="font-semibold text-stone-800 block">Project Title *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. LLM Instruction Adherence & Factuality Evaluation"
              className="w-full text-xs p-2.5 rounded-md border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div className="space-y-1 text-xs">
            <label className="font-semibold text-stone-800 block">Description & Scope</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe dataset guidelines, quality goals, and domain objectives..."
              className="w-full text-xs p-2.5 rounded-md border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div className="space-y-2 text-xs">
            <label className="font-semibold text-stone-800 block">Redundancy & Quality Mode</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  redundancyCount === 1
                    ? 'border-violet-700 bg-violet-50/60 ring-1 ring-violet-700'
                    : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="redundancy"
                    checked={redundancyCount === 1}
                    onChange={() => setRedundancyCount(1)}
                  />
                  <span className="font-bold text-stone-900">Single Annotator (1x)</span>
                </div>
                <p className="text-[11px] text-stone-500 pl-5">
                  Standard throughput workflow. Each task is labeled once and submitted directly for review.
                </p>
              </label>

              <label
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  redundancyCount === 2
                    ? 'border-violet-700 bg-violet-50/60 ring-1 ring-violet-700'
                    : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="redundancy"
                    checked={redundancyCount === 2}
                    onChange={() => setRedundancyCount(2)}
                  />
                  <span className="font-bold text-stone-900">Dual Annotator (2x - Recommended)</span>
                </div>
                <p className="text-[11px] text-stone-500 pl-5">
                  Enables Cohen's Kappa, Multi-Label Jaccard, and automatic disagreement routing to adjudication.
                </p>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
            <Link
              href={`/workspaces/${workspaceId}`}
              className="px-4 py-2 text-xs text-stone-600 hover:text-stone-900"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-md transition-colors"
            >
              {creating ? 'Creating Project...' : 'Create Project'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
