'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  PenTool,
  ShieldCheck,
  Scale,
  Package,
  Layers,
  ArrowRight,
  CheckCircle2,
  Lock,
  GitBranch,
  BarChart3,
  FileText,
  UploadCloud,
  Users,
} from 'lucide-react';
import { Header } from '@/components/Header';

export default function HomePage() {
  // Interactive landing preview state
  const [sentiment, setSentiment] = useState('positive');
  const [aspects, setAspects] = useState<string[]>(['hardware_display']);
  const [highlightedSpan, setHighlightedSpan] = useState<{ text: string; label: string } | null>({
    text: 'display colors are crisp and vibrant',
    label: 'praise',
  });

  const toggleAspect = (id: string) => {
    if (aspects.includes(id)) {
      setAspects(aspects.filter((a) => a !== id));
    } else {
      setAspects([...aspects, id]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa] text-stone-900">
      <Header />

      {/* Hero Section */}
      <section className="pt-16 pb-12 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-stone-100 text-stone-700 text-xs font-mono font-medium border border-stone-200">
            <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
            <span>LABELFORGE PLATFORM · VERSION 1.0</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-stone-950 leading-[1.15]">
            Auditable Human Data Annotation Workbench
          </h1>

          <p className="text-base sm:text-lg text-stone-600 leading-relaxed font-normal">
            Transform raw structured CSV and JSONL records into reviewed, versioned, reproducible annotation datasets. Built with strict schema versioning, optimistic concurrency, inter-annotator agreement statistics, and evidence-based adjudication.
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <Link
              href="/workspaces/ws_core/projects/proj_feedback/annotate/task_01"
              className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <PenTool className="w-4 h-4 text-violet-400" />
              <span>Launch Annotation Workbench</span>
            </Link>

            <Link
              href="/workspaces/ws_core/projects/proj_feedback/review"
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 rounded-md text-xs font-semibold transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-violet-700" />
              <span>Review Queue & Decisions</span>
            </Link>

            <Link
              href="/workspaces/ws_core"
              className="flex items-center gap-1.5 px-4 py-2.5 text-stone-600 hover:text-stone-950 text-xs font-medium"
            >
              <span>Explore Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Workbench Live Preview on Landing Page */}
      <section className="py-8 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                PRACTICAL PREVIEW
              </span>
              <h2 className="text-base font-bold text-stone-950 mt-0.5">
                The Annotation & Text-Span Workbench
              </h2>
            </div>
            <div className="text-xs font-mono text-stone-500 bg-stone-100 px-2.5 py-1 rounded">
              Record: <span className="font-bold text-stone-900">FDB-1002</span> · Dual-Annotator Mode
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Interactive Record Reader */}
            <div className="lg:col-span-7 space-y-4">
              <div className="text-xs font-mono uppercase text-stone-400">Review Text</div>
              <div className="p-5 rounded-lg bg-stone-50 border border-stone-200 text-sm leading-relaxed text-stone-900 font-normal">
                Outstanding battery life! Lasted 14 hours of continuous video playback. The{' '}
                <mark className="bg-violet-100 border-b-2 border-violet-700 px-1 py-0.5 rounded-xs font-medium text-stone-900">
                  display colors are crisp and vibrant
                  <span className="bg-violet-700 text-white text-[10px] font-mono px-1.5 py-0.2 rounded ml-1.5">
                    Praise Feature
                  </span>
                </mark>
                .
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-stone-50 rounded border border-stone-200">
                  <span className="text-[10px] font-mono text-stone-400 uppercase block">Device Model</span>
                  <span className="font-semibold text-stone-800">ForgePad Pro 12</span>
                </div>
                <div className="p-2.5 bg-stone-50 rounded border border-stone-200">
                  <span className="text-[10px] font-mono text-stone-400 uppercase block">Customer Rating</span>
                  <span className="font-semibold text-stone-800">5 / 5 Stars</span>
                </div>
              </div>
            </div>

            {/* Right: Interactive Schema Inputs */}
            <div className="lg:col-span-5 space-y-4 border-l border-stone-100 pl-0 lg:pl-8">
              {/* Single choice */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-900 block">
                  Overall Sentiment (Single Select)
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'positive', label: 'Positive', color: '#16a34a' },
                    { id: 'neutral', label: 'Neutral', color: '#71717a' },
                    { id: 'negative', label: 'Negative', color: '#dc2626' },
                    { id: 'mixed', label: 'Mixed', color: '#ca8a04' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSentiment(opt.id)}
                      className={`px-3 py-2 rounded-md border text-xs font-medium text-left flex items-center justify-between cursor-pointer transition-colors ${
                        sentiment === opt.id
                          ? 'border-violet-700 bg-violet-50 font-bold text-violet-950 ring-1 ring-violet-700'
                          : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
                        <span>{opt.label}</span>
                      </div>
                      {sentiment === opt.id && <CheckCircle2 className="w-3.5 h-3.5 text-violet-700" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multi-choice */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-900 block">
                  Impacted Subsystems (Multi-Select)
                </label>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {[
                    { id: 'hardware_display', label: 'Display & Glass' },
                    { id: 'battery_power', label: 'Battery Life' },
                    { id: 'software_os', label: 'OS & Software' },
                    { id: 'audio_mic', label: 'Audio & Mic' },
                  ].map((asp) => {
                    const isSelected = aspects.includes(asp.id);
                    return (
                      <button
                        key={asp.id}
                        type="button"
                        onClick={() => toggleAspect(asp.id)}
                        className={`px-2.5 py-1.5 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-violet-700 bg-violet-700 text-white font-semibold'
                            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        {asp.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3">
                <Link
                  href="/workspaces/ws_core/projects/proj_feedback/annotate/task_01"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-md text-xs font-semibold transition-colors"
                >
                  <span>Open Full Workbench Experience</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Architecture Matrix */}
      <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="pb-6 border-b border-stone-200 mb-8">
          <h2 className="text-xl font-bold text-stone-950">
            Engineered for Precision, Auditing, and Reproducibility
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Every layer addresses the hard problems of human-in-the-loop data operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-3">
            <div className="w-8 h-8 rounded-md bg-stone-100 flex items-center justify-center text-stone-800">
              <Lock className="w-4 h-4 text-violet-700" />
            </div>
            <h3 className="text-sm font-bold text-stone-950">Immutable Schema Versions</h3>
            <p className="text-stone-600 leading-relaxed">
              Schema modifications create new pinned versions. Tasks and completed annotations remain permanently tied to the exact schema under which they were answered—preventing silent data reinterpretation.
            </p>
          </div>

          <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-3">
            <div className="w-8 h-8 rounded-md bg-stone-100 flex items-center justify-center text-stone-800">
              <GitBranch className="w-4 h-4 text-violet-700" />
            </div>
            <h3 className="text-sm font-bold text-stone-950">Optimistic Concurrency Control</h3>
            <p className="text-stone-600 leading-relaxed">
              Revision numbers prevent stale overwrites. If another annotator or reviewer updates a record concurrently, the workbench detects HTTP 409 and prompts a side-by-side reconciliation dialog.
            </p>
          </div>

          <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-3">
            <div className="w-8 h-8 rounded-md bg-stone-100 flex items-center justify-center text-stone-800">
              <BarChart3 className="w-4 h-4 text-violet-700" />
            </div>
            <h3 className="text-sm font-bold text-stone-950">Authentic Agreement Metrics</h3>
            <p className="text-stone-600 leading-relaxed">
              Computes Cohen&apos;s Kappa (k) for nominal classifications with marginal chance agreement (Pe), Multi-Label Jaccard, and text span IoU. Transparently reports when samples are insufficient (N &lt; 5).
            </p>
          </div>

          <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-3">
            <div className="w-8 h-8 rounded-md bg-stone-100 flex items-center justify-center text-stone-800">
              <Scale className="w-4 h-4 text-violet-700" />
            </div>
            <h3 className="text-sm font-bold text-stone-950">Dispute Adjudication</h3>
            <p className="text-stone-600 leading-relaxed">
              When multi-annotator submissions disagree, tasks enter the Adjudication workbench where adjudicators resolve differences, document mandatory rationale, and establish ground truth.
            </p>
          </div>

          <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-3">
            <div className="w-8 h-8 rounded-md bg-stone-100 flex items-center justify-center text-stone-800">
              <Package className="w-4 h-4 text-violet-700" />
            </div>
            <h3 className="text-sm font-bold text-stone-950">Reproducible Releases & Manifests</h3>
            <p className="text-stone-600 leading-relaxed">
              Export canonical JSONL and formula-safe CSV accompanied by cryptographic SHA-256 manifests containing author signatures, record counts, and schema definitions.
            </p>
          </div>

          <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-3">
            <div className="w-8 h-8 rounded-md bg-stone-100 flex items-center justify-center text-stone-800">
              <UploadCloud className="w-4 h-4 text-violet-700" />
            </div>
            <h3 className="text-sm font-bold text-stone-950">RFC 4180 Import Quarantine</h3>
            <p className="text-stone-600 leading-relaxed">
              Parses multiline and quoted CSV cells, validates JSONL syntax, reports exact row numbers and error codes, and quarantines invalid rows prior to transactional database commit.
            </p>
          </div>
        </div>
      </section>

      {/* Role Personas Quick Test Walkthrough */}
      <section className="py-8 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="bg-stone-100/70 border border-stone-200 rounded-xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-stone-800" />
            <h2 className="text-base font-bold text-stone-950">
              Multi-Role Persona Testing Switcher
            </h2>
          </div>
          <p className="text-xs text-stone-600 max-w-3xl leading-relaxed">
            LabelForge includes 4 pre-configured identities accessible from the top-right persona switcher to test realistic multi-user permissions without logging out:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-2">
            <div className="p-3 bg-white rounded border border-stone-200">
              <span className="font-mono text-[10px] text-stone-500 font-bold block">OWNER / MANAGER</span>
              <span className="font-bold text-stone-900 block mt-0.5">Elena Vance</span>
              <span className="text-[11px] text-stone-500">Configures schemas, imports datasets, and publishes releases.</span>
            </div>

            <div className="p-3 bg-white rounded border border-stone-200">
              <span className="font-mono text-[10px] text-amber-700 font-bold block">ANNOTATOR</span>
              <span className="font-bold text-stone-900 block mt-0.5">Marcus Chen</span>
              <span className="text-[11px] text-stone-500">Labels assigned tasks, extracts spans, and saves drafts.</span>
            </div>

            <div className="p-3 bg-white rounded border border-stone-200">
              <span className="font-mono text-[10px] text-amber-700 font-bold block">ANNOTATOR</span>
              <span className="font-bold text-stone-900 block mt-0.5">Priya Sharma</span>
              <span className="text-[11px] text-stone-500">Provides redundant secondary annotations to calculate agreement.</span>
            </div>

            <div className="p-3 bg-white rounded border border-stone-200">
              <span className="font-mono text-[10px] text-violet-700 font-bold block">REVIEWER / ADJUDICATOR</span>
              <span className="font-bold text-stone-900 block mt-0.5">David Kim</span>
              <span className="text-[11px] text-stone-500">Accepts, returns for correction, or adjudicates disputes.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-stone-900">LabelForge</span>
            <span>· Human-in-the-Loop Annotation Workbench</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-stone-900">
              Terms & Dataset Retention
            </Link>
            <Link href="/privacy" className="hover:text-stone-900">
              Privacy & Content Policy
            </Link>
            <Link href="/workspaces/ws_core/projects/proj_feedback" className="text-violet-700 font-medium hover:underline">
              Demo Project →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
