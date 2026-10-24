'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';

export function ConflictDialog({
  isOpen,
  conflictData,
  onKeepDraft,
  onReloadServer,
}: {
  isOpen: boolean;
  conflictData: {
    currentRevision: number;
    storedAnswers: Record<string, any>;
    message?: string;
  } | null;
  onKeepDraft: () => void;
  onReloadServer: () => void;
}) {
  if (!isOpen || !conflictData) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-amber-300 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 pb-3 border-b border-amber-100">
          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-950">Concurrency Revision Conflict</h3>
            <p className="text-xs text-stone-500">
              The stored record was updated concurrently (Server is at revision {conflictData.currentRevision}).
            </p>
          </div>
        </div>

        <div className="py-4 space-y-3">
          <div className="text-xs text-stone-600 bg-amber-50/50 p-3 rounded-lg border border-amber-200/60">
            {conflictData.message ||
              'A newer draft or reviewer decision was committed while you were working. Please decide how to reconcile your changes.'}
          </div>

          <div className="text-xs">
            <div className="font-semibold text-stone-800 mb-1">Stored Server Answers:</div>
            <pre className="p-2.5 rounded bg-stone-100 text-stone-800 font-mono text-[11px] overflow-x-auto max-h-36">
              {JSON.stringify(conflictData.storedAnswers, null, 2)}
            </pre>
          </div>
        </div>

        <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onReloadServer}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload Server Version
          </button>

          <button
            type="button"
            onClick={onKeepDraft}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-violet-700 hover:bg-violet-800 rounded-md transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Keep My Current Draft
          </button>
        </div>
      </div>
    </div>
  );
}
