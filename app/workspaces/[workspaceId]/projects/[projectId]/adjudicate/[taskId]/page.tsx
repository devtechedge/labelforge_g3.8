'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { ProjectNav } from '@/components/ProjectNav';
import {
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Scale,
  Copy,
  Send,
  Info,
} from 'lucide-react';

export default function AdjudicationPage() {
  const params = useParams();
  const workspaceId = (params.workspaceId as string) || 'ws_core';
  const projectId = (params.projectId as string) || 'proj_feedback';
  const taskId = (params.taskId as string) || 'task_01';
  const router = useRouter();

  const [taskData, setTaskData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedAnswers, setResolvedAnswers] = useState<Record<string, any>>({});
  const [rationale, setRationale] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/tasks/${taskId}`)
      .then((res) => res.json())
      .then((data) => {
        setTaskData(data);
        if (data.allAnnotations && data.allAnnotations.length > 0) {
          // Pre-populate with first annotation or existing adjudication
          setResolvedAnswers(data.adjudication?.chosenAnswer || data.allAnnotations[0].answers || {});
          if (data.adjudication?.rationale) {
            setRationale(data.adjudication.rationale);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [taskId]);

  const adoptAnnotation = (answers: Record<string, any>, annotatorName: string) => {
    setResolvedAnswers({ ...answers });
    setRationale((prev) =>
      prev ? prev : `Adopted consensus evaluation submitted by ${annotatorName} based on technical rubric.`
    );
  };

  const handleResolve = async () => {
    if (!rationale.trim()) {
      setError('Please document an auditable adjudication rationale.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/tasks/${taskId}/adjudicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chosenAnswer: resolvedAnswers,
          rationale,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to adjudicate');
      }

      router.push(`/workspaces/${workspaceId}/projects/${projectId}/review`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fbfbfa]">
        <Header workspaceId={workspaceId} projectId={projectId} />
        <div className="p-8 text-center text-xs text-stone-400">Loading adjudication workbench...</div>
      </div>
    );
  }

  const annotations = taskData?.allAnnotations || [];
  const fields = taskData?.schema?.fields || [];

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa]">
      <Header workspaceId={workspaceId} projectId={projectId} />
      <ProjectNav workspaceId={workspaceId} projectId={projectId} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <Link
              href={`/workspaces/${workspaceId}/projects/${projectId}/review`}
              className="p-1.5 rounded-md border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-stone-950 flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-600" />
                Adjudication Workbench
              </h1>
              <p className="text-xs text-stone-500">
                Record ID: <span className="font-mono font-bold text-stone-800">{taskData?.task?.stableId}</span> · Disagreement Resolution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-amber-100 text-amber-900 rounded">
              {taskData?.task?.status}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-800">
            {error}
          </div>
        )}

        {/* Source Record Inspection */}
        <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-2">
          <div className="text-xs font-mono uppercase text-stone-400 tracking-wider">
            Source Record Under Dispute
          </div>
          <div className="p-4 bg-stone-50 rounded border border-stone-200 text-sm text-stone-900 leading-relaxed font-normal">
            {taskData?.task?.data?.review_text || taskData?.task?.data?.text || JSON.stringify(taskData?.task?.data)}
          </div>
        </div>

        {/* Conflicting Annotations Side-by-Side Comparison */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-900">
              Disputed Submissions ({annotations.length})
            </span>
            <span className="text-xs text-stone-500">
              Compare differences and click "Adopt" to copy answers into canonical resolution
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {annotations.map((ann: any, idx: number) => (
              <div key={ann.id} className="bg-white border border-stone-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-stone-900 text-white font-mono text-xs flex items-center justify-center font-bold">
                      {ann.annotator_avatar || `A${idx + 1}`}
                    </div>
                    <div>
                      <div className="font-semibold text-stone-900">{ann.annotator_name}</div>
                      <div className="text-[10px] text-stone-400 font-mono">Rev {ann.revision}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => adoptAnnotation(ann.answers, ann.annotator_name)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded border border-violet-200 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Adopt Answers</span>
                  </button>
                </div>

                {/* Values table */}
                <div className="space-y-2 text-xs">
                  {fields.map((f: any) => {
                    const val = ann.answers?.[f.name];
                    return (
                      <div key={f.id} className="flex items-start justify-between py-1 border-b border-stone-100/60">
                        <span className="text-stone-500 font-mono text-[11px]">{f.label || f.name}:</span>
                        <span className="font-semibold text-stone-900 text-right max-w-xs truncate">
                          {Array.isArray(val) ? (
                            f.type === 'text_span' ? (
                              val.map((s: any) => `"${s.text}"`).join('; ') || 'None'
                            ) : (
                              val.join(', ') || 'None'
                            )
                          ) : (
                            String(val ?? '—')
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resolved Canonical Answer & Auditable Rationale */}
        <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div>
              <h2 className="text-sm font-semibold text-stone-950">Canonical Resolution</h2>
              <p className="text-xs text-stone-500">
                Specify the final agreed-upon ground truth for this record.
              </p>
            </div>
            <span className="text-xs font-mono text-stone-400">IMMUTABLE UPON APPROVAL</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((field: any) => {
              if (field.type === 'single_choice') {
                return (
                  <div key={field.id} className="space-y-1 text-xs">
                    <label className="font-semibold text-stone-800">{field.label}</label>
                    <select
                      value={resolvedAnswers[field.name] || ''}
                      onChange={(e) =>
                        setResolvedAnswers({ ...resolvedAnswers, [field.name]: e.target.value })
                      }
                      className="w-full p-2 rounded-md border border-stone-200 bg-white text-stone-900 text-xs"
                    >
                      <option value="">Select option...</option>
                      {field.options?.map((opt: any) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }
              if (field.type === 'rating') {
                return (
                  <div key={field.id} className="space-y-1 text-xs">
                    <label className="font-semibold text-stone-800">{field.label}</label>
                    <input
                      type="number"
                      min={field.ratingConfig?.min || 1}
                      max={field.ratingConfig?.max || 5}
                      value={resolvedAnswers[field.name] || 1}
                      onChange={(e) =>
                        setResolvedAnswers({
                          ...resolvedAnswers,
                          [field.name]: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full p-2 rounded-md border border-stone-200 bg-white text-stone-900 text-xs"
                    />
                  </div>
                );
              }
              return null;
            })}
          </div>

          {/* Adjudication Rationale */}
          <div className="space-y-1 text-xs">
            <label className="font-semibold text-stone-800 flex items-center gap-1">
              Adjudication Rationale <span className="text-red-500">*</span>
            </label>
            <p className="text-[11px] text-stone-500">
              Explain why this answer was selected over the alternatives. Required for reproducibility and auditing.
            </p>
            <textarea
              rows={3}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="e.g. Firmware vs Hardware dispute resolved: Sleep wake-up green flicker is confirmed in errata notice #402 as display controller timing (Hardware/Display)..."
              className="w-full p-3 rounded-md border border-stone-200 bg-white text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
            <Link
              href={`/workspaces/${workspaceId}/projects/${projectId}/review`}
              className="px-4 py-2 text-xs text-stone-600 hover:text-stone-900"
            >
              Cancel
            </Link>
            <button
              type="button"
              disabled={submitting}
              onClick={handleResolve}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{submitting ? 'Resolving...' : 'Resolve & Approve Record'}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
