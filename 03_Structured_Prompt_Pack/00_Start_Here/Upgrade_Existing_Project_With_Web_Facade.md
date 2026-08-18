# Smart Tank Web Facade Merge Guide

## Purpose
Upgrade an already-started `smart-tank` repository to the renewed web-enabled BigBang architecture without discarding completed sensor, experiment, documentation, or Git history.

## Non-negotiable rule
**Do not start over and do not overwrite your current repository with `05_Starter_Repository/smart-tank`.** The renewed full package is the reference baseline; your existing repository remains the working project.

## Phase 0 - Pause the current AI session safely
1. Finish the smallest coherent edit currently in progress.
2. Stop any long-running AI/code command.
3. At repository root run:
```bash
git status
git log --oneline -10
```
4. Open `TASKS.md` and record the current session as `IN_PROGRESS` or `COMPLETE` accurately.
5. Record blockers and the exact next action.

## Phase 1 - Create a migration checkpoint
Run:
```bash
git add -A
git commit -m "checkpoint: before web facade architecture upgrade"
git tag pre-web-facade-upgrade
```
If there is intentionally incomplete code that should not be committed, create a backup branch first and document the dirty files instead of hiding them.

Recommended:
```bash
git branch backup/pre-web-facade-upgrade
```

## Phase 2 - Download and unpack the renewed package OUTSIDE the repository
Example layout:
```text
Projects/
├── smart-tank/                    <- your real current Git repository
└── smart-tank-renewed-package/    <- unpacked reference package
    └── smart-tank/
```
Do not unzip the renewed package directly on top of the working repository.

## Phase 3 - Copy only the upgrade-control material first
From the renewed package copy these into the working repository:
```text
11_Web_Facade_Upgrade/
03_Structured_Prompt_Pack/Session_19_*.md ... Session_28_*.md
```
Also copy the following reference files **only if you do not already maintain equivalents**:
```text
01_Project_Documentation/Web_Facade_Architecture.md
01_Project_Documentation/Final_Deliverables.md
06_Experiment_Templates/EXP06_WEB_TELEMETRY_RELIABILITY.md
```
Do not overwrite completed experiment logs or existing source code.

## Phase 4 - Run the migration-init prompt
From your coding CLI, instruct the agent:
```text
Read 11_Web_Facade_Upgrade/RUN_WEB_FACADE_UPGRADE.md and execute only the migration-init phase. Inspect TASKS.md, git status, git history, current repository tree, current firmware, data pipeline, and completed evidence. Do not reset completed sessions and do not start S19 until the migration checklist passes.
```

The agent must produce:
- `docs/Web_Facade_Upgrade_Audit.md`
- updated `TASKS.md` preserving real S01-S18 states;
- a list of existing files that will be reused;
- a list of genuinely new files required;
- conflict list, if any;
- the next resume pointer.

## Phase 5 - Reconcile TASKS.md, do not replace it
The renewed package `04_TASKS/TASKS.md` is a schema/reference. Your existing `TASKS.md` is the source of execution history.

Rules:
- completed S01-S18 remain COMPLETE;
- current partial session remains IN_PROGRESS until reconciled;
- not-started old sessions stay NOT_STARTED;
- append S19-S28 as `NEW_AFTER_WEB_FACADE_UPGRADE` or `NOT_STARTED`;
- preserve commit hashes and evidence paths;
- set one and only one active resume pointer.

## Phase 6 - Merge starter web files selectively
Use `05_Starter_Repository/smart-tank/web`, `database`, and `docker-compose.yml` as reference/new-file sources.

Preferred merge behavior:
- if `web/` does not exist: copy it;
- if `web/` exists: diff and merge, do not delete user code;
- if `docker-compose.yml` exists: merge the `postgres` service rather than replacing unrelated services;
- if `.env.example` exists: append missing variable names without copying real secrets;
- keep existing Python/firmware paths unless the migration audit shows a conflict.

After merge:
```bash
git diff --stat
git diff
```
Review before committing.

## Phase 7 - Validate the pre-web project still works
Before starting S19, re-run the most recent successful sensor/core checks. At minimum:
- Arduino firmware still compiles or the last verified binary/source is unchanged;
- Python tests still pass;
- existing raw data is untouched;
- unavailable sensors did not reappear in active code/schema.

Then commit:
```bash
git add -A
git commit -m "chore: merge web facade BigBang upgrade scaffold"
```

## Phase 8 - Execute S19-S28 one by one
Do not paste all prompts at once.

Sequence:
- S19 web architecture/data contract
- S20 Docker PostgreSQL and schema
- S21 Next.js/Tailwind scaffold
- S22 authenticated telemetry ingestion API
- S23 ESP32 Wi-Fi telemetry
- S24 live status and device health UI
- S25 history charts and experiment markers
- S26 events and AI report UI
- S27 Vercel deployment/hardening
- S28 end-to-end validation, final report and demo

Every session ends with validation, evidence, TASKS update, and its own Git commit.

## Phase 9 - What NOT to copy from the renewed package
Do not overwrite:
- real `TASKS.md` history;
- completed experiment logs;
- calibration values;
- working firmware unless a session intentionally modifies it;
- `.env*` containing real secrets;
- existing Git metadata;
- raw/clean datasets;
- evidence folders.

## Phase 10 - Rollback if migration goes wrong
Inspect first:
```bash
git status
git diff
```
To abandon uncommitted migration edits, restore only the migration-touched paths you have verified.

To return to the checkpoint in a separate recovery branch:
```bash
git switch -c recovery/pre-web pre-web-facade-upgrade
```
Do not use destructive reset commands on the main working branch unless you fully understand the consequences.

## Completion condition
The migration is complete when:
- old work remains reproducible;
- TASKS.md accurately preserves prior progress;
- S19-S28 exist and are traceable;
- web/database scaffold is present;
- no removed sensors reappear;
- one clear next resume pointer exists.
