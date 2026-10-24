import { test, expect } from '@playwright/test';

test('landing page renders the workbench pitch and workspace links', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Auditable Human Data Annotation Workbench/ })).toBeVisible();
  await expect(page.getByText('LABELFORGE PLATFORM')).toBeVisible();
  await expect(page.getByRole('link', { name: /Launch Annotation Workbench/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Review Queue & Decisions/ })).toBeVisible();
});

test('workspaces directory lists the demo workspace', async ({ page }) => {
  await page.goto('/workspaces');
  await expect(page.getByRole('heading', { name: /Workspaces Directory/ })).toBeVisible();
  await expect(page.getByText('Acme Research & AI Systems')).toBeVisible();
});

test('workspace home shows the demo project and stats', async ({ page }) => {
  await page.goto('/workspaces/ws_core');
  await expect(page.getByText('Customer Feedback & Defect Categorization')).toBeVisible();
  await expect(page.getByText(/Acme Research & AI Systems/).first()).toBeVisible();
});

test('annotation workbench renders queue, toolbar, and schema form', async ({ page }) => {
  await page.goto('/workspaces/ws_core/projects/proj_feedback/annotate/task_01');
  await expect(page.getByText('Task Queue')).toBeVisible();
  await expect(page.getByRole('button', { name: /Submit Annotation/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Keyboard Shortcuts/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Positive 1' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Annotation Guidelines & Rubric' })).toBeVisible();
});

test('review queue shows tasks awaiting decision', async ({ page }) => {
  await page.goto('/workspaces/ws_core/projects/proj_feedback/review');
  await expect(page.getByRole('heading', { name: 'Review Queue' })).toBeVisible();
  await expect(page.getByRole('button', { name: /FDB-1004/ })).toBeVisible();
});
