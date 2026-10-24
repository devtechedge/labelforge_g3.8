import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { calculateCohensKappa, calculateMultiLabelJaccard, calculateTextSpanIoU } from '@/lib/domain/agreement';

export async function GET(
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

  // Schema
  const schemaRow = db
    .prepare('SELECT schema_json FROM annotation_schema_versions WHERE id = ?')
    .get(project.current_schema_version_id) as { schema_json: string } | undefined;

  const schemaFields = schemaRow ? JSON.parse(schemaRow.schema_json) : [];

  // Find all tasks with at least 2 annotations
  const tasks = db
    .prepare(`
      SELECT t.id, t.status, t.dataset_record_id
      FROM annotation_tasks t
      WHERE t.project_id = ?
    `)
    .all(projectId) as any[];

  // Collect pairs for each schema field
  const singleChoicePairs: Record<string, Array<{ rater1: string; rater2: string }>> = {};
  const multiChoicePairs: Record<string, Array<{ rater1: string[]; rater2: string[] }>> = {};
  const spanPairs: Record<string, Array<{ rater1: any[]; rater2: any[] }>> = {};

  schemaFields.forEach((f: any) => {
    if (f.type === 'single_choice') singleChoicePairs[f.name] = [];
    if (f.type === 'multi_choice') multiChoicePairs[f.name] = [];
    if (f.type === 'text_span') spanPairs[f.name] = [];
  });

  tasks.forEach((t) => {
    const anns = db
      .prepare('SELECT answers_json, annotator_id FROM annotations WHERE task_id = ? ORDER BY created_at ASC')
      .all(t.id) as any[];

    if (anns.length >= 2) {
      const a1 = JSON.parse(anns[0].answers_json);
      const a2 = JSON.parse(anns[1].answers_json);

      schemaFields.forEach((f: any) => {
        if (f.type === 'single_choice' && a1[f.name] && a2[f.name]) {
          singleChoicePairs[f.name].push({ rater1: String(a1[f.name]), rater2: String(a2[f.name]) });
        }
        if (f.type === 'multi_choice' && Array.isArray(a1[f.name]) && Array.isArray(a2[f.name])) {
          multiChoicePairs[f.name].push({ rater1: a1[f.name], rater2: a2[f.name] });
        }
        if (f.type === 'text_span' && Array.isArray(a1[f.name]) && Array.isArray(a2[f.name])) {
          spanPairs[f.name].push({ rater1: a1[f.name], rater2: a2[f.name] });
        }
      });
    }
  });

  // Calculate metrics
  const agreementMetrics: Record<string, any> = {};

  Object.entries(singleChoicePairs).forEach(([fieldName, pairs]) => {
    agreementMetrics[fieldName] = {
      type: 'single_choice',
      metricName: "Cohen's Kappa (k)",
      result: calculateCohensKappa(pairs),
    };
  });

  Object.entries(multiChoicePairs).forEach(([fieldName, pairs]) => {
    agreementMetrics[fieldName] = {
      type: 'multi_choice',
      metricName: 'Average Jaccard Similarity',
      result: calculateMultiLabelJaccard(pairs),
    };
  });

  Object.entries(spanPairs).forEach(([fieldName, pairs]) => {
    agreementMetrics[fieldName] = {
      type: 'text_span',
      metricName: 'Character-level Span IoU',
      result: calculateTextSpanIoU(pairs),
    };
  });

  // Review decisions breakdown
  const reviewStats = db
    .prepare(`
      SELECT
        COUNT(*) as total_reviews,
        SUM(CASE WHEN decision = 'PASS' THEN 1 ELSE 0 END) as pass_count,
        SUM(CASE WHEN decision = 'RETURN_FOR_CORRECTION' THEN 1 ELSE 0 END) as return_count,
        SUM(CASE WHEN decision = 'REJECT' THEN 1 ELSE 0 END) as reject_count,
        SUM(CASE WHEN decision = 'REQUEST_ADJUDICATION' THEN 1 ELSE 0 END) as adjudication_count
      FROM reviews rev
      JOIN annotation_tasks t ON rev.task_id = t.id
      WHERE t.project_id = ?
    `)
    .get(projectId) as any;

  // Annotator throughput
  const annotatorStats = db
    .prepare(`
      SELECT u.id, u.name, u.avatar,
        COUNT(a.id) as total_annotations,
        SUM(CASE WHEN a.is_draft = 0 THEN 1 ELSE 0 END) as submitted_count
      FROM users u
      JOIN annotations a ON u.id = a.annotator_id
      JOIN annotation_tasks t ON a.task_id = t.id
      WHERE t.project_id = ?
      GROUP BY u.id
    `)
    .all(projectId);

  return NextResponse.json({
    agreementMetrics,
    redundancyCount: project.redundancy_count,
    reviewStats: {
      total: reviewStats?.total_reviews || 0,
      pass: reviewStats?.pass_count || 0,
      returned: reviewStats?.return_count || 0,
      rejected: reviewStats?.reject_count || 0,
      adjudicated: reviewStats?.adjudication_count || 0,
    },
    annotatorStats,
  });
}
