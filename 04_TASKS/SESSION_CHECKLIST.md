# Per-Session BigBang Checklist

> Reusable per-session workflow template. Boxes below record the FINAL session
> run (S28, 2026-09-16, commit `docs: finalize provisioned smart tank
> end-to-end delivery`); every earlier session followed the same steps (see
> per-session blocks in root `TASKS.md`, the state authority).

- [x] Read TASKS and active structured prompt
- [x] Confirm one-session scope
- [x] Implement
- [x] Validate
- [x] Save evidence
- [x] Update TASKS status + changed files + blockers + commit + resume pointer
- [x] Review hardware/data truth (board-gated items kept unchecked + DEFERRED
      with annotations - never claimed as done; all mock data labeled SYNTHETIC)
- [x] If networking is touched: confirm no real SSID/password/device token is added to tracked source
      (staged-diff secret scan 0 hits; browser-output + bundle scans 0; throwaway local test tokens only)
- [x] If provisioning is touched: verify NVS persistence and recovery behavior
      (provisioning runtime NOT touched in S28 - no board attached; source-level
      policy validation `scripts/validate_wifi_provisioning.py` PASSED, NVS
      lifecycle unit-tested; runtime verification DEFERRED per docs/EXP06_Results.md Part A)
- [x] `git status` reviewed
- [x] Separate session commit created
- [x] Stop safely (web server stopped; throwaway Postgres cluster left running
      for inspection with teardown command in the S28 resume pointer; Docker Desktop never touched)
