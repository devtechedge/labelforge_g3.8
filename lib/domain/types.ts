// LabelForge Domain Types & Interfaces

export type WorkspaceRole = 'OWNER' | 'MANAGER' | 'ANNOTATOR' | 'REVIEWER';

export type TaskStatus =
  | 'UNASSIGNED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'ACCEPTED'
  | 'RETURNED_FOR_CORRECTION'
  | 'REJECTED'
  | 'DISPUTED'
  | 'ADJUDICATION'
  | 'RESOLVED';

export type ReviewDecision =
  | 'PASS'
  | 'RETURN_FOR_CORRECTION'
  | 'REJECT'
  | 'REQUEST_ADJUDICATION';

export type SchemaFieldType =
  | 'single_choice'
  | 'multi_choice'
  | 'text_span'
  | 'rating'
  | 'text';

export interface ChoiceOption {
  id: string;
  label: string;
  shortcut?: string;
  color?: string;
  description?: string;
}

export interface SpanLabelOption {
  id: string;
  label: string;
  color: string;
  description?: string;
}

export interface SchemaField {
  id: string;
  name: string;
  label: string;
  type: SchemaFieldType;
  required: boolean;
  description?: string;
  options?: ChoiceOption[];
  spanLabels?: SpanLabelOption[];
  ratingConfig?: {
    min: number;
    max: number;
    step?: number;
    labels?: Record<number, string>;
  };
  textConfig?: {
    multiline?: boolean;
    maxLength?: number;
    placeholder?: string;
  };
}

export interface AnnotationSchema {
  id: string;
  projectId: string;
  version: number;
  name: string;
  description?: string;
  fields: SchemaField[];
  guidelines?: string;
  published: boolean;
  createdBy: string;
  createdAt: string;
}

export interface TextSpanAnnotation {
  id: string;
  start: number;
  end: number;
  label: string;
  text: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  title?: string;
  disabled: boolean;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
}

export interface WorkspaceMembership {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'ARCHIVED';
  redundancyCount: number; // 1 = standard single-annotator, 2+ = multi-annotator for agreement
  currentSchemaVersionId?: string;
  currentDatasetVersionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatasetRecord {
  id: string;
  datasetVersionId: string;
  stableId: string;
  sourceOrder: number;
  data: Record<string, any>;
  contentHash: string;
}

export interface AnnotationTask {
  id: string;
  projectId: string;
  datasetRecordId: string;
  schemaVersionId: string;
  status: TaskStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  revision: number;
  assignedTo?: string; // primary or latest assignment
  createdAt: string;
  updatedAt: string;
}

export interface Annotation {
  id: string;
  taskId: string;
  annotatorId: string;
  schemaVersionId: string;
  answers: Record<string, any>;
  revision: number;
  isDraft: boolean;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  annotationId: string;
  taskId: string;
  reviewerId: string;
  decision: ReviewDecision;
  feedback: string;
  observedRevision: number;
  createdAt: string;
}

export interface Adjudication {
  id: string;
  taskId: string;
  adjudicatorId: string;
  chosenAnswer: Record<string, any>;
  rationale: string;
  createdAt: string;
}

export interface DatasetRelease {
  id: string;
  projectId: string;
  versionTag: string; // e.g. v1.0.0
  schemaVersionId: string;
  datasetVersionId: string;
  recordCount: number;
  completedTaskCount: number;
  checksum: string;
  manifest: ReleaseManifest;
  createdBy: string;
  createdAt: string;
}

export interface ReleaseManifest {
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
  publishedAt: string;
  publishedBy: string;
  fieldsSummary: { name: string; type: SchemaFieldType }[];
}

export interface AuditEvent {
  id: string;
  workspaceId: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, any>;
  createdAt: string;
}
