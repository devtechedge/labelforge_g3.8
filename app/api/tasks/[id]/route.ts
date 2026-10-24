import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params;
  const user = await getCurrentUser();
  const db = getDb();

  const task = db
    .prepare(`
      SELECT
        t.*,
        p.name as project_name,
        p.workspace_id,
        p.redundancy_count,
        r.stable_id,
        r.source_order,
        r.data_json,
        s.version_num as schema_version_num,
        s.name as schema_name,
        s.schema_json,
        s.guidelines
      FROM annotation_tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN dataset_records r ON t.dataset_record_id = r.id
      JOIN annotation_schema_versions s ON t.schema_version_id = s.id
      WHERE t.id = ?
    `)
    .get(taskId) as any;

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Check workspace membership
  const membership = db
    .prepare('SELECT role FROM workspace_memberships WHERE workspace_id = ? AND user_id = ?')
    .get(task.workspace_id, user.id) as any;

  if (!membership) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Get current user's annotation on this task
  const myAnnotation = db
    .prepare('SELECT * FROM annotations WHERE task_id = ? AND annotator_id = ?')
    .get(taskId, user.id) as any;

  // Get all annotations on this task (for reviewers or multi-annotator view)
  const allAnnotations = db
    .prepare(`
      SELECT a.*, u.name as annotator_name, u.avatar as annotator_avatar
      FROM annotations a
      JOIN users u ON a.annotator_id = u.id
      WHERE a.task_id = ?
      ORDER BY a.created_at ASC
    `)
    .all(taskId) as any[];

  // Reviews on this task
  const reviews = db
    .prepare(`
      SELECT rev.*, u.name as reviewer_name, u.avatar as reviewer_avatar
      FROM reviews rev
      JOIN users u ON rev.reviewer_id = u.id
      WHERE rev.task_id = ?
      ORDER BY rev.created_at DESC
    `)
    .all(taskId);

  // Adjudication on this task
  const adjudication = db
    .prepare(`
      SELECT adj.*, u.name as adjudicator_name
      FROM adjudications adj
      JOIN users u ON adj.adjudicator_id = u.id
      WHERE adj.task_id = ?
    `)
    .get(taskId) as any;

  // Previous and next task in order
  const prevTask = db
    .prepare(`
      SELECT t.id FROM annotation_tasks t
      JOIN dataset_records r ON t.dataset_record_id = r.id
      WHERE t.project_id = ? AND r.source_order < ?
      ORDER BY r.source_order DESC LIMIT 1
    `)
    .get(task.project_id, task.source_order) as { id: string } | undefined;

  const nextTask = db
    .prepare(`
      SELECT t.id FROM annotation_tasks t
      JOIN dataset_records r ON t.dataset_record_id = r.id
      WHERE t.project_id = ? AND r.source_order > ?
      ORDER BY r.source_order ASC LIMIT 1
    `)
    .get(task.project_id, task.source_order) as { id: string } | undefined;

  return NextResponse.json({
    task: {
      id: task.id,
      projectId: task.project_id,
      projectName: task.project_name,
      workspaceId: task.workspace_id,
      redundancyCount: task.redundancy_count,
      status: task.status,
      priority: task.priority,
      revision: task.revision,
      assignedTo: task.assigned_to,
      sourceOrder: task.source_order,
      stableId: task.stable_id,
      data: JSON.parse(task.data_json),
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    },
    schema: {
      id: task.schema_version_id,
      version: task.schema_version_num,
      name: task.schema_name,
      fields: JSON.parse(task.schema_json),
      guidelines: task.guidelines,
    },
    myAnnotation: myAnnotation
      ? {
          ...myAnnotation,
          answers: JSON.parse(myAnnotation.answers_json),
          isDraft: Boolean(myAnnotation.is_draft),
        }
      : null,
    allAnnotations: allAnnotations.map((a) => ({
      ...a,
      answers: JSON.parse(a.answers_json),
      isDraft: Boolean(a.is_draft),
    })),
    reviews,
    adjudication: adjudication
      ? {
          ...adjudication,
          chosenAnswer: JSON.parse(adjudication.chosen_answer_json),
        }
      : null,
    prevTaskId: prevTask?.id || null,
    nextTaskId: nextTask?.id || null,
  });
}
