'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, CheckCircle, Clock, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import { TaskStatus } from '@/lib/domain/types';

export function TaskQueue({
  tasks,
  activeTaskId,
  workspaceId,
  projectId,
  className = '',
}: {
  tasks: Array<{
    id: string;
    stable_id: string;
    source_order: number;
    status: TaskStatus;
    data_json?: string;
  }>;
  activeTaskId: string;
  workspaceId: string;
  projectId: string;
  className?: string;
}) {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'DONE'>('ALL');
  const [search, setSearch] = useState('');

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'PENDING') {
      if (['ACCEPTED', 'RESOLVED'].includes(t.status)) return false;
    }
    if (filter === 'DONE') {
      if (!['ACCEPTED', 'RESOLVED'].includes(t.status)) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.stable_id.toLowerCase().includes(q) ||
        String(t.source_order).includes(q) ||
        (t.data_json && t.data_json.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'ACCEPTED':
      case 'RESOLVED':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case 'SUBMITTED':
      case 'IN_REVIEW':
        return <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
      case 'DISPUTED':
      case 'ADJUDICATION':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      case 'RETURNED_FOR_CORRECTION':
      case 'REJECTED':
        return <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-stone-300 shrink-0 ml-1" />;
    }
  };

  return (
    <div className={`flex flex-col h-full bg-stone-50 border-r border-stone-200 w-64 lg:w-72 shrink-0 ${className}`}>
      {/* Header & Filter */}
      <div className="p-3 border-b border-stone-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-900 tracking-tight">Task Queue</span>
          <span className="text-[11px] font-mono text-stone-500">
            {filteredTasks.length} / {tasks.length}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search record ID..."
            className="w-full text-xs pl-8 pr-2 py-1.5 rounded-md border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
          />
        </div>

        {/* Segmented Filter */}
        <div className="flex items-center p-0.5 bg-stone-200/60 rounded-md text-[11px]">
          {(['ALL', 'PENDING', 'DONE'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`flex-1 py-1 font-medium rounded-xs transition-colors cursor-pointer ${
                filter === tab ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {tab === 'ALL' ? 'All' : tab === 'PENDING' ? 'Pending' : 'Done'}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto divide-y divide-stone-100 p-1">
        {filteredTasks.map((t) => {
          const isActive = t.id === activeTaskId;
          return (
            <Link
              key={t.id}
              href={`/workspaces/${workspaceId}/projects/${projectId}/annotate/${t.id}`}
              className={`flex items-center justify-between px-3 py-2.5 rounded-md text-xs transition-colors group ${
                isActive
                  ? 'bg-stone-900 text-stone-50 font-medium'
                  : 'text-stone-700 hover:bg-stone-100/80 hover:text-stone-900'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {getStatusIcon(t.status)}
                <div className="truncate">
                  <div className={`font-mono text-xs truncate ${isActive ? 'text-stone-50 font-semibold' : 'text-stone-900'}`}>
                    {t.stable_id}
                  </div>
                  <div className={`text-[10px] ${isActive ? 'text-stone-300' : 'text-stone-400'}`}>
                    Row #{t.source_order} · {t.status.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>

              <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-opacity ${
                isActive ? 'opacity-100 text-stone-200' : 'opacity-0 group-hover:opacity-100 text-stone-400'
              }`} />
            </Link>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="p-4 text-center text-xs text-stone-400 italic">
            No matching tasks found.
          </div>
        )}
      </div>
    </div>
  );
}
