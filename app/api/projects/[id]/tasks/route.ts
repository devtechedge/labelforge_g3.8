import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const user = await getCurrentUser();
  const db = getDb();

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get('status') || 'ALL';
  const assigneeFilter = url.searchParams.get('assignee') || 'ALL';
  const search = url.searchParams.get('search')?.trim() || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '25', 10)));
  const offset = (page - 1) * limit;

  let query = `
    SELECT
      t.*,
      r.stable_id,
      r.source_order,
      r.data_json,
      u.name as assignee_name,
      u.avatar as assignee_avatar,
      (SELECT COUNT(*) FROM annotations a WHERE a.task_id = t.id) as annotation_count,
      (SELECT COUNT(*) FROM reviews rev WHERE rev.task_id = t.id) as review_count
    FROM annotation_tasks t
    JOIN dataset_records r ON t.dataset_record_id = r.id
    LEFT JOIN users u ON t.assigned_to = u.id
    WHERE t.project_id = ?
  `;

  const queryParams: any[] = [projectId];

  if (statusFilter !== 'ALL') {
    query += ' AND t.status = ?';
    queryParams.push(statusFilter);
  }

  if (assigneeFilter === 'UNASSIGNED') {
    query += ' AND t.assigned_to IS NULL';
  } else if (assigneeFilter !== 'ALL') {
    query += ' AND t.assigned_to = ?';
    queryParams.push(assigneeFilter);
  }

  if (search) {
    query += ' AND (r.stable_id LIKE ? OR r.data_json LIKE ?)';
    queryParams.push(`%${search}%`, `%${search}%`);
  }

  // Count total matching
  const countQuery = `SELECT COUNT(*) as total FROM (${query})`;
  const countRes = db.prepare(countQuery).get(...queryParams) as { total: number };
  const total = countRes?.total || 0;

  // Add order and pagination
  query += ' ORDER BY r.source_order ASC LIMIT ? OFFSET ?';
  queryParams.push(limit, offset);

  const tasks = db.prepare(query).all(...queryParams) as any[];

  return NextResponse.json({
    tasks: tasks.map((t) => ({
      ...t,
      data: JSON.parse(t.data_json),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
}
