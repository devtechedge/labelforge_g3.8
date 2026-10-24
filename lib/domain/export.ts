// Domain Logic: Canonical Deterministic Export Serialization & Manifest
import { createHash } from 'node:crypto';
import type { ReleaseManifest, SchemaField } from './types.ts';

export interface ExportItem {
  recordId: string;
  stableId: string;
  sourceOrder: number;
  inputData: Record<string, any>;
  annotationAnswers: Record<string, any>;
  annotatorId?: string;
  status: string;
  reviewedBy?: string;
  reviewDecision?: string;
  adjudicatedBy?: string;
}

/**
 * Sanitizes cell values to prevent CSV formula injection (e.g. '=1+1', '@SUM()', '+cmd').
 */
export function sanitizeCSVCell(value: any): string {
  if (value === null || value === undefined) return '';
  let str = typeof value === 'object' ? JSON.stringify(value) : String(value);

  // If starts with dangerous spreadsheet formula triggers, prefix with single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Quote escaping
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Recursively sorts object keys for deterministic canonical representation.
 */
export function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sortObjectKeys);
  const sorted: Record<string, any> = {};
  Object.keys(obj).sort().forEach((key) => {
    sorted[key] = sortObjectKeys(obj[key]);
  });
  return sorted;
}

/**
 * Deterministically serializes items to canonical JSONL (sorted by sourceOrder).
 */
export function serializeCanonicalJSONL(items: ExportItem[]): {
  content: string;
  checksumSha256: string;
} {
  // Sort items strictly by sourceOrder
  const sorted = [...items].sort((a, b) => a.sourceOrder - b.sourceOrder);

  const lines = sorted.map((item) => {
    const canonicalItem: Record<string, any> = {
      annotation: item.annotationAnswers || {},
      input: item.inputData || {},
      record_id: item.recordId,
      source_order: item.sourceOrder,
      stable_id: item.stableId,
      status: item.status,
    };
    if (item.annotatorId) canonicalItem.annotator_id = item.annotatorId;
    if (item.reviewDecision) canonicalItem.review_decision = item.reviewDecision;
    if (item.adjudicatedBy) canonicalItem.adjudicated_by = item.adjudicatedBy;

    return JSON.stringify(sortObjectKeys(canonicalItem));
  });

  const content = lines.join('\n') + (lines.length > 0 ? '\n' : '');
  const checksumSha256 = createHash('sha256').update(content).digest('hex');

  return { content, checksumSha256 };
}

/**
 * Deterministically serializes items to safe CSV.
 */
export function serializeCanonicalCSV(items: ExportItem[], schemaFields: SchemaField[]): {
  content: string;
  checksumSha256: string;
} {
  const sorted = [...items].sort((a, b) => a.sourceOrder - b.sourceOrder);

  // Discover input keys
  const inputKeys = new Set<string>();
  sorted.forEach((item) => {
    Object.keys(item.inputData || {}).forEach((k) => inputKeys.add(k));
  });
  const sortedInputKeys = Array.from(inputKeys).sort();
  const sortedFieldKeys = schemaFields.map((f) => f.name).sort();

  const headers = [
    'record_id',
    'stable_id',
    'source_order',
    'status',
    ...sortedInputKeys.map((k) => `input_${k}`),
    ...sortedFieldKeys.map((k) => `label_${k}`),
  ];

  const rows = [headers.map(sanitizeCSVCell).join(',')];

  sorted.forEach((item) => {
    const rowCells: string[] = [
      sanitizeCSVCell(item.recordId),
      sanitizeCSVCell(item.stableId),
      sanitizeCSVCell(item.sourceOrder),
      sanitizeCSVCell(item.status),
    ];

    sortedInputKeys.forEach((k) => {
      rowCells.push(sanitizeCSVCell(item.inputData?.[k]));
    });

    sortedFieldKeys.forEach((k) => {
      rowCells.push(sanitizeCSVCell(item.annotationAnswers?.[k]));
    });

    rows.push(rowCells.join(','));
  });

  const content = rows.join('\r\n') + '\r\n';
  const checksumSha256 = createHash('sha256').update(content).digest('hex');

  return { content, checksumSha256 };
}

/**
 * Generates an immutable provenance manifest for a dataset release.
 */
export function generateProvenanceManifest(params: {
  releaseId: string;
  versionTag: string;
  projectName: string;
  projectId: string;
  schemaVersion: number;
  schemaId: string;
  datasetVersionId: string;
  recordCount: number;
  completedTaskCount: number;
  selectionPolicy: string;
  checksumSha256: string;
  publishedBy: string;
  schemaFields: SchemaField[];
}): ReleaseManifest {
  return {
    releaseId: params.releaseId,
    versionTag: params.versionTag,
    projectName: params.projectName,
    projectId: params.projectId,
    schemaVersion: params.schemaVersion,
    schemaId: params.schemaId,
    datasetVersionId: params.datasetVersionId,
    recordCount: params.recordCount,
    completedTaskCount: params.completedTaskCount,
    selectionPolicy: params.selectionPolicy,
    checksumSha256: params.checksumSha256,
    publishedAt: new Date().toISOString(),
    publishedBy: params.publishedBy,
    fieldsSummary: params.schemaFields.map((f) => ({ name: f.name, type: f.type })),
  };
}
