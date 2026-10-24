import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCSV, validateAndPreviewCSV, validateAndPreviewJSONL } from '../lib/domain/importers.ts';
import { calculateCohensKappa, calculateMultiLabelJaccard, calculateTextSpanIoU } from '../lib/domain/agreement.ts';
import { checkOptimisticRevision, validateTaskTransition } from '../lib/domain/concurrency.ts';
import { sanitizeCSVCell, serializeCanonicalJSONL } from '../lib/domain/export.ts';

test('RFC 4180 CSV parser handles quotes, escaped quotes, and multiline cells', () => {
  const csv = `id,review_text,rating\n1,"Great battery, lasts ""all day""",5\n2,"Line one\nLine two with, comma",4`;
  const parsed = parseCSV(csv);
  assert.equal(parsed.length, 3);
  assert.equal(parsed[1][1], 'Great battery, lasts "all day"');
  assert.equal(parsed[2][1], 'Line one\nLine two with, comma');
});

test('CSV validator reports duplicate IDs and column count mismatch', () => {
  const malformed = `id,text\n1,hello\n1,duplicate\n3,too,many,columns`;
  const result = validateAndPreviewCSV(malformed);
  assert.equal(result.totalRows, 3);
  assert.equal(result.validRows, 1);
  assert.equal(result.errors.length, 2);
  assert.ok(result.errors.some((e) => e.code === 'DUPLICATE_IDENTIFIER'));
  assert.ok(result.errors.some((e) => e.code === 'COLUMN_COUNT_MISMATCH'));
});

test('JSONL validator parses valid objects and isolates syntax errors', () => {
  const jsonl = `{"id": "a", "text": "Valid row"}\n{malformed json}\n{"id": "b", "text": "Another row"}`;
  const result = validateAndPreviewJSONL(jsonl);
  assert.equal(result.totalRows, 3);
  assert.equal(result.validRows, 2);
  assert.equal(result.invalidRows, 1);
  assert.ok(result.errors.some((e) => e.code === 'MALFORMED_JSON'));
});

test('Cohen Kappa returns insufficient_sample when sample size is less than 5', () => {
  const pairs = [
    { rater1: 'POS', rater2: 'POS' },
    { rater1: 'NEG', rater2: 'NEG' },
    { rater1: 'POS', rater2: 'NEG' },
  ];
  const res = calculateCohensKappa(pairs);
  assert.equal(res.status, 'insufficient_sample');
  assert.equal(res.sampleSize, 3);
  assert.equal(res.kappa, null);
});

test('Cohen Kappa correctly computes kappa on paired data with N >= 5', () => {
  const pairs = [
    { rater1: 'POS', rater2: 'POS' },
    { rater1: 'POS', rater2: 'POS' },
    { rater1: 'NEG', rater2: 'NEG' },
    { rater1: 'NEG', rater2: 'NEG' },
    { rater1: 'POS', rater2: 'NEG' },
    { rater1: 'NEG', rater2: 'POS' },
  ];
  const res = calculateCohensKappa(pairs);
  assert.equal(res.status, 'valid');
  assert.equal(res.sampleSize, 6);
  assert.ok(typeof res.kappa === 'number');
  assert.ok(res.observedAgreement > 0);
});

test('Multi-label Jaccard calculates exact set overlap', () => {
  const pairs = [
    { rater1: ['hardware', 'battery'], rater2: ['battery', 'hardware'] },
    { rater1: ['hardware'], rater2: ['software'] },
  ];
  const res = calculateMultiLabelJaccard(pairs);
  assert.equal(res.status, 'valid');
  assert.equal(res.averageJaccard, 0.5);
});

test('Text Span IoU calculates character overlap', () => {
  const pairs = [
    {
      rater1: [{ start: 0, end: 10, label: 'issue' }],
      rater2: [{ start: 5, end: 15, label: 'issue' }],
    },
  ];
  const res = calculateTextSpanIoU(pairs);
  assert.equal(res.status, 'valid');
  assert.ok(Math.abs(res.averageIoU - 0.3333) < 0.001);
});

test('Optimistic concurrency catches revision mismatch', () => {
  const match = checkOptimisticRevision(3, 3);
  assert.equal(match.conflict, false);

  const mismatch = checkOptimisticRevision(4, 3);
  assert.equal(mismatch.conflict, true);
  assert.equal(mismatch.currentRevision, 4);
});

test('Task transition enforces valid states', () => {
  const valid = validateTaskTransition('ASSIGNED', 'IN_PROGRESS');
  assert.equal(valid.valid, true);

  const invalid = validateTaskTransition('UNASSIGNED', 'ACCEPTED');
  assert.equal(invalid.valid, false);
});

test('CSV formula sanitization prefixes dangerous characters', () => {
  assert.equal(sanitizeCSVCell('=SUM(A1:A10)'), "'=SUM(A1:A10)");
  assert.equal(sanitizeCSVCell('@HYPERLINK("evil")'), "\"\'@HYPERLINK(\"\"evil\"\")\"");
  assert.equal(sanitizeCSVCell('Normal text'), 'Normal text');
});

test('Canonical JSONL export is deterministic and produces consistent checksum', () => {
  const items = [
    {
      recordId: 'r2',
      stableId: 'rec_2',
      sourceOrder: 2,
      inputData: { text: 'Second' },
      annotationAnswers: { sentiment: 'pos' },
      status: 'ACCEPTED',
    },
    {
      recordId: 'r1',
      stableId: 'rec_1',
      sourceOrder: 1,
      inputData: { text: 'First' },
      annotationAnswers: { sentiment: 'neg' },
      status: 'ACCEPTED',
    },
  ];

  const export1 = serializeCanonicalJSONL(items);
  const export2 = serializeCanonicalJSONL([...items].reverse());

  assert.equal(export1.content, export2.content);
  assert.equal(export1.checksumSha256, export2.checksumSha256);
  assert.ok(export1.content.includes('{"sentiment":"neg"}'));
});
