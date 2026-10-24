import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const db = getDb();

  const schemas = db
    .prepare('SELECT * FROM annotation_schema_versions WHERE project_id = ? ORDER BY version_num DESC')
    .all(projectId) as any[];

  return NextResponse.json({
    schemas: schemas.map((s) => ({
      ...s,
      fields: JSON.parse(s.schema_json),
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

  const body = await req.json();
  const name = body.name?.trim() || 'New Schema Version';
  const description = body.description?.trim() || '';
  const fields = body.fields || [];
  const guidelines = body.guidelines?.trim() || '';

  if (!Array.isArray(fields) || fields.length === 0) {
    return NextResponse.json({ error: 'Schema must contain at least one field.' }, { status: 400 });
  }

  // Determine next version number
  const latest = db
    .prepare('SELECT MAX(version_num) as max_ver FROM annotation_schema_versions WHERE project_id = ?')
    .get(projectId) as { max_ver: number | null };

  const nextVersionNum = (latest?.max_ver || 0) + 1;
  const schemaId = `sch_${Date.now()}_v${nextVersionNum}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO annotation_schema_versions (id, project_id, version_num, name, description, schema_json, guidelines, published, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(schemaId, projectId, nextVersionNum, name, description, JSON.stringify(fields), guidelines, user.id, now);

  // Update project current schema
  db.prepare('UPDATE projects SET current_schema_version_id = ?, updated_at = ? WHERE id = ?').run(
    schemaId,
    now,
    projectId
  );

  return NextResponse.json({
    success: true,
    schemaId,
    versionNum: nextVersionNum,
  });
}
