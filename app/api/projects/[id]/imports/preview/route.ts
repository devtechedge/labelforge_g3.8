import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { validateAndPreviewCSV, validateAndPreviewJSONL } from '@/lib/domain/importers';
import { previewBatchCache } from '@/lib/domain/preview-cache';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const user = await getCurrentUser();
  const db = getDb();

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as any;
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Check role
  const membership = db
    .prepare('SELECT role FROM workspace_memberships WHERE workspace_id = ? AND user_id = ?')
    .get(project.workspace_id, user.id) as any;

  if (!membership || (membership.role !== 'OWNER' && membership.role !== 'MANAGER')) {
    return NextResponse.json(
      { error: 'Permission denied: Only Owners and Managers can import datasets.' },
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const rawText = formData.get('rawText') as string | null;
    const filename = file ? file.name : (formData.get('filename') as string) || 'dataset.csv';

    let content = '';
    if (file) {
      content = await file.text();
    } else if (rawText) {
      content = rawText;
    } else {
      return NextResponse.json({ error: 'No file or text payload provided.' }, { status: 400 });
    }

    if (!content.trim()) {
      return NextResponse.json({ error: 'File or content is empty.' }, { status: 400 });
    }

    // Determine type by filename or format
    const isJsonl = filename.endsWith('.jsonl') || content.trim().startsWith('{');
    const previewResult = isJsonl
      ? validateAndPreviewJSONL(content, { maxRows: 10000 })
      : validateAndPreviewCSV(content, { maxRows: 10000 });

    const batchId = `imp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    // Cache batch data in memory for commit step
    previewBatchCache.set(batchId, {
      batchId,
      projectId,
      workspaceId: project.workspace_id,
      filename,
      fileType: previewResult.fileType,
      allRecords: previewResult.allRecords,
      totalRows: previewResult.totalRows,
      validRows: previewResult.validRows,
      invalidRows: previewResult.invalidRows,
      createdAt: now,
      createdBy: user.id,
    });

    // Also persist import batch and errors to DB
    db.prepare(`
      INSERT INTO import_batches (id, project_id, filename, file_type, total_rows, valid_rows, error_rows, status, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PREVIEW', ?, ?)
    `).run(
      batchId,
      projectId,
      filename,
      previewResult.fileType,
      previewResult.totalRows,
      previewResult.validRows,
      previewResult.invalidRows,
      user.id,
      now
    );

    const insertErr = db.prepare(`
      INSERT INTO import_row_errors (id, batch_id, row_index, field_name, error_code, error_message)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    previewResult.errors.slice(0, 50).forEach((err, idx) => {
      insertErr.run(`err_${batchId}_${idx}`, batchId, err.rowIndex, err.field || null, err.code, err.message);
    });

    return NextResponse.json({
      batchId,
      filename,
      fileType: previewResult.fileType,
      totalRows: previewResult.totalRows,
      validRows: previewResult.validRows,
      invalidRows: previewResult.invalidRows,
      detectedFields: previewResult.detectedFields,
      previewRows: previewResult.previewRows,
      errors: previewResult.errors,
    });
  } catch (err: any) {
    return NextResponse.json({ error: `Upload validation failed: ${err.message}` }, { status: 500 });
  }
}
