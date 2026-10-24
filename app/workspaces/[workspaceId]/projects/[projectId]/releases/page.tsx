'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { ProjectNav } from '@/components/ProjectNav';
import {
  Package,
  Download,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function ReleasesPage() {
  const params = useParams();
  const workspaceId = (params.workspaceId as string) || 'ws_core';
  const projectId = (params.projectId as string) || 'proj_feedback';

  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [versionTag, setVersionTag] = useState('v1.1.0');
  const [showModal, setShowModal] = useState(false);
  const [selectedManifest, setSelectedManifest] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReleases = () => {
    setLoading(true);
    fetch(`/api/projects/${projectId}/releases`)
      .then((res) => res.json())
      .then((data) => setReleases(data.releases || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReleases();
  }, [projectId]);

  const handlePublishRelease = async () => {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/releases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionTag }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish release');
      }

      setShowModal(false);
      fetchReleases();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa]">
      <Header workspaceId={workspaceId} projectId={projectId} />
      <ProjectNav workspaceId={workspaceId} projectId={projectId} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Title & Action */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div>
            <h1 className="text-lg font-bold text-stone-950 flex items-center gap-2">
              <Package className="w-5 h-5 text-violet-700" />
              Dataset Releases & Provenance
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Immutable versioned releases with reproducible SHA-256 checksums and canonical exports.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-md text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Publish New Release</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
            {error}
          </div>
        )}

        {/* Releases List */}
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-xs text-stone-400">Loading releases...</div>
          ) : releases.length === 0 ? (
            <div className="p-12 text-center text-xs text-stone-400 italic bg-white rounded-lg border border-stone-200">
              No releases published yet. Complete and accept tasks to publish v1.0.0.
            </div>
          ) : (
            releases.map((rel) => {
              const manifest = rel.manifest || {};
              return (
                <div
                  key={rel.id}
                  className="bg-white border border-stone-200 rounded-lg p-5 space-y-4 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-base font-bold text-stone-950 bg-stone-100 px-2.5 py-1 rounded">
                        {rel.version_tag}
                      </span>
                      <span className="text-xs text-stone-500 font-mono">
                        ID: {rel.id}
                      </span>
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Immutable
                      </span>
                    </div>

                    <div className="text-xs text-stone-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(rel.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 bg-stone-50 rounded-md">
                      <div className="text-[10px] font-mono text-stone-400 uppercase">Records Released</div>
                      <div className="text-lg font-bold font-mono text-stone-900 mt-0.5">
                        {rel.record_count} items
                      </div>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-md">
                      <div className="text-[10px] font-mono text-stone-400 uppercase">Schema Version</div>
                      <div className="text-lg font-bold font-mono text-stone-900 mt-0.5">
                        Schema v{manifest.schemaVersion || 1}
                      </div>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-md">
                      <div className="text-[10px] font-mono text-stone-400 uppercase">Selection Policy</div>
                      <div className="text-xs font-semibold text-stone-800 mt-1 font-mono truncate">
                        {manifest.selectionPolicy || 'ACCEPTED_ONLY'}
                      </div>
                    </div>
                  </div>

                  {/* SHA-256 Checksum Display */}
                  <div className="p-2.5 bg-stone-900 text-stone-100 rounded-md font-mono text-[11px] flex items-center justify-between">
                    <span className="text-stone-400 mr-2 shrink-0">SHA-256:</span>
                    <span className="truncate text-stone-200">{rel.checksum}</span>
                  </div>

                  {/* Export Download Buttons */}
                  <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedManifest(manifest)}
                      className="text-xs font-medium text-stone-600 hover:text-stone-950 flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileCode className="w-4 h-4 text-stone-400" />
                      <span>Inspect Provenance Manifest</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <a
                        href={`/api/releases/${rel.id}/export?format=jsonl`}
                        download
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md text-xs font-medium transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export JSONL</span>
                      </a>

                      <a
                        href={`/api/releases/${rel.id}/export?format=csv`}
                        download
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-700 hover:bg-violet-800 text-white rounded-md text-xs font-medium transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV (Safe Formula)</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Publish Release Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-semibold text-stone-950">Publish Immutable Dataset Release</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              This creates a frozen, reproducible snapshot containing all currently accepted and adjudicated records.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-800 block">Release Version Tag</label>
              <input
                type="text"
                value={versionTag}
                onChange={(e) => setVersionTag(e.target.value)}
                placeholder="e.g. v1.1.0"
                className="w-full text-xs p-2.5 rounded-md border border-stone-200 font-mono text-stone-900 bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={publishing}
                onClick={handlePublishRelease}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-md disabled:opacity-50"
              >
                {publishing ? 'Publishing & Computing Hash...' : 'Publish Release'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manifest Viewer Modal */}
      {selectedManifest && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-stone-200 shadow-2xl max-w-xl w-full p-6 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="text-sm font-semibold text-stone-950">Provenance Manifest</h3>
              <button
                onClick={() => setSelectedManifest(null)}
                className="text-stone-400 hover:text-stone-700 text-sm p-1"
              >
                ×
              </button>
            </div>
            <pre className="p-3 bg-stone-900 text-stone-100 rounded-lg text-[11px] font-mono overflow-x-auto max-h-80">
              {JSON.stringify(selectedManifest, null, 2)}
            </pre>
            <div className="text-right pt-2 border-t border-stone-100">
              <button
                onClick={() => setSelectedManifest(null)}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-xs font-medium text-stone-800 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
