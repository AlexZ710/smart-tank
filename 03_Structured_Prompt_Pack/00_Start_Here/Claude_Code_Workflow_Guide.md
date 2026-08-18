# AI Coding CLI Workflow Guide

## Repository-first rule
The AI coding agent must work from the repository, not from a pasted mega-prompt.

At every start/resume ask it to read:
1. `TASKS.md`
2. `docs/Hardware_Baseline_Lock.md` or package equivalent
3. the active structured session prompt
4. `git status` and recent commits

## One-session gate
Implement exactly one active session. Do not silently advance to later sessions.

## Session exit gate
- acceptance checklist passed;
- tests/builds run;
- evidence saved;
- TASKS updated;
- one Git commit created;
- next resume pointer written.
