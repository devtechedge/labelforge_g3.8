'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { ProjectNav } from '@/components/ProjectNav';
import { BarChart3, Users, CheckCircle, RotateCcw, AlertTriangle, Info, HelpCircle } from 'lucide-react';

export default function QualityPage() {
  const params = useParams();
  const workspaceId = (params.workspaceId as string) || 'ws_core';
  const projectId = (params.projectId as string) || 'proj_feedback';

  const [qualityData, setQualityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/quality`)
      .then((res) => res.json())
      .then((data) => setQualityData(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [projectId]);

  const interpretKappa = (k: number | null) => {
    if (k === null) return 'Insufficient sample';
    if (k < 0.2) return 'Slight / Poor';
    if (k <= 0.4) return 'Fair Agreement';
    if (k <= 0.6) return 'Moderate Agreement';
    if (k <= 0.8) return 'Substantial Agreement';
    return 'Almost Perfect';
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
              <BarChart3 className="w-5 h-5 text-violet-700" />
              Inter-Annotator Agreement & Quality Assurance
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Rigorous agreement statistics, reviewer outcomes, and sample limitations. No fabricated scores.
            </p>
          </div>
          <div className="text-xs font-mono text-stone-600 bg-stone-100 px-3 py-1.5 rounded-md">
            Redundancy: <span className="font-bold text-stone-900">{qualityData?.redundancyCount || 2} annotators/task</span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-stone-400">Computing agreement metrics...</div>
        ) : (
          <>
            {/* Agreement Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {Object.entries(qualityData?.agreementMetrics || {}).map(([fieldName, metric]: [string, any]) => {
                const res = metric.result;
                const isKappa = metric.type === 'single_choice';
                const isJaccard = metric.type === 'multi_choice';
                const isSpan = metric.type === 'text_span';

                return (
                  <div key={fieldName} className="bg-white border border-stone-200 rounded-lg p-5 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-stone-900">{fieldName}</span>
                      <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">
                        {metric.type.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-stone-500 font-medium">
                      Metric: <span className="text-stone-800">{metric.metricName}</span>
                    </div>

                    {/* Metric Value */}
                    <div className="pt-2 pb-1 border-t border-stone-100">
                      {isKappa && (
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold font-mono text-stone-950">
                              {res.kappa !== null ? res.kappa : '—'}
                            </span>
                            <span className="text-xs font-semibold text-violet-700">
                              {interpretKappa(res.kappa)}
                            </span>
                          </div>

                          <div className="mt-2 text-[11px] text-stone-500 space-y-0.5 font-mono">
                            <div>Observed Agreement (Po): {res.observedAgreement}</div>
                            <div>Expected Chance Agreement (Pe): {res.expectedAgreement}</div>
                            <div>Paired Sample Size: N = {res.sampleSize}</div>
                          </div>

                          {res.status === 'insufficient_sample' && (
                            <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                              {res.message || 'Sample size under 5 pairs; statistical kappa is withheld.'}
                            </div>
                          )}
                        </div>
                      )}

                      {isJaccard && (
                        <div>
                          <div className="text-2xl font-bold font-mono text-stone-950">
                            {res.averageJaccard !== undefined ? `${(res.averageJaccard * 100).toFixed(1)}%` : '—'}
                          </div>
                          <div className="mt-1 text-[11px] text-stone-500 font-mono">
                            Paired Multi-Label Sets: N = {res.sampleSize}
                          </div>
                        </div>
                      )}

                      {isSpan && (
                        <div>
                          <div className="text-2xl font-bold font-mono text-stone-950">
                            {res.averageIoU !== undefined ? `${(res.averageIoU * 100).toFixed(1)}%` : '—'}
                          </div>
                          <div className="mt-1 text-[11px] text-stone-500 font-mono">
                            Exact Span Match Rate: {(res.exactMatchRate * 100).toFixed(1)}% (N = {res.sampleSize})
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Review Outcomes & Annotator Throughput */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Review Decisions */}
              <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <h3 className="text-xs font-bold text-stone-900">Review Decisions Distribution</h3>
                  <span className="text-xs font-mono text-stone-500">
                    Total: {qualityData?.reviewStats?.total || 0}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-md">
                    <div className="text-[10px] font-mono uppercase text-emerald-800">Accepted</div>
                    <div className="text-xl font-bold font-mono text-emerald-950 mt-0.5">
                      {qualityData?.reviewStats?.pass || 0}
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-md">
                    <div className="text-[10px] font-mono uppercase text-amber-800">Returned For Correction</div>
                    <div className="text-xl font-bold font-mono text-amber-950 mt-0.5">
                      {qualityData?.reviewStats?.returned || 0}
                    </div>
                  </div>

                  <div className="p-3 bg-red-50/60 border border-red-200/80 rounded-md">
                    <div className="text-[10px] font-mono uppercase text-red-800">Rejected</div>
                    <div className="text-xl font-bold font-mono text-red-950 mt-0.5">
                      {qualityData?.reviewStats?.rejected || 0}
                    </div>
                  </div>

                  <div className="p-3 bg-stone-100/60 border border-stone-200 rounded-md">
                    <div className="text-[10px] font-mono uppercase text-stone-800">Adjudicated</div>
                    <div className="text-xl font-bold font-mono text-stone-950 mt-0.5">
                      {qualityData?.reviewStats?.adjudicated || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Annotator Completeness */}
              <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <h3 className="text-xs font-bold text-stone-900">Annotator Throughput</h3>
                  <span className="text-xs font-mono text-stone-500">Active Workers</span>
                </div>

                <div className="divide-y divide-stone-100 text-xs">
                  {qualityData?.annotatorStats?.map((worker: any) => (
                    <div key={worker.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-stone-900 text-white font-mono text-[10px] flex items-center justify-center font-bold">
                          {worker.avatar}
                        </div>
                        <span className="font-medium text-stone-900">{worker.name}</span>
                      </div>
                      <div className="font-mono text-stone-600">
                        <span className="font-bold text-stone-900">{worker.submitted_count}</span> submitted
                        <span className="text-stone-300 mx-1.5">/</span>
                        <span>{worker.total_annotations} total</span>
                      </div>
                    </div>
                  ))}

                  {(!qualityData?.annotatorStats || qualityData.annotatorStats.length === 0) && (
                    <div className="py-4 text-center text-stone-400 italic">No annotations recorded yet.</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
