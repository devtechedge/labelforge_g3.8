import Link from 'next/link';
import { Header } from '@/components/Header';
import { ShieldCheck, Users, KeyRound, ArrowRight } from 'lucide-react';

const personas = [
  { name: 'Elena Vance', role: 'Owner / Manager', desc: 'Configures schemas, imports datasets, and publishes releases.' },
  { name: 'Marcus Chen', role: 'Annotator', desc: 'Labels assigned tasks, extracts spans, and saves drafts.' },
  { name: 'Priya Sharma', role: 'Annotator', desc: 'Provides redundant secondary annotations for agreement metrics.' },
  { name: 'David Kim', role: 'Reviewer / Adjudicator', desc: 'Accepts, returns, or adjudicates disputed tasks.' },
];

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa]">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <div className="w-8 h-8 rounded bg-stone-900 text-stone-50 flex items-center justify-center font-mono font-bold text-sm mb-3">
              LF
            </div>
            <h1 className="text-xl font-bold text-stone-950">Create an account</h1>
            <p className="text-xs text-stone-500 mt-1">
              LabelForge is an evaluation build and does not ship a real
              identity provider. Instead, the app includes four pre-configured
              workbench identities that let you explore every role without
              signing up.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {personas.map((p) => (
              <div key={p.name} className="p-4 rounded-lg border border-stone-200 bg-stone-50/60">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-3.5 h-3.5 text-stone-500" />
                  <span className="font-semibold text-stone-900 text-xs">{p.name}</span>
                </div>
                <div className="text-[10px] font-mono uppercase text-violet-700 mb-1.5">{p.role}</div>
                <p className="text-[11px] text-stone-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-100">
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-violet-300" />
              Choose a workbench identity
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
              <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
              No email or password is created or stored.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
