# Security Policy

LabelForge is a demo-grade collaborative annotation workbench. This document
describes the current threat model, the residual risks of the demo deployment,
and how to report vulnerabilities.

## Supported versions

| Version | Supported |
| ------- | --------- |
| 1.x | Yes |

## Reporting a vulnerability

Please report security issues privately to the repository owner rather than
opening a public issue. Email: devtechedge@gmail.com. Include the affected
endpoint or page, the steps to reproduce, and the impact. You will receive an
acknowledgement within 5 business days and a status update once a fix is
prepared.

## Threat model

- Authentication: sessions are demo personas selected through a cookie
  (`lf_user_id`) and are not backed by real credentials. Anyone can switch
  persona from the UI. This is intentional for evaluation and must not be
  relied on for access control in production.
- Authorization: API routes enforce role checks against workspace membership
  (`OWNER`, `MANAGER`, `REVIEWER`, `ANNOTATOR`). Because identity is a demo
  cookie, these checks protect demo workflow integrity, not real trust
  boundaries.
- Data storage: the demo database uses SQLite via Node.js built-in modules.
  On the Vercel deployment the database lives in ephemeral `/tmp` storage and
  is re-seeded on every cold start. Any changes a visitor makes disappear when
  the instance recycles. Data is never written to persistent disk on the
  hosted deployment.
- Import handling: uploaded CSV and JSONL files are parsed and validated with
  a quarantine-first importer. Rows that fail validation are reported and are
  never committed to the annotated dataset.
- CSV export: spreadsheet formula injection is mitigated by prefixing cells
  that begin with `=`, `+`, `-`, `@`, tab, or carriage return with a single
  quote before export.
- Concurrency: writes use optimistic concurrency with revision numbers.
  Stale writes receive HTTP 409 and are reconciled through the UI.
- Scripting: the application does not render user-provided HTML; record text
  is rendered as text. There are no server-side template injection surfaces.
- Third parties: the application makes no external network calls at runtime
  and holds no API keys.

## Residual risks (demo deployment)

- Demo personas can be switched freely, so treat any visitor as capable of
  editing all demo data.
- Ephemeral storage means there is no durability guarantee for uploaded or
  annotated data.
- The deployment is public and open to abuse (spam imports, many concurrent
  sessions). Rate limiting is not implemented.

## Recommended production hardening

If you deploy LabelForge beyond a demo, implement at minimum:

1. A real identity provider and session management with secure, httpOnly,
   signed cookies.
2. A persistent transactional database with backups and migrations.
3. Per-workspace rate limiting and audit retention policy.
4. Input size limits and scan of uploaded files.
5. Content Security Policy headers and CSRF protection for state-changing
   routes.
