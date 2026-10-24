import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, logAuditEvent } from '@/lib/auth/session';
import { serializeCanonicalJSONL, generateProvenanceManifest, ExportItem } from '@/lib/domain/export';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const db = getDb();

  const releases = db
    .prepare('SELECT * FROM dataset_releases WHERE project_id = ? ORDER BY created_at DESC')
    .all(projectId) as any[];

  return NextResponse.json({
    releases: releases.map((r) => ({
      ...r,
      manifest: JSON.parse(r.manifest_json),
    })),
  });
}

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

  // Check role: Owner or Manager
  const membership = db
    .prepare('SELECT role FROM workspace_memberships WHERE workspace_id = ? AND user_id = ?')
    .get(project.workspace_id, user.id) as any;

  if (!membership || (membership.role !== 'OWNER' && membership.role !== 'MANAGER')) {
    return NextResponse.json(
      { error: 'Permission denied: Only Owners and Managers can publish dataset releases.' },
      { status: 403 }
    );
  }

  const body = await req.json();
  const versionTag = body.versionTag?.trim() || `v1.${Date.now().toString().slice(-3)}.0`;

  // Schema
  const schemaRow = db
    .prepare('SELECT * FROM annotation_schema_versions WHERE id = ?')
    .get(project.current_schema_version_id) as any;

  if (!schemaRow) {
    return NextResponse.json({ error: 'No active schema version found for project.' }, { status: 400 });
  }

  const schemaFields = JSON.parse(schemaRow.schema_json);

  // Collect tasks that are ACCEPTED
  const tasks = db
    .prepare(`
      SELECT t.*, r.stable_id, r.source_order, r.data_json
      FROM annotation_tasks t
      JOIN dataset_records r ON t.dataset_record_id = r.id
      WHERE t.project_id = ? AND t.status = 'ACCEPTED'
      ORDER BY r.source_order ASC
    `)
    .all(projectId) as any[];

  if (tasks.length === 0) {
    return NextResponse.json(
      { error: 'Cannot publish release: No accepted/completed tasks in this project yet.' },
      { status: 400 }
    );
  }

  const exportItems: ExportItem[] = tasks.map((t) => {
    // Check adjudication first
    const adj = db.prepare('SELECT * FROM adjudications WHERE task_id = ?').get(t.id) as any;
    let finalAnswers: Record<string, any> = {};
    let adjudicatedBy: string | undefined = undefined;

    if (adj) {
      finalAnswers = JSON.parse(adj.chosen_answer_json);
      adjudicatedBy = adj.adjudicator_id;
    } else {
      // Find latest approved or submitted annotation
      const ann = db
        .prepare('SELECT * FROM annotations WHERE task_id = ? AND is_draft = 0 ORDER BY updated_at DESC')
        .get(t.id) as any;
      if (ann) {
        finalAnswers = JSON.parse(ann.answers_json);
      }
    }

    return {
      recordId: t.dataset_record_id,
      stableId: t.stable_id,
      sourceOrder: t.source_order,
      inputData: JSON.parse(t.data_json),
      annotationAnswers: finalAnswers,
      status: t.status,
      adjudicatedBy,
    };
  });

  const { checksumSha256 } = serializeCanonicalJSONL(exportItems);
  const releaseId = `rel_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const manifest = generateProvenanceManifest({
    releaseId,
    versionTag,
    projectName: project.name,
    projectId: project.id,
    schemaVersion: schemaRow.version_num,
    schemaId: schemaRow.id,
    datasetVersionId: project.current_dataset_version_id || 'dsv_v1',
    recordCount: tasks.length,
    completedTaskCount: tasks.length,
    selectionPolicy: 'ACCEPTED_OR_ADJUDICATED_ONLY',
    checksumSha256,
    publishedBy: `${user.name} (${user.email})`,
    schemaFields,
  });

  try {
    db.prepare(`
      INSERT INTO dataset_releases (id, project_id, version_tag, schema_version_id, dataset_version_id, record_count, completed_task_count, checksum, manifest_json, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      releaseId,
      projectId,
      versionTag,
      schemaRow.id,
      project.current_dataset_version_id || 'dsv_v1',
      tasks.length,
      tasks.length,
      checksumSha256,
      JSON.stringify(manifest),
      user.id,
      now
    );

    logAuditEvent({
      workspaceId: project.workspace_id,
      actorId: user.id,
      action: 'DATASET_RELEASED',
      targetType: 'RELEASE',
      targetId: releaseId,
      details: { versionTag, recordCount: tasks.length, checksum: checksumSha256 },
    });

    return NextResponse.json({
      success: true,
      releaseId,
      versionTag,
      checksum: checksumSha256,
      manifest,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
