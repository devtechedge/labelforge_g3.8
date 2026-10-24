// LabelForge demo dataset seeding.
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';

export function seedDemoDataIfNeeded(db: DatabaseSync) {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount && userCount.count > 0) {
    return;
  }

  const now = new Date().toISOString();

  // 1. Demo Users
  const insertUser = db.prepare(
    'INSERT INTO users (id, email, name, avatar, title, disabled, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  insertUser.run('u_elena', 'elena@labelforge.io', 'Elena Vance', 'EV', 'Owner & ML Ops Architect', 0, now);
  insertUser.run('u_marcus', 'marcus@labelforge.io', 'Marcus Chen', 'MC', 'Senior Annotator', 0, now);
  insertUser.run('u_priya', 'priya@labelforge.io', 'Priya Sharma', 'PS', 'Domain Annotator', 0, now);
  insertUser.run('u_david', 'david@labelforge.io', 'David Kim', 'DK', 'Reviewer & Adjudication Lead', 0, now);

  // 2. Demo Workspace
  db.prepare(
    'INSERT INTO workspaces (id, name, slug, owner_id, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run('ws_core', 'Acme Research & AI Systems', 'acme-research', 'u_elena', now);

  // 3. Workspace Memberships
  const insertMember = db.prepare(
    'INSERT INTO workspace_memberships (id, workspace_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)'
  );
  insertMember.run('m_elena', 'ws_core', 'u_elena', 'OWNER', now);
  insertMember.run('m_marcus', 'ws_core', 'u_marcus', 'ANNOTATOR', now);
  insertMember.run('m_priya', 'ws_core', 'u_priya', 'ANNOTATOR', now);
  insertMember.run('m_david', 'ws_core', 'u_david', 'REVIEWER', now);

  // 4. Project 1: Customer Sentiment & Defect Workbench
  db.prepare(`
    INSERT INTO projects (id, workspace_id, name, description, status, redundancy_count, current_schema_version_id, current_dataset_version_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'proj_feedback',
    'ws_core',
    'Customer Feedback & Defect Categorization',
    'Triaging customer hardware and software reviews, isolating defect text spans, and calculating inter-annotator agreement.',
    'ACTIVE',
    2, // 2-annotator redundancy
    'sch_v1',
    'dsv_v1',
    now,
    now
  );

  // Schema v1
  const schemaV1Fields = [
    {
      id: 'f_sentiment',
      name: 'sentiment',
      label: 'Overall Sentiment',
      type: 'single_choice',
      required: true,
      description: 'Primary customer emotional tone.',
      options: [
        { id: 'positive', label: 'Positive', shortcut: '1', color: '#16a34a' },
        { id: 'neutral', label: 'Neutral', shortcut: '2', color: '#71717a' },
        { id: 'negative', label: 'Negative', shortcut: '3', color: '#dc2626' },
        { id: 'mixed', label: 'Mixed', shortcut: '4', color: '#ca8a04' },
      ],
    },
    {
      id: 'f_aspects',
      name: 'aspect_categories',
      label: 'Impacted Aspects',
      type: 'multi_choice',
      required: false,
      description: 'Select all product subsystems referenced in the text.',
      options: [
        { id: 'hardware_display', label: 'Display & Glass', shortcut: 'd' },
        { id: 'battery_power', label: 'Battery & Thermal', shortcut: 'b' },
        { id: 'software_os', label: 'Firmware & OS', shortcut: 's' },
        { id: 'audio_mic', label: 'Microphone & Audio', shortcut: 'a' },
        { id: 'build_ergonomics', label: 'Chassis & Ergonomics', shortcut: 'e' },
      ],
    },
    {
      id: 'f_spans',
      name: 'evidence_spans',
      label: 'Defect & Praise Spans',
      type: 'text_span',
      required: false,
      description: 'Highlight specific phrases in the record text that substantiate your assessment.',
      spanLabels: [
        { id: 'defect', label: 'Defect Issue', color: '#d97706' },
        { id: 'praise', label: 'Praise Feature', color: '#7c3aed' },
      ],
    },
    {
      id: 'f_urgency',
      name: 'urgency_rating',
      label: 'Customer Dissatisfaction Urgency',
      type: 'rating',
      required: true,
      description: 'Score from 1 (mild suggestion) to 5 (critical escalation or return risk).',
      ratingConfig: {
        min: 1,
        max: 5,
        labels: {
          1: 'Minor curiosity',
          3: 'Moderate issue',
          5: 'Immediate refund demand',
        },
      },
    },
  ];

  db.prepare(`
    INSERT INTO annotation_schema_versions (id, project_id, version_num, name, description, schema_json, guidelines, published, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'sch_v1',
    'proj_feedback',
    1,
    'v1.0 Baseline Feedback Schema',
    'Standard classification and span extraction schema for hardware reviews.',
    JSON.stringify(schemaV1Fields),
    'Highlight precise words rather than entire sentences for defect spans. If a customer mentions an intermittent bug, mark as Moderate issue (3).',
    1,
    'u_elena',
    now
  );

  // Dataset & Dataset Version 1
  db.prepare('INSERT INTO datasets (id, project_id, name, created_at) VALUES (?, ?, ?, ?)').run(
    'ds_reviews',
    'proj_feedback',
    'Customer Hardware Reviews (Batch A)',
    now
  );

  db.prepare(`
    INSERT INTO dataset_versions (id, dataset_id, version_num, source_name, record_count, checksum, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('dsv_v1', 'ds_reviews', 1, 'feedback_batch_2026.csv', 12, 'hash_seed_dsv_v1', now);

  // Records
  const seedRecords = [
    {
      id: 'rec_01',
      stableId: 'FDB-1001',
      order: 1,
      data: {
        customer_id: 'CUST-8491',
        device_model: 'ForgePad Pro 12',
        rating: 1,
        review_text: 'The screen keeps flickering with green scanlines whenever waking up from sleep mode. Extremely annoying for a flagship product.',
        purchase_date: '2026-09-14',
      },
    },
    {
      id: 'rec_02',
      stableId: 'FDB-1002',
      order: 2,
      data: {
        customer_id: 'CUST-9204',
        device_model: 'ForgePad Pro 12',
        rating: 5,
        review_text: 'Outstanding battery life! Lasted 14 hours of continuous video playback. The display colors are crisp and vibrant.',
        purchase_date: '2026-09-18',
      },
    },
    {
      id: 'rec_03',
      stableId: 'FDB-1003',
      order: 3,
      data: {
        customer_id: 'CUST-1049',
        device_model: 'ForgeAudio Buds',
        rating: 2,
        review_text: 'Right earbud microphone drops out during zoom calls. Colleagues say I sound like underwater robot audio.',
        purchase_date: '2026-09-21',
      },
    },
    {
      id: 'rec_04',
      stableId: 'FDB-1004',
      order: 4,
      data: {
        customer_id: 'CUST-5512',
        device_model: 'ForgePad Pro 12',
        rating: 2,
        review_text: 'Thermal throttling kicks in within 10 minutes of compiling code. The aluminum back panel gets dangerously hot to the touch.',
        purchase_date: '2026-09-22',
      },
    },
    {
      id: 'rec_05',
      stableId: 'FDB-1005',
      order: 5,
      data: {
        customer_id: 'CUST-3318',
        device_model: 'ForgeAudio Buds',
        rating: 4,
        review_text: 'Audio clarity is superb, but the charging case lid feels a bit flimsy and loose after a week of normal pocket carry.',
        purchase_date: '2026-09-25',
      },
    },
    {
      id: 'rec_06',
      stableId: 'FDB-1006',
      order: 6,
      data: {
        customer_id: 'CUST-7729',
        device_model: 'ForgePad Pro 12',
        rating: 1,
        review_text: 'Bluetooth disconnects every 5 minutes from my keyboard. Factory reset did nothing to fix it. Requesting immediate replacement.',
        purchase_date: '2026-09-28',
      },
    },
    {
      id: 'rec_07',
      stableId: 'FDB-1007',
      order: 7,
      data: {
        customer_id: 'CUST-4411',
        device_model: 'ForgeAudio Buds',
        rating: 3,
        review_text: 'Comfortable fit in ears, but the companion software app crashes immediately on launch on Android 16.',
        purchase_date: '2026-10-02',
      },
    },
    {
      id: 'rec_08',
      stableId: 'FDB-1008',
      order: 8,
      data: {
        customer_id: 'CUST-6102',
        device_model: 'ForgePad Pro 12',
        rating: 5,
        review_text: 'The magnetic stylus latency is non-existent. Best digital drawing experience I have ever had.',
        purchase_date: '2026-10-05',
      },
    },
    {
      id: 'rec_09',
      stableId: 'FDB-1009',
      order: 9,
      data: {
        customer_id: 'CUST-8833',
        device_model: 'ForgePad Pro 12',
        rating: 2,
        review_text: 'Dead pixel near the top left corner out of the box. Noticeable when reading PDF papers on white backgrounds.',
        purchase_date: '2026-10-08',
      },
    },
    {
      id: 'rec_10',
      stableId: 'FDB-1010',
      order: 10,
      data: {
        customer_id: 'CUST-2991',
        device_model: 'ForgeAudio Buds',
        rating: 4,
        review_text: 'Active noise cancellation blocks city subway roar effectively. Transparency mode sounds natural.',
        purchase_date: '2026-10-12',
      },
    },
    {
      id: 'rec_11',
      stableId: 'FDB-1011',
      order: 11,
      data: {
        customer_id: 'CUST-1940',
        device_model: 'ForgePad Pro 12',
        rating: 3,
        review_text: 'Speakers are loud and rich, but the device takes over three hours to charge with the included 30W adapter.',
        purchase_date: '2026-10-15',
      },
    },
    {
      id: 'rec_12',
      stableId: 'FDB-1012',
      order: 12,
      data: {
        customer_id: 'CUST-9011',
        device_model: 'ForgeAudio Buds',
        rating: 1,
        review_text: 'Left earbud battery dies in 40 minutes while right bud stays at 90%. Completely unusable.',
        purchase_date: '2026-10-18',
      },
    },
  ];

  const insertRecord = db.prepare(`
    INSERT INTO dataset_records (id, dataset_version_id, stable_id, source_order, data_json, content_hash)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  seedRecords.forEach((r) => {
    const jsonStr = JSON.stringify(r.data);
    const hash = createHash('sha256').update(jsonStr).digest('hex');
    insertRecord.run(r.id, 'dsv_v1', r.stableId, r.order, jsonStr, hash);
  });

  // Create Tasks & Seed Realistic States
  const insertTask = db.prepare(`
    INSERT INTO annotation_tasks (id, project_id, dataset_record_id, schema_version_id, status, priority, revision, assigned_to, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Task 1: DISPUTED (Intentional Disagreement on record 1: Display flicker)
  // Marcus labeled Sentiment: Negative, Aspect: Display & Glass, Urgency: 4
  // Priya labeled Sentiment: Mixed, Aspect: Firmware & OS, Urgency: 3
  insertTask.run('task_01', 'proj_feedback', 'rec_01', 'sch_v1', 'DISPUTED', 'HIGH', 2, 'u_marcus', now, now);

  // Task 2: ACCEPTED (Record 2: Outstanding battery life)
  insertTask.run('task_02', 'proj_feedback', 'rec_02', 'sch_v1', 'ACCEPTED', 'MEDIUM', 2, 'u_marcus', now, now);

  // Task 3: SUBMITTED (Record 3: Mic drops out)
  insertTask.run('task_03', 'proj_feedback', 'rec_03', 'sch_v1', 'SUBMITTED', 'HIGH', 2, 'u_marcus', now, now);

  // Task 4: RETURNED_FOR_CORRECTION (Record 4: Thermal throttling)
  insertTask.run('task_04', 'proj_feedback', 'rec_04', 'sch_v1', 'RETURNED_FOR_CORRECTION', 'HIGH', 2, 'u_priya', now, now);

  // Task 5: IN_PROGRESS (Record 5: Audio clarity vs flimsy case)
  insertTask.run('task_05', 'proj_feedback', 'rec_05', 'sch_v1', 'IN_PROGRESS', 'MEDIUM', 1, 'u_marcus', now, now);

  // Task 6: SUBMITTED (Record 6: Bluetooth disconnects)
  insertTask.run('task_06', 'proj_feedback', 'rec_06', 'sch_v1', 'SUBMITTED', 'HIGH', 1, 'u_priya', now, now);

  // Tasks 7-12: ASSIGNED / UNASSIGNED
  insertTask.run('task_07', 'proj_feedback', 'rec_07', 'sch_v1', 'ASSIGNED', 'MEDIUM', 1, 'u_priya', now, now);
  insertTask.run('task_08', 'proj_feedback', 'rec_08', 'sch_v1', 'ASSIGNED', 'LOW', 1, 'u_marcus', now, now);
  insertTask.run('task_09', 'proj_feedback', 'rec_09', 'sch_v1', 'UNASSIGNED', 'MEDIUM', 1, null, now, now);
  insertTask.run('task_10', 'proj_feedback', 'rec_10', 'sch_v1', 'UNASSIGNED', 'LOW', 1, null, now, now);
  insertTask.run('task_11', 'proj_feedback', 'rec_11', 'sch_v1', 'UNASSIGNED', 'MEDIUM', 1, null, now, now);
  insertTask.run('task_12', 'proj_feedback', 'rec_12', 'sch_v1', 'UNASSIGNED', 'HIGH', 1, null, now, now);

  // Assignments
  const insertAssign = db.prepare(`
    INSERT INTO task_assignments (id, task_id, user_id, status, assigned_at) VALUES (?, ?, ?, ?, ?)
  `);
  insertAssign.run('asg_01a', 'task_01', 'u_marcus', 'COMPLETED', now);
  insertAssign.run('asg_01b', 'task_01', 'u_priya', 'COMPLETED', now);
  insertAssign.run('asg_02', 'task_02', 'u_marcus', 'COMPLETED', now);
  insertAssign.run('asg_03', 'task_03', 'u_marcus', 'COMPLETED', now);
  insertAssign.run('asg_04', 'task_04', 'u_priya', 'ACTIVE', now);
  insertAssign.run('asg_05', 'task_05', 'u_marcus', 'ACTIVE', now);
  insertAssign.run('asg_06', 'task_06', 'u_priya', 'COMPLETED', now);
  insertAssign.run('asg_07', 'task_07', 'u_priya', 'ACTIVE', now);
  insertAssign.run('asg_08', 'task_08', 'u_marcus', 'ACTIVE', now);

  // Annotations
  const insertAnnotation = db.prepare(`
    INSERT INTO annotations (id, task_id, annotator_id, schema_version_id, answers_json, revision, is_draft, submitted_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Task 1: Marcus annotation
  insertAnnotation.run(
    'ann_01_marcus',
    'task_01',
    'u_marcus',
    'sch_v1',
    JSON.stringify({
      sentiment: 'negative',
      aspect_categories: ['hardware_display'],
      evidence_spans: [
        { id: 'sp1', start: 4, end: 42, label: 'defect', text: 'screen keeps flickering with green scanlines' },
      ],
      urgency_rating: 4,
    }),
    2,
    0, // submitted
    now,
    now,
    now
  );

  // Task 1: Priya annotation (disagreement!)
  insertAnnotation.run(
    'ann_01_priya',
    'task_01',
    'u_priya',
    'sch_v1',
    JSON.stringify({
      sentiment: 'mixed',
      aspect_categories: ['software_os'],
      evidence_spans: [
        { id: 'sp2', start: 58, end: 82, label: 'defect', text: 'waking up from sleep mode' },
      ],
      urgency_rating: 3,
    }),
    2,
    0, // submitted
    now,
    now,
    now
  );

  // Task 2: Marcus annotation (Accepted)
  insertAnnotation.run(
    'ann_02_marcus',
    'task_02',
    'u_marcus',
    'sch_v1',
    JSON.stringify({
      sentiment: 'positive',
      aspect_categories: ['battery_power', 'hardware_display'],
      evidence_spans: [
        { id: 'sp3', start: 0, end: 25, label: 'praise', text: 'Outstanding battery life!' },
        { id: 'sp4', start: 72, end: 104, label: 'praise', text: 'display colors are crisp and vibrant' },
      ],
      urgency_rating: 1,
    }),
    2,
    0,
    now,
    now,
    now
  );

  // Review for Task 2
  db.prepare(`
    INSERT INTO reviews (id, annotation_id, task_id, reviewer_id, decision, feedback, observed_revision, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'rev_02',
    'ann_02_marcus',
    'task_02',
    'u_david',
    'PASS',
    'Accurate span boundaries and aspect category selections.',
    2,
    now
  );

  // Task 3: Marcus annotation (Submitted, awaiting review)
  insertAnnotation.run(
    'ann_03_marcus',
    'task_03',
    'u_marcus',
    'sch_v1',
    JSON.stringify({
      sentiment: 'negative',
      aspect_categories: ['audio_mic'],
      evidence_spans: [
        { id: 'sp5', start: 24, end: 58, label: 'defect', text: 'microphone drops out during zoom calls' },
      ],
      urgency_rating: 4,
    }),
    2,
    0,
    now,
    now,
    now
  );

  // Task 4: Priya annotation (Returned for correction)
  insertAnnotation.run(
    'ann_04_priya',
    'task_04',
    'u_priya',
    'sch_v1',
    JSON.stringify({
      sentiment: 'negative',
      aspect_categories: ['battery_power'],
      evidence_spans: [
        { id: 'sp6', start: 0, end: 27, label: 'defect', text: 'Thermal throttling kicks in' },
      ],
      urgency_rating: 3,
    }),
    2,
    1, // returned to draft
    null,
    now,
    now
  );

  // Review for Task 4
  db.prepare(`
    INSERT INTO reviews (id, annotation_id, task_id, reviewer_id, decision, feedback, observed_revision, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'rev_04',
    'ann_04_priya',
    'task_04',
    'u_david',
    'RETURN_FOR_CORRECTION',
    'Please highlight the phrase "dangerously hot to the touch" as a second defect span and adjust urgency rating from 3 to 5.',
    2,
    now
  );

  // Task 5: Marcus draft
  insertAnnotation.run(
    'ann_05_marcus',
    'task_05',
    'u_marcus',
    'sch_v1',
    JSON.stringify({
      sentiment: 'mixed',
      aspect_categories: ['audio_mic'],
      evidence_spans: [],
      urgency_rating: 2,
    }),
    1,
    1, // draft
    null,
    now,
    now
  );

  // Task 6: Priya submitted
  insertAnnotation.run(
    'ann_06_priya',
    'task_06',
    'u_priya',
    'sch_v1',
    JSON.stringify({
      sentiment: 'negative',
      aspect_categories: ['software_os'],
      evidence_spans: [
        { id: 'sp7', start: 0, end: 52, label: 'defect', text: 'Bluetooth disconnects every 5 minutes from my keyboard' },
      ],
      urgency_rating: 5,
    }),
    1,
    0,
    now,
    now,
    now
  );

  // Seed Release v1.0.0
  const manifestData = {
    releaseId: 'rel_v1',
    versionTag: 'v1.0.0',
    projectName: 'Customer Feedback & Defect Categorization',
    projectId: 'proj_feedback',
    schemaVersion: 1,
    schemaId: 'sch_v1',
    datasetVersionId: 'dsv_v1',
    recordCount: 12,
    completedTaskCount: 1,
    selectionPolicy: 'ACCEPTED_OR_ADJUDICATED_ONLY',
    checksumSha256: 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
    publishedAt: now,
    publishedBy: 'Elena Vance (Owner)',
    fieldsSummary: [
      { name: 'sentiment', type: 'single_choice' },
      { name: 'aspect_categories', type: 'multi_choice' },
      { name: 'evidence_spans', type: 'text_span' },
      { name: 'urgency_rating', type: 'rating' },
    ],
  };

  db.prepare(`
    INSERT INTO dataset_releases (id, project_id, version_tag, schema_version_id, dataset_version_id, record_count, completed_task_count, checksum, manifest_json, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'rel_v1',
    'proj_feedback',
    'v1.0.0',
    'sch_v1',
    'dsv_v1',
    12,
    1,
    manifestData.checksumSha256,
    JSON.stringify(manifestData),
    'u_elena',
    now
  );

  // Audit Events
  const insertAudit = db.prepare(`
    INSERT INTO audit_events (id, workspace_id, actor_id, action, target_type, target_id, details_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertAudit.run('aud_1', 'ws_core', 'u_elena', 'WORKSPACE_INITIALIZED', 'WORKSPACE', 'ws_core', JSON.stringify({ name: 'Acme Research & AI Systems' }), now);
  insertAudit.run('aud_2', 'ws_core', 'u_elena', 'DATASET_IMPORTED', 'DATASET', 'ds_reviews', JSON.stringify({ filename: 'feedback_batch_2026.csv', records: 12 }), now);
  insertAudit.run('aud_3', 'ws_core', 'u_elena', 'SCHEMA_PUBLISHED', 'SCHEMA', 'sch_v1', JSON.stringify({ version: 1 }), now);
  insertAudit.run('aud_4', 'ws_core', 'u_david', 'REVIEW_DECISION', 'TASK', 'task_02', JSON.stringify({ decision: 'PASS' }), now);
  insertAudit.run('aud_5', 'ws_core', 'u_david', 'REVIEW_DECISION', 'TASK', 'task_04', JSON.stringify({ decision: 'RETURN_FOR_CORRECTION' }), now);
  insertAudit.run('aud_6', 'ws_core', 'u_elena', 'DATASET_RELEASED', 'RELEASE', 'rel_v1', JSON.stringify({ versionTag: 'v1.0.0' }), now);
}

