# Safe Pause and Resume Guide

## Safe pause
1. Stop the current command cleanly.
2. `git status`.
3. Save partial evidence under `evidence/<session-id>/`.
4. Update `TASKS.md` with `IN_PROGRESS`, blocker, next command, and changed files.
5. Commit only if the work is internally coherent; otherwise leave a clearly documented working tree and create a checkpoint branch/tag before risky migration.

## Resume
1. Open repository root.
2. Read `TASKS.md` first.
3. Run `git status` and `git log --oneline -10`.
4. Read only the active session prompt.
5. Re-run the last validation before continuing.

## After web-facade renewal
If the upgrade was applied to an already-started repository, preserve completed S01-S18 evidence and continue from the migration-generated resume pointer. Never reset completed sessions to NOT_STARTED.
