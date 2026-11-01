# AGENTS.md — rules for all AI agents (Copilot, Claude Code, others)

## Read first
BRAIN.md, START_HERE.md, TODO.md, docs/blueprint.md. Do not duplicate their content here.

## Stack
Next.js 15 (Turbopack), React 19, TypeScript, Tailwind, shadcn/Radix, Genkit + Gemini,
Google Sheets backend via Apps Script (apps-script/). Dev server: port 9002.

## Commands
- npm run dev | npm run typecheck | npm run lint | npm run build
- Before opening a PR: npm run typecheck must pass.

## Hard rules
1. Never run `npm run deploy:gs`, `clasp push`, or `clasp deploy`. Apps Script deploys are manual, by the owner.
2. Never commit secrets or .env* files. Never print key values.
3. Do not change the deployment ID, apphosting.yaml, auth logic or permission handling unless the Issue says so.
4. Work on a branch (feature/<short-name>). Never push to main. Open a PR.
5. Change only what the Issue asks. No rebuilds, refactors or dependency upgrades unless requested.
6. Do not run `npm audit fix --force`.
7. src/hooks/use-inventory-data.ts is a shared hotspot: keep edits minimal there.
8. Do not claim a feature works unless you ran it. In the PR, state what you tested and what you could not.

## PR format
Summary, files changed, how it was tested, risks, manual steps for the owner.
