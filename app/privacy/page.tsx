import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa]">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-8 space-y-6 text-xs text-stone-700 leading-relaxed">
        <div className="pb-4 border-b border-stone-200">
          <Link href="/" className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-900 mb-3">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </Link>
          <h1 className="text-2xl font-bold text-stone-950">Privacy & Dataset Security Policy</h1>
          <p className="text-stone-400 font-mono mt-1">Effective Date: October 24, 2026</p>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-stone-900">1. Data Storage & Tenancy</h2>
          <p>
            All records, annotations, and audit events are stored in relational tenant-isolated tables with strict foreign key constraints. Raw passwords or invitation bearer tokens are never stored in plaintext.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-stone-900">2. Untrusted Content Sanitization</h2>
          <p>
            Customer input text, reviews, and entity spans are treated as untrusted strings. Rendering is performed through native React text escaping, preventing stored cross-site scripting (XSS) or code execution.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-stone-900">3. Audit Logging</h2>
          <p>
            All workspace mutations—including file imports, task assignments, draft saves, reviewer decisions, adjudications, and release publications—are recorded in an immutable audit table accessible to workspace administrators.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-stone-900">4. Session Management</h2>
          <p>
            Authentication relies on secure, scoped HTTP-only session cookies with strict same-site controls to safeguard against cross-site request forgery.
          </p>
        </section>
      </main>
    </div>
  );
}
