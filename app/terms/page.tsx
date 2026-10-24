import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa]">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-8 space-y-6 text-xs text-stone-700 leading-relaxed">
        <div className="pb-4 border-b border-stone-200">
          <Link href="/" className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-900 mb-3">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </Link>
          <h1 className="text-2xl font-bold text-stone-950">Terms of Service & Dataset Retention Policy</h1>
          <p className="text-stone-400 font-mono mt-1">Effective Date: October 24, 2026</p>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-stone-900">1. Customer Dataset Ownership & Zero External Training</h2>
          <p>
            Users retain 100% intellectual property, proprietary rights, and ownership over all uploaded records, raw CSV/JSONL source files, custom schema definitions, and produced annotations. LabelForge does not utilize customer dataset content to train external models, foundational LLMs, or commercial third-party systems.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-stone-900">2. Immutable Versioning & Retention Architecture</h2>
          <p>
            To guarantee scientific reproducibility and audit compliance:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Dataset Versions:</strong> Once an imported batch is committed, its source ordering and content hashes are frozen.</li>
            <li><strong>Schema Versions:</strong> Edits generate new schema version numbers. Completed annotations remain permanently pinned to the schema under which they were created.</li>
            <li><strong>Published Releases:</strong> Generated releases and cryptographic SHA-256 manifests cannot be mutated. Creating a new release produces a new distinct release artifact.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-stone-900">3. Workspace Isolation & Access Control</h2>
          <p>
            Every resource is strictly scoped by workspace ID. Roles (Owner, Manager, Annotator, Reviewer) enforce least-privilege operations. Cross-workspace reads and writes are blocked by server-side verification.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-stone-900">4. Export Formula Injection Mitigation</h2>
          <p>
            To protect downstream consumers opening CSV exports in Microsoft Excel or Google Sheets, cell values containing leading spreadsheet formula operators (<code className="font-mono bg-stone-100 px-1">=, +, -, @</code>) are automatically sanitized and prefixed to prevent remote execution.
          </p>
        </section>
      </main>
    </div>
  );
}
