'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { ProjectNav } from '@/components/ProjectNav';
import {
  CheckCircle,
  RotateCcw,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Send,
  User,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ReviewDecision } from '@/lib/domain/types';

export default function ReviewQueuePage() {
  const params = useParams();
  const workspaceId = (params.workspaceId as string) || 'ws_core';
  const projectId = (params.projectId as string) || 'proj_feedback';
  const router = useRouter();

  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [decisionModal, setDecisionModal] = useState<ReviewDecision | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchReviewQueue = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch tasks in reviewable statuses
      const res = await fetch(`/api/projects/${projectId}/tasks?limit=100`);
      if (res.ok) {
        const data = await res.json();
        const reviewable = (data.tasks || []).filter((t: any) =>
          ['SUBMITTED', 'IN_REVIEW', 'RETURNED_FOR_CORRECTION', 'DISPUTED'].includes(t.status)
        );
        setTasks(reviewable);
        if (reviewable.length > 0) {
          loadTaskDetails(reviewable[0].id);
        } else {
          setSelectedTask(null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadTaskDetails = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTask(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchReviewQueue();
  }, [fetchReviewQueue]);

  const handleReviewDecision = async (decision: ReviewDecision) => {
    if (!selectedTask || !selectedTask.allAnnotations?.[0]) return;
    const annotationId = selectedTask.allAnnotations[0].id;

    setIsSubmitting(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/annotations/${annotationId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          feedback,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit review');
      }

      setActionMessage(`Review recorded: ${decision}`);
      setDecisionModal(null);
      setFeedback('');

      // Refresh queue
      await fetchReviewQueue();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa]">
      <Header workspaceId={workspaceId} projectId={projectId} />
      <ProjectNav workspaceId={workspaceId} projectId={projectId} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-6">
          <div>
            <h1 className="text-lg font-bold text-stone-950 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-violet-700" />
              Review Queue
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Validate annotator submissions, request corrections, or dispute records for adjudication.
            </p>
          </div>
          <div className="text-xs font-mono text-stone-600 bg-stone-100 px-3 py-1.5 rounded-md">
            Pending Reviews: <span className="font-bold text-stone-900">{tasks.length}</span>
          </div>
        </div>

        {actionMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-md">
            {actionMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Tasks List */}
          <div className="lg:col-span-4 bg-white border border-stone-200 rounded-lg p-3 space-y-2 max-h-[750px] overflow-y-auto">
            <div className="text-xs font-semibold text-stone-800 px-2 py-1">
              Submissions Awaiting Decision
            </div>

            {loading ? (
              <div className="p-4 text-xs text-stone-400">Loading review queue...</div>
            ) : tasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400 italic">
                No pending submissions in the review queue.
              </div>
            ) : (
              tasks.map((t) => {
                const isSelected = selectedTask?.task?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => loadTaskDetails(t.id)}
                    className={`w-full text-left p-3 rounded-md border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border-stone-900 bg-stone-50 shadow-xs'
                        : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-semibold text-stone-900">{t.stable_id}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                        t.status === 'DISPUTED' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-600 line-clamp-2">
                      {t.data?.review_text || t.data?.text || JSON.stringify(t.data)}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Detailed Review Comparison */}
          <div className="lg:col-span-8">
            {selectedTask ? (
              <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-6">
                {/* Task Header */}
                <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-stone-900 bg-stone-100 px-2.5 py-1 rounded">
                      {selectedTask.task.stableId}
                    </span>
                    <span className="text-xs text-stone-500 font-mono">
                      Revision: {selectedTask.task.revision}
                    </span>
                  </div>

                  {selectedTask.task.status === 'DISPUTED' && (
                    <Link
                      href={`/workspaces/${workspaceId}/projects/${projectId}/adjudicate/${selectedTask.task.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 transition-colors"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                      <span>Resolve in Adjudication</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                {/* Source Record Text */}
                <div className="space-y-2">
                  <div className="text-xs font-mono uppercase text-stone-400 tracking-wider">
                    Source Text
                  </div>
                  <div className="p-4 rounded-lg bg-stone-50 border border-stone-200 text-sm text-stone-900 leading-relaxed">
                    {selectedTask.task.data?.review_text || selectedTask.task.data?.text || JSON.stringify(selectedTask.task.data)}
                  </div>
                </div>

                {/* Submissions Section */}
                <div className="space-y-3">
                  <div className="text-xs font-mono uppercase text-stone-400 tracking-wider">
                    Annotator Submissions ({selectedTask.allAnnotations?.length || 0})
                  </div>

                  {selectedTask.allAnnotations?.map((ann: any, idx: number) => (
                    <div key={ann.id} className="border border-stone-200 rounded-lg p-4 bg-stone-50/50 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-stone-200/80 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-violet-700 text-white font-mono text-[10px] flex items-center justify-center font-bold">
                            {ann.annotator_avatar || 'A'}
                          </div>
                          <span className="font-semibold text-stone-900">{ann.annotator_name}</span>
                          <span className="text-[11px] font-mono text-stone-400">
                            Rev {ann.revision} {ann.isDraft ? '(Draft)' : '(Submitted)'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-stone-400">{ann.submitted_at || ann.updated_at}</span>
                      </div>

                      {/* Render Answers */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {Object.entries(ann.answers || {}).map(([key, val]) => (
                          <div key={key} className="bg-white p-2.5 rounded border border-stone-200">
                            <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wider block">
                              {key}
                            </span>
                            <span className="font-medium text-stone-900 mt-0.5 block">
                              {Array.isArray(val) ? (
                                key.includes('spans') ? (
                                  val.map((s: any) => `"${s.text}" [${s.label}]`).join('; ') || 'None'
                                ) : (
                                  val.join(', ') || 'None'
                                )
                              ) : (
                                String(val)
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reviewer Action Buttons */}
                <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleReviewDecision('PASS')}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Pass (Accept)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setDecisionModal('RETURN_FOR_CORRECTION')}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Return for Correction</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setDecisionModal('REJECT')}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-red-900 bg-red-100 hover:bg-red-200 rounded-md transition-colors cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleReviewDecision('REQUEST_ADJUDICATION')}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4 text-stone-500" />
                    <span>Request Adjudication</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-stone-200 rounded-lg p-12 text-center text-xs text-stone-400">
                Select a submission on the left to review.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Return for Correction / Reject Feedback Modal */}
      {decisionModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-semibold text-stone-950">
              {decisionModal === 'RETURN_FOR_CORRECTION' ? 'Return Submission for Correction' : 'Reject Submission'}
            </h3>
            <p className="text-xs text-stone-500">
              Provide actionable guidance to the annotator explaining what must be corrected.
            </p>
            <textarea
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Please re-check the missing span between character 24 and 58..."
              className="w-full text-xs p-3 rounded-md border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDecisionModal(null)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting || !feedback.trim()}
                onClick={() => handleReviewDecision(decisionModal)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-md"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
