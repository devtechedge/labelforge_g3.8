'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { ProjectNav } from '@/components/ProjectNav';
import {
  CheckSquare,
  Search,
  Filter,
  UserCheck,
  UserMinus,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { TaskStatus } from '@/lib/domain/types';

export default function TasksInventoryPage() {
  const params = useParams();
  const workspaceId = (params.workspaceId as string) || 'ws_core';
  const projectId = (params.projectId as string) || 'proj_feedback';

  const [tasks, setTasks] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchAssignee, setBatchAssignee] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        status: statusFilter,
        assignee: assigneeFilter,
        search,
      });

      const res = await fetch(`/api/projects/${projectId}/tasks?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        setPagination(data.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 });
      }

      // Also get members
      const projRes = await fetch(`/api/projects/${projectId}`);
      if (projRes.ok) {
        const projData = await projRes.json();
        setMembers(projData.members || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [projectId, pagination.page, pagination.limit, statusFilter, assigneeFilter, search]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const toggleSelectAll = () => {
    if (selectedTaskIds.length === tasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(tasks.map((t) => t.id));
    }
  };

  const toggleSelectTask = (id: string) => {
    if (selectedTaskIds.includes(id)) {
      setSelectedTaskIds(selectedTaskIds.filter((t) => t !== id));
    } else {
      setSelectedTaskIds([...selectedTaskIds, id]);
    }
  };

  const handleBatchAssign = async () => {
    if (selectedTaskIds.length === 0) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskIds: selectedTaskIds,
          assigneeId: batchAssignee || null,
        }),
      });

      if (res.ok) {
        setSelectedTaskIds([]);
        setBatchAssignee('');
        await fetchTasks();
      } else {
        const err = await res.json();
        alert(err.error || 'Assignment failed');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAssigning(false);
    }
  };

  const statusTabs = [
    'ALL',
    'UNASSIGNED',
    'ASSIGNED',
    'IN_PROGRESS',
    'SUBMITTED',
    'RETURNED_FOR_CORRECTION',
    'DISPUTED',
    'ACCEPTED',
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa]">
      <Header workspaceId={workspaceId} projectId={projectId} />
      <ProjectNav workspaceId={workspaceId} projectId={projectId} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
          <div>
            <h1 className="text-lg font-bold text-stone-950 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-violet-700" />
              Task Inventory
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Browse, filter, and allocate records across your annotation team.
            </p>
          </div>

          {/* Search & Assignee filter */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search record content or ID..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="text-xs p-1.5 rounded-md border border-stone-200 bg-white text-stone-800"
            >
              <option value="ALL">All Assignees</option>
              <option value="UNASSIGNED">Unassigned Only</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab
                  ? 'bg-stone-900 text-stone-50 font-semibold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              {tab.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Batch Action Bar if items selected */}
        {selectedTaskIds.length > 0 && (
          <div className="bg-stone-900 text-stone-100 px-4 py-2.5 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
            <span className="font-medium">
              {selectedTaskIds.length} {selectedTaskIds.length === 1 ? 'task' : 'tasks'} selected
            </span>

            <div className="flex items-center gap-2">
              <select
                value={batchAssignee}
                onChange={(e) => setBatchAssignee(e.target.value)}
                className="bg-stone-800 text-stone-100 border border-stone-700 text-xs px-2.5 py-1.5 rounded"
              >
                <option value="">Select Assignee...</option>
                <option value="">-- Unassign Tasks --</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    Assign to: {m.name} ({m.role})
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={assigning}
                onClick={handleBatchAssign}
                className="px-3 py-1.5 bg-violet-700 hover:bg-violet-800 text-white rounded font-medium disabled:opacity-50 cursor-pointer"
              >
                {assigning ? 'Applying...' : 'Apply Assignment'}
              </button>
            </div>
          </div>
        )}

        {/* Tasks Table */}
        <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-mono uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.length === tasks.length && tasks.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-3">Order</th>
                  <th className="p-3">Stable ID</th>
                  <th className="p-3">Record Text Preview</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Assignee</th>
                  <th className="p-3">Rev</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-stone-400">
                      Loading task inventory...
                    </td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-stone-400 italic">
                      No tasks found matching current filters.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => {
                    const isSelected = selectedTaskIds.includes(task.id);
                    const primaryText = task.data?.review_text || task.data?.text || JSON.stringify(task.data);

                    return (
                      <tr
                        key={task.id}
                        className={`hover:bg-stone-50/60 transition-colors ${
                          isSelected ? 'bg-violet-50/30' : ''
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectTask(task.id)}
                          />
                        </td>
                        <td className="p-3 font-mono text-stone-400">#{task.source_order}</td>
                        <td className="p-3 font-mono font-bold text-stone-900">{task.stable_id}</td>
                        <td className="p-3 max-w-md text-stone-700 truncate">{primaryText}</td>
                        <td className="p-3">
                          <span
                            className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded ${
                              task.status === 'ACCEPTED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : task.status === 'DISPUTED'
                                ? 'bg-amber-100 text-amber-800'
                                : task.status === 'RETURNED_FOR_CORRECTION'
                                ? 'bg-red-100 text-red-800'
                                : task.status === 'SUBMITTED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {task.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-3">
                          {task.assignee_name ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-stone-900 text-white font-mono text-[10px] flex items-center justify-center font-bold">
                                {task.assignee_avatar || 'U'}
                              </div>
                              <span className="text-stone-800 font-medium">{task.assignee_name}</span>
                            </div>
                          ) : (
                            <span className="text-stone-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-stone-400">r{task.revision}</td>
                        <td className="p-3 text-right">
                          <Link
                            href={`/workspaces/${workspaceId}/projects/${projectId}/annotate/${task.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-900 px-2.5 py-1 rounded hover:bg-violet-50 transition-colors"
                          >
                            <span>Annotate</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500 font-mono">
            <span>
              Showing {tasks.length} of {pagination.total} records
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="p-1 rounded border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span>
                Page {pagination.page} / {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="p-1 rounded border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
