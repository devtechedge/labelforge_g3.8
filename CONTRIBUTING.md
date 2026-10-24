# Contributing to LabelForge

Thanks for considering a contribution. LabelForge is a small, focused
project: an auditable human-in-the-loop annotation workbench. We value small,
reviewable changes that keep the domain rules testable.

## Getting started

1. Fork the repository and clone it locally.
2. Install dependencies with `npm install` (Node.js 22.13+).
3. Run the development server with `npm run dev`.

## Checks before opening a pull request

Run all of these locally first:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The CI pipeline runs the same commands. A PR must keep them green.

## Conventions

- TypeScript strict. Prefer explicit types over `any`; domain types live in
  `lib/domain/types.ts`.
- Domain logic (importers, agreement metrics, transitions, export) is pure
  and has no React or I/O dependencies. Keep it that way.
- API routes return `{ error }` on failure with a meaningful status code and
  write an audit event for every state change.
- UI keeps the existing stone/violet visual language and reuses the shared
  components under `components/`.
- Commit messages are conventional and scoped, for example `fix:`, `feat:`,
  `docs:`, `test:`, `refactor:`, `ci:`.
- Tests cover domain edge cases (see `tests/`). New domain behavior should
  ship with tests.

## What to avoid

- Scope creep: unrelated refactors bundled into a fix.
- New dependencies without a strong justification.
- Committing local state (`data/*.db*` files or `.env` values).
- Public text with em dashes; use a hyphen or split the sentence.

## Reporting issues

Open an issue with the steps to reproduce, the expected behavior, and what
actually happened. For security matters, use the contact in SECURITY.md.
