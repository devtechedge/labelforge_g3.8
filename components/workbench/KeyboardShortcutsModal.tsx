'use client';

import React from 'react';
import { X, Command } from 'lucide-react';

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '1 – 9', desc: 'Select single choice option by position' },
    { key: 'd, b, s, a, e', desc: 'Toggle multi-select aspect categories' },
    { key: 'Ctrl + Enter', desc: 'Submit completed annotation' },
    { key: '[', desc: 'Navigate to previous record in sequence' },
    { key: ']', desc: 'Navigate to next record in sequence' },
    { key: '?', desc: 'Toggle this keyboard shortcut guide' },
    { key: 'Esc', desc: 'Dismiss modals or selection menus' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-stone-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Command className="w-4 h-4 text-stone-700" />
            <h3 className="text-sm font-semibold text-stone-950">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-3">
          {shortcuts.map((s) => (
            <div key={s.key} className="flex items-center justify-between text-xs">
              <span className="text-stone-600">{s.desc}</span>
              <kbd className="px-2 py-1 rounded bg-stone-100 border border-stone-200 font-mono text-stone-800 font-semibold text-[11px] shadow-2xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-stone-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
