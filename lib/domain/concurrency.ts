// Domain Logic: Workflow Transitions & Optimistic Concurrency Control
import type { TaskStatus, ReviewDecision } from './types.ts';

export interface TransitionResult {
  valid: boolean;
  newStatus?: TaskStatus;
  error?: string;
}

const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  UNASSIGNED: ['ASSIGNED'],
  ASSIGNED: ['IN_PROGRESS', 'UNASSIGNED'],
  IN_PROGRESS: ['SUBMITTED', 'ASSIGNED'],
  SUBMITTED: ['IN_REVIEW', 'RETURNED_FOR_CORRECTION', 'ACCEPTED', 'REJECTED', 'DISPUTED'],
  IN_REVIEW: ['ACCEPTED', 'RETURNED_FOR_CORRECTION', 'REJECTED', 'DISPUTED'],
  ACCEPTED: ['ADJUDICATION'], // can only be reopened if contested
  RETURNED_FOR_CORRECTION: ['IN_PROGRESS'],
  REJECTED: ['IN_PROGRESS', 'ADJUDICATION'],
  DISPUTED: ['ADJUDICATION'],
  ADJUDICATION: ['RESOLVED'],
  RESOLVED: [],
};

/**
 * Validates a lifecycle transition for an annotation task.
 */
export function validateTaskTransition(
  currentStatus: TaskStatus,
  targetStatus: TaskStatus
): TransitionResult {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (allowed.includes(targetStatus)) {
    return { valid: true, newStatus: targetStatus };
  }

  return {
    valid: false,
    error: `Invalid transition from ${currentStatus} to ${targetStatus}. Allowed target states: ${allowed.join(', ') || 'none'}.`,
  };
}

/**
 * Maps a reviewer's decision to the resulting task lifecycle status.
 */
export function resolveReviewDecision(decision: ReviewDecision): TaskStatus {
  switch (decision) {
    case 'PASS':
      return 'ACCEPTED';
    case 'RETURN_FOR_CORRECTION':
      return 'RETURNED_FOR_CORRECTION';
    case 'REJECT':
      return 'REJECTED';
    case 'REQUEST_ADJUDICATION':
      return 'DISPUTED';
  }
}

export interface ConcurrencyCheckResult {
  conflict: boolean;
  message?: string;
  currentRevision: number;
}

/**
 * Checks optimistic concurrency revision before applying an autosave or update.
 */
export function checkOptimisticRevision(
  storedRevision: number,
  expectedRevision: number
): ConcurrencyCheckResult {
  if (storedRevision !== expectedRevision) {
    return {
      conflict: true,
      currentRevision: storedRevision,
      message: `Conflict detected: Stored revision is ${storedRevision}, but client submitted against revision ${expectedRevision}. Please reload the latest revision.`,
    };
  }

  return {
    conflict: false,
    currentRevision: storedRevision,
  };
}
