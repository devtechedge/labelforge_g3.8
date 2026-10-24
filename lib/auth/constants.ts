// Auth Constants & Demo Personas for LabelForge
import { WorkspaceRole } from '@/lib/domain/types';

export const DEMO_USERS = [
  {
    id: 'u_elena',
    email: 'elena@labelforge.io',
    name: 'Elena Vance',
    avatar: 'EV',
    title: 'Lead ML Ops Architect',
    roles: ['OWNER', 'MANAGER'] as WorkspaceRole[],
  },
  {
    id: 'u_marcus',
    email: 'marcus@labelforge.io',
    name: 'Marcus Chen',
    avatar: 'MC',
    title: 'Senior Data Annotator',
    roles: ['ANNOTATOR'] as WorkspaceRole[],
  },
  {
    id: 'u_priya',
    email: 'priya@labelforge.io',
    name: 'Priya Sharma',
    avatar: 'PS',
    title: 'Domain Specialist Annotator',
    roles: ['ANNOTATOR'] as WorkspaceRole[],
  },
  {
    id: 'u_david',
    email: 'david@labelforge.io',
    name: 'David Kim',
    avatar: 'DK',
    title: 'Reviewer & Adjudication Lead',
    roles: ['REVIEWER', 'MANAGER'] as WorkspaceRole[],
  },
];
