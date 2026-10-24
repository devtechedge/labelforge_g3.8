'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { ProjectNav } from '@/components/ProjectNav';
import { TaskQueue } from '@/components/workbench/TaskQueue';
import { RecordViewer } from '@/components/workbench/RecordViewer';
import { SchemaForm } from '@/components/workbench/SchemaForm';
import { KeyboardShortcutsModal } from '@/components/workbench/KeyboardShortcutsModal';
import { ConflictDialog } from '@/components/workbench/ConflictDialog';
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  List,
  X,
} from 'lucide-react';
import { TextSpanAnnotation, TaskStatus } from '@/lib/domain/types';

export default function AnnotationWorkbenchPage() {
  const params = useParams();
  const workspaceId = (params.workspaceId as string) || 'ws_core';
  const projectId = (params.projectId as string) || 'proj_feedback';
  const taskId = (params.taskId as string) || 'task_01';
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [taskData, setTaskData] = useState<any>(null);
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [revision, setRevision] = useState(1);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'conflict'>('saved');
  const [conflictData, setConflictData] = useState<any>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [mobileQueueOpen, setMobileQueueOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedAnswersRef = useRef<string>('');

  // 1. Fetch Task and Schema
  const fetchTask = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) {
        throw new Error(`Failed to load task: ${res.statusText}`);
      }
      const data = await res.json();
      setTaskData(data);

      const initialAnswers = data.myAnnotation?.answers || {};
      setAnswers(initialAnswers);
      lastSavedAnswersRef.current = JSON.stringify(initialAnswers);
      setRevision(data.myAnnotation?.revision || data.task.revision || 1);
      setSaveStatus('saved');
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  // 2. Fetch Tasks list for queue sidebar
  const fetchTasksList = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setTasksList(data.tasks || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTask();
    fetchTasksList();
  }, [fetchTask, fetchTasksList]);

  // 3. Draft Autosave function
  const triggerAutosave = useCallback(
    async (currentAnswers: Record<string, any>, currentRevision: number) => {
      setSaveStatus('saving');
      try {
        const res = await fetch(`/api/tasks/${taskId}/draft`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: currentAnswers,
            expectedRevision: currentRevision,
          }),
        });

        if (res.status === 409) {
          const conflict = await res.json();
          setSaveStatus('conflict');
          setConflictData(conflict);
          return;
        }

        if (!res.ok) {
          throw new Error('Autosave failed');
        }

        const data = await res.json();
        setRevision(data.revision);
        lastSavedAnswersRef.current = JSON.stringify(currentAnswers);
        setSaveStatus('saved');
      } catch (err) {
        console.error(err);
        setSaveStatus('error');
      }
    },
    [taskId]
  );

  // 4. Update Answer handler with debounce
  const handleAnswerChange = (fieldName: string, value: any) => {
    const updated = { ...answers, [fieldName]: value };
    setAnswers(updated);
    setSaveStatus('idle');

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      triggerAutosave(updated, revision);
    }, 1200);
  };

  // 5. Text Span Handlers
  const textSpanField = taskData?.schema?.fields?.find((f: any) => f.type === 'text_span');
  const textSpanFieldName = textSpanField?.name || 'evidence_spans';
  const currentSpans = (answers[textSpanFieldName] as TextSpanAnnotation[]) || [];

  const handleAddSpan = (newSpan: TextSpanAnnotation) => {
    const updatedSpans = [...currentSpans, newSpan];
    handleAnswerChange(textSpanFieldName, updatedSpans);
  };

  const handleRemoveSpan = (spanId: string) => {
    const updatedSpans = currentSpans.filter((s) => s.id !== spanId);
    handleAnswerChange(textSpanFieldName, updatedSpans);
  };

  // 6. Submit Annotation
  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/tasks/${taskId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          expectedRevision: revision,
        }),
      });

      if (res.status === 409) {
        const conflict = await res.json();
        setConflictData(conflict);
        setSaveStatus('conflict');
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Submission failed');
      }

      const outcome = await res.json();
      setSuccessMessage(`Annotation successfully submitted (Status: ${outcome.status}).`);
      setRevision(outcome.revision);

      // Refresh task
      await fetchTask();
      await fetchTasksList();

      // If next task exists, navigate after brief moment
      if (taskData?.nextTaskId) {
        setTimeout(() => {
          router.push(`/workspaces/${workspaceId}/projects/${projectId}/annotate/${taskData.nextTaskId}`);
        }, 800);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 7. Keyboard Navigation & Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in a textarea or input
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          handleSubmit();
        }
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      } else if (e.key === '[') {
        if (taskData?.prevTaskId) {
          e.preventDefault();
          router.push(`/workspaces/${workspaceId}/projects/${projectId}/annotate/${taskData.prevTaskId}`);
        }
      } else if (e.key === ']') {
        if (taskData?.nextTaskId) {
          e.preventDefault();
          router.push(`/workspaces/${workspaceId}/projects/${projectId}/annotate/${taskData.nextTaskId}`);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        // Number keys 1-9 for single choice
        const singleChoiceField = taskData?.schema?.fields?.find((f: any) => f.type === 'single_choice');
        if (singleChoiceField && singleChoiceField.options) {
          const num = parseInt(e.key, 10);
          if (num >= 1 && num <= singleChoiceField.options.length) {
            e.preventDefault();
            const chosen = singleChoiceField.options[num - 1];
            handleAnswerChange(singleChoiceField.name, chosen.id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [taskData, answers, revision, workspaceId, projectId, router]);

  // Conflict handling actions
  const handleKeepDraft = () => {
    if (conflictData) {
      setRevision(conflictData.currentRevision);
      setConflictData(null);
      triggerAutosave(answers, conflictData.currentRevision);
    }
  };

  const handleReloadServer = () => {
    if (conflictData) {
      setAnswers(conflictData.storedAnswers || {});
      lastSavedAnswersRef.current = JSON.stringify(conflictData.storedAnswers || {});
      setRevision(conflictData.currentRevision);
      setConflictData(null);
      setSaveStatus('saved');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa]">
      <Header workspaceId={workspaceId} projectId={projectId} />
      <ProjectNav
        workspaceId={workspaceId}
        projectId={projectId}
        projectName={taskData?.task?.projectName}
        activeTaskId={taskId}
      />

      {/* Main Workbench Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Task Queue Sidebar (Desktop) */}
        <TaskQueue
          tasks={tasksList}
          activeTaskId={taskId}
          workspaceId={workspaceId}
          projectId={projectId}
          className="hidden md:flex"
        />

        {/* Mobile Task Queue Drawer Modal */}
        {mobileQueueOpen && (
          <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex md:hidden">
            <div className="bg-white w-72 h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="p-3 border-b border-stone-200 flex items-center justify-between bg-stone-50">
                <span className="text-xs font-bold text-stone-900">Task Queue</span>
                <button
                  type="button"
                  onClick={() => setMobileQueueOpen(false)}
                  className="p-1 rounded text-stone-500 hover:text-stone-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <TaskQueue
                  tasks={tasksList}
                  activeTaskId={taskId}
                  workspaceId={workspaceId}
                  projectId={projectId}
                  className="w-full border-r-0"
                />
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileQueueOpen(false)} />
          </div>
        )}

        {/* Center & Right: Workbench Canvas */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Top Workbench Action Bar */}
          <div className="bg-white border-b border-stone-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between sticky top-0 z-20 gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Queue Toggle */}
              <button
                type="button"
                onClick={() => setMobileQueueOpen(true)}
                className="md:hidden p-1.5 rounded-md border border-stone-200 text-stone-700 hover:bg-stone-100 flex items-center gap-1 text-xs cursor-pointer"
                title="Open Task Queue"
              >
                <List className="w-4 h-4" />
                <span className="font-mono text-[11px]">({tasksList.length})</span>
              </button>

              {/* Previous Record */}
              <button
                type="button"
                disabled={!taskData?.prevTaskId}
                onClick={() =>
                  router.push(`/workspaces/${workspaceId}/projects/${projectId}/annotate/${taskData.prevTaskId}`)
                }
                className="p-1.5 rounded-md border border-stone-200 text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Previous Record ([)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Task Title & Status */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-stone-900">
                  {taskData?.task?.stableId || taskId}
                </span>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                  taskData?.task?.status === 'ACCEPTED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : taskData?.task?.status === 'DISPUTED'
                    ? 'bg-amber-100 text-amber-800'
                    : taskData?.task?.status === 'RETURNED_FOR_CORRECTION'
                    ? 'bg-red-100 text-red-800'
                    : taskData?.task?.status === 'SUBMITTED'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-stone-100 text-stone-700'
                }`}>
                  {taskData?.task?.status?.replace(/_/g, ' ') || 'ASSIGNED'}
                </span>
              </div>

              {/* Next Record */}
              <button
                type="button"
                disabled={!taskData?.nextTaskId}
                onClick={() =>
                  router.push(`/workspaces/${workspaceId}/projects/${projectId}/annotate/${taskData.nextTaskId}`)
                }
                className="p-1.5 rounded-md border border-stone-200 text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Next Record (])"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="h-4 w-[1px] bg-stone-200 mx-1 hidden sm:block" />

              {/* Revision and Autosave Indicator */}
              <div className="flex items-center gap-2 text-xs text-stone-500 font-mono">
                <span className="hidden sm:inline">REV: {revision}</span>
                <span className="text-stone-300 hidden sm:inline">·</span>
                {saveStatus === 'saving' && (
                  <span className="flex items-center gap-1 text-stone-600">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Autosaving...</span>
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>All changes saved</span>
                  </span>
                )}
                {saveStatus === 'idle' && <span className="text-stone-400">Unsaved edits</span>}
                {saveStatus === 'conflict' && (
                  <span className="flex items-center gap-1 text-amber-600 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Revision conflict</span>
                  </span>
                )}
              </div>
            </div>

            {/* Right Action buttons */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowShortcuts(true)}
                className="p-1.5 text-stone-500 hover:text-stone-900 rounded-md hover:bg-stone-100 cursor-pointer"
                title="Keyboard Shortcuts (?)"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-violet-700 hover:bg-violet-800 disabled:opacity-50 rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Submitting...' : 'Submit Annotation'}</span>
              </button>
            </div>
          </div>

          {/* Messages Banner */}
          {errorMessage && (
            <div className="bg-red-50 border-b border-red-200 px-6 py-2.5 text-xs text-red-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-800 text-sm">
                ×
              </button>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs text-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
              <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-800 text-sm">
                ×
              </button>
            </div>
          )}

          {/* Returned For Correction Reviewer Feedback Banner */}
          {taskData?.task?.status === 'RETURNED_FOR_CORRECTION' && taskData?.reviews?.[0] && (
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-amber-950">
                    Reviewer Feedback ({taskData.reviews[0].reviewer_name || 'Reviewer'}):
                  </div>
                  <div className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                    {taskData.reviews[0].feedback}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main 2-column view (Left: Record, Right: Schema Form) */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl">
            {/* Left 7 cols: Record Viewer */}
            <div className="lg:col-span-7">
              {loading ? (
                <div className="h-64 rounded-lg bg-stone-100 animate-pulse flex items-center justify-center text-xs text-stone-400">
                  Loading record...
                </div>
              ) : taskData?.task ? (
                <RecordViewer
                  data={taskData.task.data || {}}
                  stableId={taskData.task.stableId}
                  sourceOrder={taskData.task.sourceOrder}
                  spans={currentSpans}
                  spanLabels={textSpanField?.spanLabels || []}
                  onAddSpan={handleAddSpan}
                  onRemoveSpan={handleRemoveSpan}
                />
              ) : (
                <div className="p-6 text-center text-xs text-stone-500">Task not found</div>
              )}
            </div>

            {/* Right 5 cols: Schema Form */}
            <div className="lg:col-span-5">
              {loading ? (
                <div className="h-64 rounded-lg bg-stone-100 animate-pulse" />
              ) : taskData?.schema ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <span className="text-xs font-semibold text-stone-900">
                      {taskData.schema.name} (v{taskData.schema.version})
                    </span>
                    <span className="text-[11px] font-mono text-stone-400">
                      {taskData.schema.fields?.length || 0} fields
                    </span>
                  </div>

                  <SchemaForm
                    fields={taskData.schema.fields || []}
                    values={answers}
                    onChange={handleAnswerChange}
                    guidelines={taskData.schema.guidelines}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Optimistic Concurrency Conflict Dialog */}
      <ConflictDialog
        isOpen={saveStatus === 'conflict'}
        conflictData={conflictData}
        onKeepDraft={handleKeepDraft}
        onReloadServer={handleReloadServer}
      />
    </div>
  );
}
