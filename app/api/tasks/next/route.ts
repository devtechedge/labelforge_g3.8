import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get('projectId');
  const user = await getCurrentUser();
  const db = getDb();

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
  }

  // 1. Priority 1: User's returned-for-correction tasks
  let task = db
    .prepare(`
      SELECT t.id
      FROM annotation_tasks t
      JOIN dataset_records r ON t.dataset_record_id = r.id
      WHERE t.project_id = ? AND t.assigned_to = ? AND t.status = 'RETURNED_FOR_CORRECTION'
      ORDER BY r.source_order ASC
      LIMIT 1
    `)
    .get(projectId, user.id) as { id: string } | undefined;

  // 2. Priority 2: User's in-progress tasks
  if (!task) {
    task = db
      .prepare(`
        SELECT t.id
        FROM annotation_tasks t
        JOIN dataset_records r ON t.dataset_record_id = r.id
        WHERE t.project_id = ? AND t.assigned_to = ? AND t.status = 'IN_PROGRESS'
        ORDER BY r.source_order ASC
        LIMIT 1
      `)
      .get(projectId, user.id) as { id: string } | undefined;
  }

  // 3. Priority 3: User's assigned tasks
  if (!task) {
    task = db
      .prepare(`
        SELECT t.id
        FROM annotation_tasks t
        JOIN dataset_records r ON t.dataset_record_id = r.id
        WHERE t.project_id = ? AND t.assigned_to = ? AND t.status = 'ASSIGNED'
        ORDER BY r.source_order ASC
        LIMIT 1
      `)
      .get(projectId, user.id) as { id: string } | undefined;
  }

  // 4. Priority 4: Any unassigned task if user can self-assign
  if (!task) {
    task = db
      .prepare(`
        SELECT t.id
        FROM annotation_tasks t
        JOIN dataset_records r ON t.dataset_record_id = r.id
        WHERE t.project_id = ? AND t.status = 'UNASSIGNED'
        ORDER BY r.source_order ASC
        LIMIT 1
      `)
      .get(projectId) as { id: string } | undefined;
  }

  return NextResponse.json({ taskId: task?.id || null });
}
