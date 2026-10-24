import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { serializeCanonicalJSONL, serializeCanonicalCSV, ExportItem } from '@/lib/domain/export';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: releaseId } = await params;
  const url = new URL(req.url);
  const format = url.searchParams.get('format') === 'csv' ? 'csv' : 'jsonl';
  const db = getDb();

  const release = db.prepare('SELECT * FROM dataset_releases WHERE id = ?').get(releaseId) as any;
  if (!release) {
    return NextResponse.json({ error: 'Release not found' }, { status: 404 });
  }

  const manifest = JSON.parse(release.manifest_json);

  const schemaRow = db
    .prepare('SELECT schema_json FROM annotation_schema_versions WHERE id = ?')
    .get(release.schema_version_id) as any;

  const schemaFields = schemaRow ? JSON.parse(schemaRow.schema_json) : [];

  // Get accepted tasks
  const tasks = db
    .prepare(`
      SELECT t.*, r.stable_id, r.source_order, r.data_json
      FROM annotation_tasks t
      JOIN dataset_records r ON t.dataset_record_id = r.id
      WHERE t.project_id = ? AND t.status = 'ACCEPTED'
      ORDER BY r.source_order ASC
    `)
    .all(release.project_id) as any[];

  const exportItems: ExportItem[] = tasks.map((t) => {
    const adj = db.prepare('SELECT * FROM adjudications WHERE task_id = ?').get(t.id) as any;
    let finalAnswers: Record<string, any> = {};
    let adjudicatedBy: string | undefined = undefined;

    if (adj) {
      finalAnswers = JSON.parse(adj.chosen_answer_json);
      adjudicatedBy = adj.adjudicator_id;
    } else {
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

  const filename = `labelforge-${release.version_tag}-${release.id}.${format}`;

  if (format === 'csv') {
    const { content, checksumSha256 } = serializeCanonicalCSV(exportItems, schemaFields);
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Checksum-SHA256': checksumSha256,
        'X-Record-Count': String(exportItems.length),
      },
    });
  } else {
    const { content, checksumSha256 } = serializeCanonicalJSONL(exportItems);
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Checksum-SHA256': checksumSha256,
        'X-Record-Count': String(exportItems.length),
      },
    });
  }
}
