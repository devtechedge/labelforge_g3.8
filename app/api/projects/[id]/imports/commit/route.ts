import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, logAuditEvent } from '@/lib/auth/session';
import { previewBatchCache } from '@/lib/domain/preview-cache';
import { createHash } from 'node:crypto';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const user = await getCurrentUser();
  const db = getDb();

  const body = await req.json();
  const batchId = body.batchId;
  const datasetName = body.datasetName?.trim() || 'Imported Dataset';

  const cachedBatch = previewBatchCache.get(batchId);
  if (!cachedBatch || cachedBatch.projectId !== projectId) {
    return NextResponse.json({ error: 'Import batch preview expired or not found. Please re-upload the file.' }, { status: 404 });
  }

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as any;
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Schema check: we need a published schema version or use/create default
  let schemaVersionId = project.current_schema_version_id;
  if (!schemaVersionId) {
    const existingSchema = db.prepare('SELECT id FROM annotation_schema_versions WHERE project_id = ? ORDER BY version_num DESC').get(projectId) as any;
    if (existingSchema) {
      schemaVersionId = existingSchema.id;
    } else {
      // Create default minimal schema if none exists
      schemaVersionId = `sch_${Date.now()}`;
      const defaultFields = [
        {
          id: 'f_category',
          name: 'category',
          label: 'Category',
          type: 'single_choice',
          required: true,
          options: [
            { id: 'general', label: 'General', shortcut: '1' },
            { id: 'flagged', label: 'Flagged', shortcut: '2' },
          ],
        },
      ];
      db.prepare(`
        INSERT INTO annotation_schema_versions (id, project_id, version_num, name, description, schema_json, guidelines, published, created_by, created_at)
        VALUES (?, ?, 1, 'Default Schema v1', 'Auto-created base schema for import', ?, '', 1, ?, ?)
      `).run(schemaVersionId, projectId, JSON.stringify(defaultFields), user.id, new Date().toISOString());

      db.prepare('UPDATE projects SET current_schema_version_id = ? WHERE id = ?').run(schemaVersionId, projectId);
    }
  }

  const now = new Date().toISOString();
  const datasetId = `ds_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const datasetVersionId = `dsv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  // Compute checksum across all valid records
  const allJson = JSON.stringify(cachedBatch.allRecords);
  const versionChecksum = createHash('sha256').update(allJson).digest('hex');

  try {
    // Transaction
    db.exec('BEGIN TRANSACTION;');

    // 1. Create dataset
    db.prepare('INSERT INTO datasets (id, project_id, name, created_at) VALUES (?, ?, ?, ?)').run(
      datasetId,
      projectId,
      datasetName,
      now
    );

    // 2. Create dataset version
    db.prepare(`
      INSERT INTO dataset_versions (id, dataset_id, version_num, source_name, record_count, checksum, created_at)
      VALUES (?, ?, 1, ?, ?, ?, ?)
    `).run(
      datasetVersionId,
      datasetId,
      cachedBatch.filename,
      cachedBatch.validRows,
      versionChecksum,
      now
    );

    // 3. Insert records and create tasks
    const insertRec = db.prepare(`
      INSERT INTO dataset_records (id, dataset_version_id, stable_id, source_order, data_json, content_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertTask = db.prepare(`
      INSERT INTO annotation_tasks (id, project_id, dataset_record_id, schema_version_id, status, priority, revision, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'UNASSIGNED', 'MEDIUM', 1, ?, ?)
    `);

    cachedBatch.allRecords.forEach((record: any, idx: number) => {
      const recordId = `rec_${datasetVersionId}_${idx + 1}`;
      insertRec.run(
        recordId,
        datasetVersionId,
        record.stableId,
        record.sourceOrder,
        JSON.stringify(record.data),
        record.contentHash
      );

      const taskId = `task_${Date.now()}_${idx + 1}_${Math.random().toString(36).slice(2, 5)}`;
      insertTask.run(taskId, projectId, recordId, schemaVersionId, now, now);
    });

    // 4. Update project's current dataset version
    db.prepare('UPDATE projects SET current_dataset_version_id = ?, updated_at = ? WHERE id = ?').run(
      datasetVersionId,
      now,
      projectId
    );

    // 5. Update import batch status
    db.prepare('UPDATE import_batches SET status = ? WHERE id = ?').run('COMMITTED', batchId);

    db.exec('COMMIT;');

    // Remove from in-memory preview cache
    previewBatchCache.delete(batchId);

    logAuditEvent({
      workspaceId: project.workspace_id,
      actorId: user.id,
      action: 'DATASET_COMMITTED',
      targetType: 'DATASET_VERSION',
      targetId: datasetVersionId,
      details: {
        datasetName,
        filename: cachedBatch.filename,
        recordCount: cachedBatch.validRows,
        checksum: versionChecksum,
      },
    });

    return NextResponse.json({
      success: true,
      datasetId,
      datasetVersionId,
      recordsCreated: cachedBatch.validRows,
      tasksCreated: cachedBatch.validRows,
    });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    return NextResponse.json({ error: `Failed to commit batch: ${err.message}` }, { status: 500 });
  }
}
