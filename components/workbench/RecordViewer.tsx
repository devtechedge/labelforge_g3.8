'use client';

import React, { useRef, useState } from 'react';
import { TextSpanAnnotation, SpanLabelOption } from '@/lib/domain/types';
import { Tag, Trash2, Plus, Info } from 'lucide-react';

export function RecordViewer({
  data,
  stableId,
  sourceOrder,
  spans = [],
  spanLabels = [],
  onAddSpan,
  onRemoveSpan,
  disabled = false,
}: {
  data: Record<string, any>;
  stableId: string;
  sourceOrder: number;
  spans?: TextSpanAnnotation[];
  spanLabels?: SpanLabelOption[];
  onAddSpan?: (span: TextSpanAnnotation) => void;
  onRemoveSpan?: (spanId: string) => void;
  disabled?: boolean;
}) {
  const textRef = useRef<HTMLDivElement>(null);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number; text: string } | null>(null);

  // Identify the primary narrative field (e.g. review_text, text, prompt, content, comment)
  const primaryFieldKey = Object.keys(data).find((k) =>
    ['review_text', 'text', 'content', 'body', 'comment', 'prompt', 'response'].includes(k.toLowerCase())
  ) || Object.keys(data)[0];

  const primaryText = String(data[primaryFieldKey] || '');

  const handleMouseUp = () => {
    if (disabled || !textRef.current || !onAddSpan) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setSelectionRange(null);
      return;
    }

    const range = selection.getRangeAt(0);
    // Ensure selection is inside our text container
    if (!textRef.current.contains(range.commonAncestorContainer)) {
      return;
    }

    const text = selection.toString().trim();
    if (text.length === 0) return;

    // Find offsets in primaryText
    const fullText = primaryText;
    const startIdx = fullText.indexOf(text);
    if (startIdx !== -1) {
      setSelectionRange({
        start: startIdx,
        end: startIdx + text.length,
        text,
      });
    }
  };

  const applySpanLabel = (labelOption: SpanLabelOption) => {
    if (!selectionRange || !onAddSpan) return;
    const newSpan: TextSpanAnnotation = {
      id: `sp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      start: selectionRange.start,
      end: selectionRange.end,
      label: labelOption.id,
      text: selectionRange.text,
    };
    onAddSpan(newSpan);
    setSelectionRange(null);
    window.getSelection()?.removeAllRanges();
  };

  // Render text with highlight marks
  const renderAnnotatedText = () => {
    if (!spans || spans.length === 0) {
      return <span>{primaryText}</span>;
    }

    // Sort spans by start
    const sortedSpans = [...spans].sort((a, b) => a.start - b.start);
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedSpans.forEach((span, idx) => {
      // Non-annotated chunk before span
      if (span.start > lastIndex) {
        elements.push(
          <span key={`text_${lastIndex}`}>
            {primaryText.slice(lastIndex, span.start)}
          </span>
        );
      }

      // Span label config
      const labelCfg = spanLabels.find((l) => l.id === span.label);
      const color = labelCfg?.color || '#7c3aed';

      // Highlighted chunk
      elements.push(
        <mark
          key={`span_${span.id || idx}`}
          style={{
            backgroundColor: `${color}25`,
            borderBottom: `2px solid ${color}`,
            color: '#1c1917',
          }}
          className="relative group rounded-xs px-0.5 py-0.5 font-medium transition-all"
        >
          {primaryText.slice(span.start, span.end)}
          <span
            style={{ backgroundColor: color }}
            className="inline-flex items-center gap-1 text-[10px] text-white px-1.5 py-0.2 rounded font-mono ml-1 align-baseline shadow-2xs"
          >
            {labelCfg?.label || span.label}
            {!disabled && onRemoveSpan && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveSpan(span.id);
                }}
                className="hover:text-stone-300 ml-0.5 cursor-pointer"
                title="Remove span"
              >
                ×
              </button>
            )}
          </span>
        </mark>
      );

      lastIndex = Math.max(lastIndex, span.end);
    });

    if (lastIndex < primaryText.length) {
      elements.push(
        <span key={`text_end_${lastIndex}`}>
          {primaryText.slice(lastIndex)}
        </span>
      );
    }

    return elements;
  };

  return (
    <div className="space-y-4">
      {/* Header bar for record */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
            {stableId}
          </span>
          <span className="text-xs text-stone-400 font-mono">Row #{sourceOrder}</span>
        </div>
        <div className="text-xs text-stone-500">
          Select text below with your cursor to extract evidence spans
        </div>
      </div>

      {/* Main Record Body */}
      <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs">
        <div className="text-xs font-mono uppercase text-stone-400 tracking-wider mb-2">
          {primaryFieldKey}
        </div>
        <div
          ref={textRef}
          onMouseUp={handleMouseUp}
          className="text-base text-stone-900 leading-relaxed font-normal selection:bg-violet-200 selection:text-stone-900"
        >
          {renderAnnotatedText()}
        </div>

        {/* Floating / Contextual Span Label Picker */}
        {selectionRange && !disabled && spanLabels.length > 0 && (
          <div className="mt-4 p-3 bg-stone-900 text-stone-100 rounded-lg flex flex-wrap items-center gap-2 shadow-lg animate-in fade-in duration-150">
            <span className="text-xs text-stone-400 font-mono mr-1">Apply Label:</span>
            {spanLabels.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => applySpanLabel(l)}
                style={{ backgroundColor: l.color }}
                className="px-2.5 py-1 rounded text-xs font-medium text-white hover:opacity-90 transition-opacity flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                {l.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectionRange(null)}
              className="text-xs text-stone-400 hover:text-stone-200 ml-2"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Other Record Metadata Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {Object.entries(data).map(([key, value]) => {
          if (key === primaryFieldKey) return null;
          return (
            <div key={key} className="bg-white border border-stone-200 rounded-md p-2.5">
              <div className="text-[10px] font-mono uppercase text-stone-400 tracking-wider">
                {key}
              </div>
              <div className="text-xs font-medium text-stone-800 mt-0.5 truncate">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Spans Summary List */}
      {spans.length > 0 && (
        <div className="bg-stone-50 border border-stone-200 rounded-md p-3">
          <div className="text-xs font-medium text-stone-700 mb-2 flex items-center justify-between">
            <span>Extracted Evidence Spans ({spans.length})</span>
          </div>
          <div className="space-y-1.5">
            {spans.map((s) => {
              const labelCfg = spanLabels.find((l) => l.id === s.label);
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between text-xs bg-white px-2.5 py-1.5 rounded border border-stone-200"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      style={{ backgroundColor: labelCfg?.color || '#7c3aed' }}
                      className="text-[10px] text-white px-1.5 py-0.5 rounded font-mono"
                    >
                      {labelCfg?.label || s.label}
                    </span>
                    <span className="text-stone-800 italic truncate max-w-md">"{s.text}"</span>
                    <span className="text-stone-400 text-[10px] font-mono">[{s.start}:{s.end}]</span>
                  </div>
                  {!disabled && onRemoveSpan && (
                    <button
                      type="button"
                      onClick={() => onRemoveSpan(s.id)}
                      className="text-stone-400 hover:text-red-600 p-1"
                      title="Delete span"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
