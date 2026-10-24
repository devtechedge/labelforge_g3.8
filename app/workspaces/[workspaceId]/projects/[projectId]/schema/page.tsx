'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { ProjectNav } from '@/components/ProjectNav';
import {
  FileCode,
  Plus,
  Trash2,
  CheckCircle2,
  Layers,
  HelpCircle,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { SchemaField, SchemaFieldType } from '@/lib/domain/types';

export default function SchemaEditorPage() {
  const params = useParams();
  const workspaceId = (params.workspaceId as string) || 'ws_core';
  const projectId = (params.projectId as string) || 'proj_feedback';

  const [schemas, setSchemas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [schemaName, setSchemaName] = useState('Feedback Rubric v2');
  const [guidelines, setGuidelines] = useState('');
  const [fields, setFields] = useState<SchemaField[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const fetchSchemas = () => {
    setLoading(true);
    fetch(`/api/projects/${projectId}/schemas`)
      .then((res) => res.json())
      .then((data) => {
        setSchemas(data.schemas || []);
        if (data.schemas && data.schemas.length > 0) {
          const current = data.schemas[0];
          setFields(current.fields || []);
          setGuidelines(current.guidelines || '');
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSchemas();
  }, [projectId]);

  const addField = (type: SchemaFieldType) => {
    const newField: SchemaField = {
      id: `f_${Date.now()}`,
      name: `field_${fields.length + 1}`,
      label: `New ${type.replace(/_/g, ' ')} Field`,
      type,
      required: false,
      options:
        type === 'single_choice' || type === 'multi_choice'
          ? [
              { id: 'opt_1', label: 'Option 1', shortcut: '1' },
              { id: 'opt_2', label: 'Option 2', shortcut: '2' },
            ]
          : undefined,
      spanLabels:
        type === 'text_span'
          ? [
              { id: 'defect', label: 'Defect Issue', color: '#d97706' },
              { id: 'praise', label: 'Praise Feature', color: '#7c3aed' },
            ]
          : undefined,
      ratingConfig: type === 'rating' ? { min: 1, max: 5 } : undefined,
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<SchemaField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handlePublish = async () => {
    setPublishing(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/schemas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: schemaName,
          fields,
          guidelines,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish schema');
      }

      setMessage(`Published immutable Schema Version ${data.versionNum}!`);
      fetchSchemas();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa]">
      <Header workspaceId={workspaceId} projectId={projectId} />
      <ProjectNav workspaceId={workspaceId} projectId={projectId} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Title */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div>
            <h1 className="text-lg font-bold text-stone-950 flex items-center gap-2">
              <FileCode className="w-5 h-5 text-violet-700" />
              Annotation Schema & Guidelines
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Define immutable schema versions. Existing task annotations remain bound to their creation version.
            </p>
          </div>

          <button
            type="button"
            disabled={publishing || fields.length === 0}
            onClick={handlePublish}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-md text-xs font-semibold disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Publish New Version</span>
          </button>
        </div>

        {message && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-md flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Published Versions History */}
          <div className="lg:col-span-4 bg-white border border-stone-200 rounded-lg p-4 space-y-3">
            <div className="text-xs font-semibold text-stone-900 pb-2 border-b border-stone-100">
              Published Schema Versions ({schemas.length})
            </div>

            <div className="space-y-2">
              {schemas.map((s) => (
                <div key={s.id} className="p-3 bg-stone-50 rounded-md border border-stone-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-stone-900">v{s.version_num}</span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      Immutable
                    </span>
                  </div>
                  <div className="font-medium text-stone-800">{s.name}</div>
                  <div className="text-[11px] text-stone-500 font-mono">
                    {s.fields?.length || 0} fields defined
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Schema Builder */}
          <div className="lg:col-span-8 bg-white border border-stone-200 rounded-lg p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-800 block mb-1">
                  Version Title / Description
                </label>
                <input
                  type="text"
                  value={schemaName}
                  onChange={(e) => setSchemaName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-md border border-stone-200 text-stone-900 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-800 block mb-1">
                  Add New Field
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => addField('single_choice')}
                    className="px-2.5 py-1.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium cursor-pointer"
                  >
                    + Single Choice
                  </button>
                  <button
                    type="button"
                    onClick={() => addField('multi_choice')}
                    className="px-2.5 py-1.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium cursor-pointer"
                  >
                    + Multi Select
                  </button>
                  <button
                    type="button"
                    onClick={() => addField('text_span')}
                    className="px-2.5 py-1.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium cursor-pointer"
                  >
                    + Text Spans
                  </button>
                  <button
                    type="button"
                    onClick={() => addField('rating')}
                    className="px-2.5 py-1.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium cursor-pointer"
                  >
                    + Rating
                  </button>
                </div>
              </div>
            </div>

            {/* Fields List */}
            <div className="space-y-4">
              <div className="text-xs font-semibold text-stone-900">Fields Configuration ({fields.length})</div>

              {fields.map((f, idx) => (
                <div key={f.id} className="p-4 rounded-lg border border-stone-200 bg-stone-50/50 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-stone-400">#{idx + 1}</span>
                      <span className="font-bold text-stone-900 font-mono">{f.name}</span>
                      <span className="text-[10px] font-mono uppercase bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded">
                        {f.type.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeField(f.id)}
                      className="text-stone-400 hover:text-red-600 p-1 cursor-pointer"
                      title="Remove field"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] font-medium text-stone-600 block mb-0.5">Label</label>
                      <input
                        type="text"
                        value={f.label}
                        onChange={(e) => updateField(f.id, { label: e.target.value })}
                        className="w-full text-xs p-1.5 rounded border border-stone-200 bg-white text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-stone-600 block mb-0.5">Field Key / Name</label>
                      <input
                        type="text"
                        value={f.name}
                        onChange={(e) => updateField(f.id, { name: e.target.value })}
                        className="w-full text-xs p-1.5 rounded border border-stone-200 bg-white font-mono text-stone-900"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      id={`req_${f.id}`}
                      checked={f.required}
                      onChange={(e) => updateField(f.id, { required: e.target.checked })}
                    />
                    <label htmlFor={`req_${f.id}`} className="text-stone-700 cursor-pointer">
                      Required field for annotator submission
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Guidelines */}
            <div className="space-y-1 text-xs">
              <label className="font-semibold text-stone-800 block">
                Annotation Rubric & Guidelines
              </label>
              <textarea
                rows={4}
                value={guidelines}
                onChange={(e) => setGuidelines(e.target.value)}
                placeholder="Document edge cases, criteria for ratings, and how annotators should resolve ambiguous records..."
                className="w-full p-3 text-xs rounded-md border border-stone-200 bg-white text-stone-900"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
