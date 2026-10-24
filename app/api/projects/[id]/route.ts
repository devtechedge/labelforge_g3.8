import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  const db = getDb();

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Check workspace membership
  const membership = db
    .prepare('SELECT role FROM workspace_memberships WHERE workspace_id = ? AND user_id = ?')
    .get(project.workspace_id, user.id) as any;

  if (!membership) {
    return NextResponse.json({ error: 'Access denied: Not a member of this workspace' }, { status: 403 });
  }

  // Schema versions
  const schemas = db
    .prepare('SELECT * FROM annotation_schema_versions WHERE project_id = ? ORDER BY version_num DESC')
    .all(id) as any[];

  const currentSchema = schemas.find((s) => s.id === project.current_schema_version_id) || schemas[0] || null;

  // Dataset versions
  const datasetVersions = db
    .prepare(`
      SELECT dv.*, d.name as dataset_name
      FROM dataset_versions dv
      JOIN datasets d ON dv.dataset_id = d.id
      WHERE d.project_id = ?
      ORDER BY dv.created_at DESC
    `)
    .all(id) as any[];

  // Task status counts
  const taskCounts = db
    .prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'UNASSIGNED' THEN 1 ELSE 0 END) as unassigned,
        SUM(CASE WHEN status = 'ASSIGNED' THEN 1 ELSE 0 END) as assigned,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status IN ('SUBMITTED', 'IN_REVIEW') THEN 1 ELSE 0 END) as in_review,
        SUM(CASE WHEN status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'RETURNED_FOR_CORRECTION' THEN 1 ELSE 0 END) as returned,
        SUM(CASE WHEN status IN ('DISPUTED', 'ADJUDICATION') THEN 1 ELSE 0 END) as disputed
      FROM annotation_tasks
      WHERE project_id = ?
    `)
    .get(id) as any;

  // Workspace members available for assignment
  const workspaceMembers = db
    .prepare(`
      SELECT u.id, u.name, u.email, u.avatar, m.role
      FROM workspace_memberships m
      JOIN users u ON m.user_id = u.id
      WHERE m.workspace_id = ?
    `)
    .all(project.workspace_id);

  // Releases
  const releases = db
    .prepare('SELECT * FROM dataset_releases WHERE project_id = ? ORDER BY created_at DESC')
    .all(id);

  return NextResponse.json({
    project,
    userRole: membership.role,
    currentSchema: currentSchema ? {
      ...currentSchema,
      fields: JSON.parse(currentSchema.schema_json),
    } : null,
    schemas: schemas.map((s) => ({
      ...s,
      fields: JSON.parse(s.schema_json),
    })),
    datasetVersions,
    taskCounts: {
      total: taskCounts?.total || 0,
      unassigned: taskCounts?.unassigned || 0,
      assigned: taskCounts?.assigned || 0,
      inProgress: taskCounts?.in_progress || 0,
      inReview: taskCounts?.in_review || 0,
      accepted: taskCounts?.accepted || 0,
      returned: taskCounts?.returned || 0,
      disputed: taskCounts?.disputed || 0,
    },
    members: workspaceMembers,
    releases: releases.map((r: any) => ({
      ...r,
      manifest: JSON.parse(r.manifest_json),
    })),
  });
}
