// LabelForge relational schema for the annotation workbench.

export const SCHEMA_DDL = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      title TEXT,
      disabled INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      owner_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS workspace_memberships (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL, -- OWNER, MANAGER, ANNOTATOR, REVIEWER
      created_at TEXT NOT NULL,
      UNIQUE(workspace_id, user_id),
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invitations (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_by TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING', -- PENDING, ACCEPTED, EXPIRED
      created_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'ACTIVE', -- ACTIVE, ARCHIVED
      redundancy_count INTEGER DEFAULT 1,
      current_schema_version_id TEXT,
      current_dataset_version_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS datasets (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS dataset_versions (
      id TEXT PRIMARY KEY,
      dataset_id TEXT NOT NULL,
      version_num INTEGER NOT NULL,
      source_name TEXT NOT NULL,
      record_count INTEGER NOT NULL,
      checksum TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS dataset_records (
      id TEXT PRIMARY KEY,
      dataset_version_id TEXT NOT NULL,
      stable_id TEXT NOT NULL,
      source_order INTEGER NOT NULL,
      data_json TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      UNIQUE(dataset_version_id, stable_id),
      FOREIGN KEY (dataset_version_id) REFERENCES dataset_versions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS annotation_schema_versions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      version_num INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      schema_json TEXT NOT NULL,
      guidelines TEXT,
      published INTEGER DEFAULT 1,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS annotation_tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      dataset_record_id TEXT NOT NULL,
      schema_version_id TEXT NOT NULL,
      status TEXT NOT NULL, -- UNASSIGNED, ASSIGNED, IN_PROGRESS, SUBMITTED, IN_REVIEW, ACCEPTED, RETURNED_FOR_CORRECTION, REJECTED, DISPUTED, ADJUDICATION, RESOLVED
      priority TEXT DEFAULT 'MEDIUM',
      revision INTEGER DEFAULT 1,
      assigned_to TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (dataset_record_id) REFERENCES dataset_records(id) ON DELETE CASCADE,
      FOREIGN KEY (schema_version_id) REFERENCES annotation_schema_versions(id)
    );

    CREATE TABLE IF NOT EXISTS task_assignments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, REASSIGNED
      assigned_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (task_id) REFERENCES annotation_tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS annotations (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      annotator_id TEXT NOT NULL,
      schema_version_id TEXT NOT NULL,
      answers_json TEXT NOT NULL,
      revision INTEGER DEFAULT 1,
      is_draft INTEGER DEFAULT 1,
      submitted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(task_id, annotator_id, schema_version_id),
      FOREIGN KEY (task_id) REFERENCES annotation_tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (annotator_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (schema_version_id) REFERENCES annotation_schema_versions(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      annotation_id TEXT NOT NULL,
      task_id TEXT NOT NULL,
      reviewer_id TEXT NOT NULL,
      decision TEXT NOT NULL, -- PASS, RETURN_FOR_CORRECTION, REJECT, REQUEST_ADJUDICATION
      feedback TEXT,
      observed_revision INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (annotation_id) REFERENCES annotations(id) ON DELETE CASCADE,
      FOREIGN KEY (task_id) REFERENCES annotation_tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS adjudications (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      adjudicator_id TEXT NOT NULL,
      chosen_answer_json TEXT NOT NULL,
      rationale TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES annotation_tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (adjudicator_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS dataset_releases (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      version_tag TEXT NOT NULL,
      schema_version_id TEXT NOT NULL,
      dataset_version_id TEXT NOT NULL,
      record_count INTEGER NOT NULL,
      completed_task_count INTEGER NOT NULL,
      checksum TEXT NOT NULL,
      manifest_json TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (schema_version_id) REFERENCES annotation_schema_versions(id),
      FOREIGN KEY (dataset_version_id) REFERENCES dataset_versions(id)
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      details_json TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS import_batches (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_type TEXT NOT NULL,
      total_rows INTEGER NOT NULL,
      valid_rows INTEGER NOT NULL,
      error_rows INTEGER NOT NULL,
      status TEXT DEFAULT 'COMMITTED', -- PREVIEW, COMMITTED
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS import_row_errors (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      row_index INTEGER NOT NULL,
      field_name TEXT,
      error_code TEXT NOT NULL,
      error_message TEXT NOT NULL,
      FOREIGN KEY (batch_id) REFERENCES import_batches(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_memberships ON workspace_memberships(workspace_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_projects_ws ON projects(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_records_ver ON dataset_records(dataset_version_id, stable_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON annotation_tasks(project_id, status);
    CREATE INDEX IF NOT EXISTS idx_annotations_task ON annotations(task_id, annotator_id);
    CREATE INDEX IF NOT EXISTS idx_audit_ws ON audit_events(workspace_id, created_at);
`;
