# Session 12 — Bounded AI Report

## Objective
Generate AI summaries only from measured/manual values and deterministic events; require human confirmation for recommendations.

## Context to read first
- `01_Project_Documentation/Hardware_Baseline_Lock.md`
- `04_TASKS/TASKS.md`
- the current repository state under `05_Starter_Repository/smart-tank/`

## Files to create or modify
- `backend/ai_agent/reef_agent.py`
- `docs/prompt_boundary.md`

## Hardware Lock — mandatory
- Main controller: ESP32-S3-WROOM-1 based development board; Arduino IDE.
- Core: ADS1115, SEN0161-V2 pH on A1, DS18B20 on GPIO4, PT550 on A3.
- XKC-Y25-T12V is optional and isolated; implementation must not depend on it.
- Unavailable and forbidden to reintroduce: ORP, EC/conductivity, ZP4510 float switches, FS300A flow sensor.
- No automatic dosing, no student-built mains switching, no invented telemetry.

## Implementation Prompt
You are the implementation agent for **Session 12 only**. Read the hardware lock and current TASKS state before editing. Generate AI summaries only from measured/manual values and deterministic events; require human confirmation for recommendations. Preserve previous accepted work. Do not start Session 13 unless this is Session 18. Update documentation when behavior/schema changes. Keep the project runnable if optional XKC hardware is absent.

## Acceptance Criteria
- [ ] Session objective is implemented without relying on ORP, EC, ZP4510 or FS300A.
- [ ] All created/modified files are internally consistent with `Hardware_Baseline_Lock.md`.
- [ ] Validation relevant to this session has been run and evidence is recorded.
- [ ] `04_TASKS/TASKS.md` is updated with status, evidence, changed files and resume pointer.
- [ ] No unsupported measurement claim appears in code, charts or documentation.

## Validation Evidence
Record commands, Serial Monitor excerpts, screenshots/file paths, or test results in TASKS.md. Hardware sessions must record the standalone sensor result before integrated testing.

## Required Git Checkpoint
After all acceptance criteria pass:
```bash
git add .
git commit -m "S12 bounded ai report"
```

If validation fails, do not create the completion commit; record the blocker and create only a WIP safe-pause commit when needed.
