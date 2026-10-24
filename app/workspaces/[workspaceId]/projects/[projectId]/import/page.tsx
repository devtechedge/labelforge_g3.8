'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { ProjectNav } from '@/components/ProjectNav';
import {
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle,
  FileCode,
  Layers,
  ArrowRight,
  Database,
} from 'lucide-react';

const SAMPLE_VALID_CSV = `id,customer_id,device_model,rating,review_text,purchase_date
FDB-2001,CUST-109,ForgePad Pro 12,5,"The battery easily lasts 14 hours and display calibration is studio grade.",2026-10-01
FDB-2002,CUST-218,ForgeAudio Buds,1,"Left earbud failed to connect out of the box. Firmware update hung at 99%.",2026-10-03
FDB-2003,CUST-344,ForgePad Pro 12,4,"Chassis is lightweight aluminum, but the power button feels slightly wobbly.",2026-10-05
FDB-2004,CUST-412,ForgeAudio Buds,2,"Microphone quality is muffled on video calls. People struggle to hear me.",2026-10-08`;

const SAMPLE_MALFORMED_CSV = `id,device_model,review_text
FDB-3001,ForgePad Pro 12,"Normal first record"
FDB-3001,ForgeAudio Buds,"Error: Duplicate record identifier FDB-3001"
FDB-3003,ForgePad Pro 12,Too,many,extra,columns,without,proper,quotes
FDB-3004,ForgePad Pro 12,"Valid row after malformed rows"`;

const SAMPLE_VALID_JSONL = `{"id": "JSON-01", "prompt": "Explain quantum annealing", "response": "Quantum annealing is a metaheuristic for finding the global minimum of a given objective function over a given set of candidate solutions.", "helpful": true}
{"id": "JSON-02", "prompt": "Write a python function to parse CSV", "response": "def parse_csv(text): return [line.split(',') for line in text.splitlines()]", "helpful": true}`;

const SAMPLE_MALFORMED_JSONL = `{"id": "JSON-10", "text": "Valid first line"}
{malformed json syntax line here with unquoted keys: 123}
{"id": "JSON-12", "text": "Valid third line"}`;

export default function ImportDatasetPage() {
  const params = useParams();
  const workspaceId = (params.workspaceId as string) || 'ws_core';
  const projectId = (params.projectId as string) || 'proj_feedback';
  const router = useRouter();

  const [rawText, setRawText] = useState('');
  const [filename, setFilename] = useState('import_data.csv');
  const [datasetName, setDatasetName] = useState('Customer Reviews Batch B');
  const [validating, setValidating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [commitSuccess, setCommitSuccess] = useState<any>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      setRawText((evt.target?.result as string) || '');
    };
    reader.readAsText(file);
  };

  const loadSample = (content: string, name: string) => {
    setRawText(content);
    setFilename(name);
    setPreviewResult(null);
    setErrorMessage(null);
  };

  const handleValidatePreview = async () => {
    if (!rawText.trim()) {
      setErrorMessage('Please provide or upload dataset content.');
      return;
    }

    setValidating(true);
    setErrorMessage(null);
    setPreviewResult(null);
    setCommitSuccess(null);

    try {
      const formData = new FormData();
      formData.append('rawText', rawText);
      formData.append('filename', filename);

      const res = await fetch(`/api/projects/${projectId}/imports/preview`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Validation failed');
      }

      setPreviewResult(data);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleCommit = async () => {
    if (!previewResult || !previewResult.batchId) return;
    setCommitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/imports/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: previewResult.batchId,
          datasetName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Commit failed');
      }

      setCommitSuccess(data);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setCommitting(false);
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
              <UploadCloud className="w-5 h-5 text-violet-700" />
              Import Dataset Records
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Parse, inspect malformed rows, validate RFC 4180 CSV & JSONL, and commit versioned tasks.
            </p>
          </div>
        </div>

        {commitSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-emerald-950">
                  Dataset Successfully Committed & Created!
                </div>
                <div className="text-xs text-emerald-800 mt-0.5 font-mono">
                  Created {commitSuccess.recordsCreated} records and {commitSuccess.tasksCreated} annotation tasks.
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push(`/workspaces/${workspaceId}/projects/${projectId}/tasks`)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 text-white rounded-md text-xs font-semibold hover:bg-emerald-900 transition-colors cursor-pointer"
            >
              <span>View Tasks Inventory</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Step 1: Input & Samples */}
        <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-stone-950">Step 1: Choose or Paste Data</h2>

            {/* Quick Test Samples */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-stone-400 font-mono text-[10px] mr-1">TEST SAMPLES:</span>
              <button
                type="button"
                onClick={() => loadSample(SAMPLE_VALID_CSV, 'valid_reviews.csv')}
                className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-[11px] cursor-pointer"
              >
                Valid CSV
              </button>
              <button
                type="button"
                onClick={() => loadSample(SAMPLE_MALFORMED_CSV, 'malformed_reviews.csv')}
                className="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium text-[11px] cursor-pointer"
              >
                Malformed CSV (Errors)
              </button>
              <button
                type="button"
                onClick={() => loadSample(SAMPLE_VALID_JSONL, 'prompts.jsonl')}
                className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-[11px] cursor-pointer"
              >
                Valid JSONL
              </button>
              <button
                type="button"
                onClick={() => loadSample(SAMPLE_MALFORMED_JSONL, 'malformed.jsonl')}
                className="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium text-[11px] cursor-pointer"
              >
                Malformed JSONL (Errors)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-stone-700 block mb-1">
                Upload File (.csv or .jsonl)
              </label>
              <input
                type="file"
                accept=".csv,.jsonl,.txt"
                onChange={handleFileUpload}
                className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-stone-200 file:bg-stone-50 file:text-xs file:font-medium text-stone-500 cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-700 block mb-1">Filename</label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="w-full text-xs p-2 rounded-md border border-stone-200 bg-white text-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-stone-700 block mb-1">
              File Content (CSV or JSONL)
            </label>
            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="id,rating,review_text&#10;1,5,&quot;Great product battery&quot;"
              className="w-full text-xs p-3 font-mono rounded-md border border-stone-200 bg-stone-50 text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={validating || !rawText.trim()}
              onClick={handleValidatePreview}
              className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-md transition-colors cursor-pointer"
            >
              {validating ? 'Parsing & Validating...' : 'Validate & Preview Import'}
            </button>
          </div>
        </div>

        {/* Step 2: Validation Inspection Report */}
        {previewResult && (
          <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-5 shadow-2xs animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h2 className="text-sm font-semibold text-stone-950">Step 2: Validation Report</h2>
                <div className="text-xs text-stone-500 mt-0.5">
                  Format: <span className="font-mono uppercase font-bold text-stone-800">{previewResult.fileType}</span> · Detected Columns: {previewResult.detectedFields.join(', ')}
                </div>
              </div>

              {/* Counters */}
              <div className="flex items-center gap-3 font-mono text-xs">
                <div className="px-2.5 py-1 bg-stone-100 rounded text-stone-700">
                  Total: <span className="font-bold">{previewResult.totalRows}</span>
                </div>
                <div className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded">
                  Valid: <span className="font-bold">{previewResult.validRows}</span>
                </div>
                {previewResult.invalidRows > 0 && (
                  <div className="px-2.5 py-1 bg-red-100 text-red-800 rounded">
                    Errors: <span className="font-bold">{previewResult.invalidRows}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Error Quarantine Table if any errors */}
            {previewResult.errors && previewResult.errors.length > 0 && (
              <div className="border border-red-200 bg-red-50/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-red-900">
                  <AlertTriangle className="w-4 h-4 text-red-700" />
                  <span>Quarantined Row Validation Errors ({previewResult.errors.length})</span>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-red-200 text-xs">
                  {previewResult.errors.map((err: any, idx: number) => (
                    <div key={idx} className="py-2 flex items-center justify-between font-mono text-[11px]">
                      <div>
                        <span className="font-bold text-red-800">Row {err.rowIndex}:</span>{' '}
                        <span className="text-stone-700">{err.message}</span>
                      </div>
                      <span className="px-1.5 py-0.5 bg-red-200 text-red-900 rounded font-semibold text-[10px]">
                        {err.code}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Valid Rows Preview Table */}
            <div>
              <div className="text-xs font-semibold text-stone-800 mb-2">
                Sample Valid Preview ({previewResult.previewRows.length} shown)
              </div>
              <div className="overflow-x-auto border border-stone-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 font-mono text-[10px] uppercase text-stone-500">
                    <tr>
                      {previewResult.detectedFields.map((f: string) => (
                        <th key={f} className="p-2.5">
                          {f}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {previewResult.previewRows.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-stone-50">
                        {previewResult.detectedFields.map((f: string) => (
                          <td key={f} className="p-2.5 max-w-xs truncate text-stone-700">
                            {typeof row[f] === 'object' ? JSON.stringify(row[f]) : String(row[f] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Step 3: Explicit Commit */}
            <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 max-w-xs">
                <label className="text-xs font-semibold text-stone-800 block mb-1">
                  Dataset Version Label
                </label>
                <input
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  className="w-full text-xs p-2 rounded-md border border-stone-200 bg-white text-stone-900"
                />
              </div>

              <button
                type="button"
                disabled={committing || previewResult.validRows === 0}
                onClick={handleCommit}
                className="px-5 py-2.5 bg-violet-700 hover:bg-violet-800 text-white rounded-md text-xs font-semibold disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
              >
                {committing
                  ? 'Committing & Creating Tasks...'
                  : `Commit ${previewResult.validRows} Records to Workbench`}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
