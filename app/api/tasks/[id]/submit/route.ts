import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, logAuditEvent } from '@/lib/auth/session';
import { checkOptimisticRevision } from '@/lib/domain/concurrency';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params;
  const user = await getCurrentUser();
  const db = getDb();

  const task = db
    .prepare(`
      SELECT t.*, p.redundancy_count, p.workspace_id, s.schema_json
      FROM annotation_tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN annotation_schema_versions s ON t.schema_version_id = s.id
      WHERE t.id = ?
    `)
    .get(taskId) as any;

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const body = await req.json();
  const answers = body.answers || {};
  const expectedRevision = Number(body.expectedRevision) || 1;

  // Validate required schema fields
  const schemaFields = JSON.parse(task.schema_json) as any[];
  for (const field of schemaFields) {
    if (field.required) {
      const val = answers[field.name];
      if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
        return NextResponse.json(
          { error: `Missing required field: "${field.label || field.name}".` },
          { status: 422 }
        );
      }
    }
  }

  const existing = db
    .prepare('SELECT * FROM annotations WHERE task_id = ? AND annotator_id = ?')
    .get(taskId, user.id) as any;

  if (existing) {
    const check = checkOptimisticRevision(existing.revision, expectedRevision);
    if (check.conflict) {
      return NextResponse.json(
        {
          code: 'REVISION_CONFLICT',
          message: check.message,
          currentRevision: existing.revision,
          storedAnswers: JSON.parse(existing.answers_json),
        },
        { status: 409 }
      );
    }
  }

  const now = new Date().toISOString();
  const nextRevision = (existing?.revision || 0) + 1;
  const annotationId = existing?.id || `ann_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  try {
    db.exec('BEGIN TRANSACTION;');

    if (existing) {
      db.prepare(`
        UPDATE annotations
        SET answers_json = ?, revision = ?, is_draft = 0, submitted_at = ?, updated_at = ?
        WHERE id = ?
      `).run(JSON.stringify(answers), nextRevision, now, now, existing.id);
    } else {
      db.prepare(`
        INSERT INTO annotations (id, task_id, annotator_id, schema_version_id, answers_json, revision, is_draft, submitted_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
      `).run(annotationId, taskId, user.id, task.schema_version_id, JSON.stringify(answers), nextRevision, now, now, now);
    }

    // Check sibling submissions in redundancy mode
    const allSubmitted = db
      .prepare('SELECT * FROM annotations WHERE task_id = ? AND is_draft = 0')
      .all(taskId) as any[];

    let newStatus = 'SUBMITTED';

    if (task.redundancy_count >= 2 && allSubmitted.length >= task.redundancy_count) {
      // Check if they disagree on single_choice or rating
      let hasDisagreement = false;
      const first = JSON.parse(allSubmitted[0].answers_json);
      for (let i = 1; i < allSubmitted.length; i++) {
        const other = JSON.parse(allSubmitted[i].answers_json);
        for (const f of schemaFields) {
          if (f.type === 'single_choice' || f.type === 'rating') {
            if (first[f.name] !== other[f.name]) {
              hasDisagreement = true;
              break;
            }
          }
        }
        if (hasDisagreement) break;
      }

      if (hasDisagreement) {
        newStatus = 'DISPUTED';
      }
    }

    db.prepare(`
      UPDATE annotation_tasks
      SET status = ?, revision = revision + 1, updated_at = ?
      WHERE id = ?
    `).run(newStatus, now, taskId);

    db.exec('COMMIT;');

    logAuditEvent({
      workspaceId: task.workspace_id,
      actorId: user.id,
      action: 'ANNOTATION_SUBMITTED',
      targetType: 'TASK',
      targetId: taskId,
      details: { revision: nextRevision, status: newStatus },
    });

    return NextResponse.json({
      success: true,
      status: newStatus,
      revision: nextRevision,
      submittedAt: now,
    });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
