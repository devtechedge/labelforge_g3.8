'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  PenTool,
  ShieldCheck,
  BarChart3,
  FileCode,
  UploadCloud,
  Package,
} from 'lucide-react';

export function ProjectNav({
  workspaceId,
  projectId,
  projectName,
  activeTaskId = 'task_01',
}: {
  workspaceId: string;
  projectId: string;
  projectName?: string;
  activeTaskId?: string;
}) {
  const pathname = usePathname();

  const links = [
    {
      label: 'Overview',
      href: `/workspaces/${workspaceId}/projects/${projectId}`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: 'Tasks',
      href: `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
      icon: CheckSquare,
      exact: false,
    },
    {
      label: 'Workbench',
      href: `/workspaces/${workspaceId}/projects/${projectId}/annotate/${activeTaskId}`,
      icon: PenTool,
      exact: false,
    },
    {
      label: 'Review Queue',
      href: `/workspaces/${workspaceId}/projects/${projectId}/review`,
      icon: ShieldCheck,
      exact: false,
    },
    {
      label: 'Quality & Agreement',
      href: `/workspaces/${workspaceId}/projects/${projectId}/quality`,
      icon: BarChart3,
      exact: false,
    },
    {
      label: 'Schema',
      href: `/workspaces/${workspaceId}/projects/${projectId}/schema`,
      icon: FileCode,
      exact: false,
    },
    {
      label: 'Import',
      href: `/workspaces/${workspaceId}/projects/${projectId}/import`,
      icon: UploadCloud,
      exact: false,
    },
    {
      label: 'Releases',
      href: `/workspaces/${workspaceId}/projects/${projectId}/releases`,
      icon: Package,
      exact: false,
    },
  ];

  return (
    <div className="border-b border-stone-200 bg-[#fafaf9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Project Breadcrumb title */}
        {projectName && (
          <div className="py-2.5 flex items-center justify-between text-xs border-b border-stone-200/60">
            <div className="flex items-center gap-2 text-stone-600">
              <span className="font-mono text-stone-400">PROJECT</span>
              <span className="text-stone-300">/</span>
              <span className="font-semibold text-stone-900">{projectName}</span>
            </div>
            <div className="text-[11px] font-mono text-stone-500">
              ID: <span className="font-medium text-stone-700">{projectId}</span>
            </div>
          </div>
        )}

        {/* Tab Links - Zero-pill typography discipline */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 -mb-px">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href) ||
                (link.label === 'Workbench' && pathname.includes('/annotate/'));

            return (
              <Link
                key={link.label}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-stone-900 text-stone-50 font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-950 hover:bg-stone-200/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-stone-50' : 'text-stone-400'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
