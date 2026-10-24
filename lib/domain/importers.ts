// RFC 4180 CSV and JSONL Parser & Validator for LabelForge
import { createHash } from 'node:crypto';

export interface RowError {
  rowIndex: number;
  field?: string;
  code: string;
  message: string;
}

export interface ImportPreviewResult {
  fileType: 'csv' | 'jsonl';
  totalRows: number;
  validRows: number;
  invalidRows: number;
  detectedFields: string[];
  previewRows: Record<string, any>[];
  errors: RowError[];
  allRecords: Array<{
    stableId: string;
    sourceOrder: number;
    data: Record<string, any>;
    contentHash: string;
  }>;
}

/**
 * Parses RFC 4180 CSV text handling quoted fields, double quotes, and multiline cells.
 */
export function parseCSV(csvText: string): string[][] {
  const cleanText = csvText.replace(/^\uFEFF/, ''); // strip BOM
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" -> "
          currentCell += '"';
          i++;
        } else {
          // Closing quote
          insideQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
  }

  // Final cell and row if any
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Validates and previews a CSV dataset.
 */
export function validateAndPreviewCSV(
  csvContent: string,
  options: { maxRows?: number; idField?: string } = {}
): ImportPreviewResult {
  const maxRows = options.maxRows || 10000;
  const rawRows = parseCSV(csvContent);
  const errors: RowError[] = [];

  if (rawRows.length === 0) {
    return {
      fileType: 'csv',
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      detectedFields: [],
      previewRows: [],
      errors: [{ rowIndex: 0, code: 'EMPTY_FILE', message: 'File is empty or contains no valid rows.' }],
      allRecords: [],
    };
  }

  const headers = rawRows[0];
  const detectedFields = headers.map((h, i) => h || `column_${i + 1}`);

  // Check header uniqueness
  const headerSet = new Set<string>();
  headers.forEach((h, idx) => {
    if (!h) {
      errors.push({ rowIndex: 1, field: `column_${idx + 1}`, code: 'MISSING_HEADER', message: 'Header column name cannot be empty.' });
    } else if (headerSet.has(h)) {
      errors.push({ rowIndex: 1, field: h, code: 'DUPLICATE_HEADER', message: `Duplicate header column name: "${h}".` });
    } else {
      headerSet.add(h);
    }
  });

  const validRecords: Array<{
    stableId: string;
    sourceOrder: number;
    data: Record<string, any>;
    contentHash: string;
  }> = [];

  const seenIds = new Set<string>();
  const dataRows = rawRows.slice(1);
  const totalRows = Math.min(dataRows.length, maxRows);

  if (dataRows.length > maxRows) {
    errors.push({
      rowIndex: maxRows + 1,
      code: 'ROW_LIMIT_EXCEEDED',
      message: `File exceeds maximum allowed rows (${maxRows}). Only the first ${maxRows} rows are processed.`,
    });
  }

  for (let i = 0; i < totalRows; i++) {
    const row = dataRows[i];
    const rowIndex = i + 2; // 1-indexed, skipping header

    if (row.length !== headers.length) {
      errors.push({
        rowIndex,
        code: 'COLUMN_COUNT_MISMATCH',
        message: `Expected ${headers.length} columns, but row contains ${row.length} columns.`,
      });
      continue;
    }

    const recordData: Record<string, any> = {};
    headers.forEach((h, colIdx) => {
      recordData[h] = row[colIdx] ?? '';
    });

    // Content hash
    const canonicalJson = JSON.stringify(recordData, Object.keys(recordData).sort());
    const contentHash = createHash('sha256').update(canonicalJson).digest('hex');

    // Stable ID
    let stableId = '';
    if (options.idField && recordData[options.idField]) {
      stableId = String(recordData[options.idField]).trim();
    } else if (recordData['id'] || recordData['ID'] || recordData['record_id']) {
      stableId = String(recordData['id'] || recordData['ID'] || recordData['record_id']).trim();
    } else {
      stableId = `rec_${contentHash.slice(0, 12)}`;
    }

    if (seenIds.has(stableId)) {
      errors.push({
        rowIndex,
        field: 'id',
        code: 'DUPLICATE_IDENTIFIER',
        message: `Duplicate record identifier "${stableId}". Each record must have a unique identity.`,
      });
      continue;
    }
    seenIds.add(stableId);

    validRecords.push({
      stableId,
      sourceOrder: i + 1,
      data: recordData,
      contentHash,
    });
  }

  return {
    fileType: 'csv',
    totalRows,
    validRows: validRecords.length,
    invalidRows: totalRows - validRecords.length,
    detectedFields,
    previewRows: validRecords.slice(0, 10).map((r) => r.data),
    errors,
    allRecords: validRecords,
  };
}

/**
 * Validates and previews a JSONL (newline-delimited JSON) dataset.
 */
export function validateAndPreviewJSONL(
  jsonlContent: string,
  options: { maxRows?: number; idField?: string } = {}
): ImportPreviewResult {
  const maxRows = options.maxRows || 10000;
  const lines = jsonlContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const errors: RowError[] = [];
  const fieldsSet = new Set<string>();

  if (lines.length === 0) {
    return {
      fileType: 'jsonl',
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      detectedFields: [],
      previewRows: [],
      errors: [{ rowIndex: 0, code: 'EMPTY_FILE', message: 'JSONL file is empty.' }],
      allRecords: [],
    };
  }

  const validRecords: Array<{
    stableId: string;
    sourceOrder: number;
    data: Record<string, any>;
    contentHash: string;
  }> = [];

  const seenIds = new Set<string>();
  const totalRows = Math.min(lines.length, maxRows);

  if (lines.length > maxRows) {
    errors.push({
      rowIndex: maxRows + 1,
      code: 'ROW_LIMIT_EXCEEDED',
      message: `File exceeds maximum allowed rows (${maxRows}).`,
    });
  }

  for (let i = 0; i < totalRows; i++) {
    const line = lines[i];
    const rowIndex = i + 1;

    let parsed: any;
    try {
      parsed = JSON.parse(line);
    } catch (err: any) {
      errors.push({
        rowIndex,
        code: 'MALFORMED_JSON',
        message: `JSON parsing syntax error at line ${rowIndex}: ${err.message}`,
      });
      continue;
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      errors.push({
        rowIndex,
        code: 'INVALID_OBJECT',
        message: `Line ${rowIndex} must be a JSON object, received ${typeof parsed}.`,
      });
      continue;
    }

    Object.keys(parsed).forEach((k) => fieldsSet.add(k));

    const canonicalJson = JSON.stringify(parsed, Object.keys(parsed).sort());
    const contentHash = createHash('sha256').update(canonicalJson).digest('hex');

    let stableId = '';
    if (options.idField && parsed[options.idField]) {
      stableId = String(parsed[options.idField]).trim();
    } else if (parsed['id'] || parsed['ID'] || parsed['record_id']) {
      stableId = String(parsed['id'] || parsed['ID'] || parsed['record_id']).trim();
    } else {
      stableId = `rec_${contentHash.slice(0, 12)}`;
    }

    if (seenIds.has(stableId)) {
      errors.push({
        rowIndex,
        field: 'id',
        code: 'DUPLICATE_IDENTIFIER',
        message: `Duplicate record identifier "${stableId}".`,
      });
      continue;
    }
    seenIds.add(stableId);

    validRecords.push({
      stableId,
      sourceOrder: i + 1,
      data: parsed,
      contentHash,
    });
  }

  return {
    fileType: 'jsonl',
    totalRows,
    validRows: validRecords.length,
    invalidRows: totalRows - validRecords.length,
    detectedFields: Array.from(fieldsSet),
    previewRows: validRecords.slice(0, 10).map((r) => r.data),
    errors,
    allRecords: validRecords,
  };
}
