'use client';

import React, { useState } from 'react';
import { SchemaField, TextSpanAnnotation } from '@/lib/domain/types';
import { Check, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export function SchemaForm({
  fields,
  values,
  onChange,
  guidelines,
  disabled = false,
}: {
  fields: SchemaField[];
  values: Record<string, any>;
  onChange: (fieldName: string, value: any) => void;
  guidelines?: string;
  disabled?: boolean;
}) {
  const [showGuidelines, setShowGuidelines] = useState(false);

  return (
    <div className="space-y-6">
      {/* Guidelines Accordion */}
      {guidelines && (
        <div className="bg-stone-50 border border-stone-200 rounded-lg overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setShowGuidelines(!showGuidelines)}
            className="w-full px-3 py-2 flex items-center justify-between text-stone-700 hover:bg-stone-100 transition-colors font-medium cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
              Annotation Guidelines & Rubric
            </span>
            {showGuidelines ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showGuidelines && (
            <div className="px-3 py-2.5 border-t border-stone-200 text-stone-600 bg-white leading-relaxed whitespace-pre-wrap">
              {guidelines}
            </div>
          )}
        </div>
      )}

      {/* Dynamic Fields */}
      <div className="space-y-5">
        {fields.map((field) => {
          // If text_span, it is handled visually in RecordViewer; we can show span count here
          if (field.type === 'text_span') {
            const spans = (values[field.name] as TextSpanAnnotation[]) || [];
            return (
              <div key={field.id} className="border border-stone-200 rounded-lg p-3.5 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-900 flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <span className="text-[11px] font-mono text-stone-400">
                    {spans.length} {spans.length === 1 ? 'span' : 'spans'}
                  </span>
                </div>
                {field.description && (
                  <p className="text-[11px] text-stone-500 mb-2">{field.description}</p>
                )}
                <div className="text-[11px] text-stone-400 italic">
                  Highlight words directly in the record text on the left to extract spans.
                </div>
              </div>
            );
          }

          // Single Choice
          if (field.type === 'single_choice') {
            const currentValue = values[field.name];
            return (
              <div key={field.id} className="border border-stone-200 rounded-lg p-3.5 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-900 flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <span className="text-[10px] font-mono uppercase text-stone-400">Single Select</span>
                </div>
                {field.description && (
                  <p className="text-[11px] text-stone-500">{field.description}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {field.options?.map((opt) => {
                    const isSelected = currentValue === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(field.name, opt.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded-md border text-xs font-medium transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'border-violet-700 bg-violet-50/80 text-violet-950 font-semibold ring-1 ring-violet-700'
                            : 'border-stone-200 bg-white hover:border-stone-300 text-stone-800 hover:bg-stone-50'
                        } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          {opt.color && (
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: opt.color }}
                            />
                          )}
                          <span>{opt.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {opt.shortcut && (
                            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-stone-100 text-stone-500 rounded border border-stone-200">
                              {opt.shortcut}
                            </kbd>
                          )}
                          {isSelected && <Check className="w-3.5 h-3.5 text-violet-700" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }

          // Multi Choice
          if (field.type === 'multi_choice') {
            const currentSelected = Array.isArray(values[field.name]) ? values[field.name] : [];
            const toggleOption = (id: string) => {
              if (disabled) return;
              if (currentSelected.includes(id)) {
                onChange(
                  field.name,
                  currentSelected.filter((v: string) => v !== id)
                );
              } else {
                onChange(field.name, [...currentSelected, id]);
              }
            };

            return (
              <div key={field.id} className="border border-stone-200 rounded-lg p-3.5 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-900 flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <span className="text-[10px] font-mono uppercase text-stone-400">Multi-Select</span>
                </div>
                {field.description && (
                  <p className="text-[11px] text-stone-500">{field.description}</p>
                )}

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {field.options?.map((opt) => {
                    const isSelected = currentSelected.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggleOption(opt.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-violet-700 bg-violet-700 text-white font-semibold'
                            : 'border-stone-200 bg-white hover:border-stone-300 text-stone-700 hover:bg-stone-50'
                        } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        <span>{opt.label}</span>
                        {opt.shortcut && (
                          <span className={`text-[10px] font-mono ${isSelected ? 'text-violet-200' : 'text-stone-400'}`}>
                            [{opt.shortcut}]
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }

          // Rating
          if (field.type === 'rating') {
            const min = field.ratingConfig?.min || 1;
            const max = field.ratingConfig?.max || 5;
            const currentValue = Number(values[field.name]) || null;
            const labels = field.ratingConfig?.labels || {};

            const numbers: number[] = [];
            for (let i = min; i <= max; i++) numbers.push(i);

            return (
              <div key={field.id} className="border border-stone-200 rounded-lg p-3.5 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-900 flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <span className="text-[10px] font-mono uppercase text-stone-400">Rating {min}-{max}</span>
                </div>
                {field.description && (
                  <p className="text-[11px] text-stone-500">{field.description}</p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  {numbers.map((num) => {
                    const isSelected = currentValue === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(field.name, num)}
                        className={`flex-1 py-2 rounded-md border text-xs font-mono font-bold transition-all text-center cursor-pointer ${
                          isSelected
                            ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                            : 'border-stone-200 bg-white hover:border-stone-300 text-stone-800 hover:bg-stone-50'
                        } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>

                {/* Rating descriptive helper */}
                {currentValue && labels[currentValue] && (
                  <div className="text-[11px] font-medium text-stone-600 bg-stone-50 px-2 py-1 rounded">
                    Score {currentValue}: {labels[currentValue]}
                  </div>
                )}
              </div>
            );
          }

          // Text / Textarea
          if (field.type === 'text') {
            const currentValue = values[field.name] || '';
            return (
              <div key={field.id} className="border border-stone-200 rounded-lg p-3.5 bg-white space-y-2">
                <label className="text-xs font-semibold text-stone-900 flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.description && (
                  <p className="text-[11px] text-stone-500">{field.description}</p>
                )}
                <textarea
                  disabled={disabled}
                  rows={3}
                  value={currentValue}
                  onChange={(e) => onChange(field.name, e.target.value)}
                  placeholder={field.textConfig?.placeholder || 'Enter notes or justification...'}
                  className="w-full text-xs p-2.5 rounded-md border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white text-stone-900"
                />
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
