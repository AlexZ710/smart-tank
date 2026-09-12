# EXP05 — Organic Load Risk Review (Session 16)

**Status: PREPARED — EXECUTION PENDING TANK OPERATION**
Ammonia and organic-load indicators are **manual-only** in this project.
There is NO ammonia sensor and NO ORP probe in the hardware baseline
(both forbidden to reintroduce). Nothing here may claim ammonia, ORP or
organic load is automatically measured or estimated from telemetry.

## Objective
Build a repeatable manual risk review for organic load in the 5 L tank:
reagent ammonia trend + structured observations + feeding log, combined
with deterministic pH/temperature events as *context* — producing a
documented risk level and manual mitigation decisions by the owner.

## Data sources (manual only, via the same ledger as EXP04)
| Input | Instrument/method | Cadence |
|---|---|---|
| Ammonia (NH3/NH4) | liquid reagent test kit (read per kit timing) | weekly, and 24 h after any risk trigger |
| Nitrite (optional) | liquid reagent kit | weekly while cycling |
| Visual observations | structured checklist (below) | weekly, same day as ammonia |
| Feeding log | operator entries (type, amount, time) | every feeding |
| Water changes | volume + date | every change |

```bash
python -m backend.analysis.manual_log add --metric ammonia_mg_l --value 0.02 --unit mg/L --method "liquid test kit" --note "weekly, 5 min read"
python -m backend.analysis.manual_log add --metric observation_score --value 3 --unit score --method "EXP05 checklist" --note "light detritus on glass"
```

### Weekly observation checklist (score 0–5 each; record total)
- Water clarity (0 = cloudy, 5 = clear)
- Detritus on glass/substrate (0 = heavy, 5 = none)
- Algae growth (0 = rapid spread, 5 = stable/none)
- Animal behavior/appearance (0 = distress, 5 = normal)  *(if stocked)*
- Odor (0 = foul, 5 = none)  *(subjective, logged as such)*

Scores are qualitative operator assessments — labeled as such everywhere;
never presented as instrument measurements.

## Risk matrix (owner decision aid, not automation)
| Ammonia (kit) | Observation total (of 25) | Risk level | Manual action |
|---|---|---|---|
| 0.00 mg/L | >= 20 | LOW | routine schedule |
| 0.01–0.05 mg/L | any, OR < 20 with 0.00 | WATCH | retest in 48 h; reduce feeding 25 %; siphon visible detritus |
| 0.06–0.15 mg/L | any | HIGH | same-day 25–30 % manual water change; retest next day |
| > 0.15 mg/L | any | CRITICAL | immediate 50 % manual water change; daily retest until <= 0.05; consult stock health |

Context overlays (never risk drivers on their own): pH downward trend and
pH/temperature warning events from the deterministic engine (S11) are
attached to the weekly review as supporting context; a pH trend alone does
NOT change the risk level.

## Procedure
1. Run the weekly cycle for >= 6 weeks: ammonia reading -> checklist
   scores -> feeding-log review -> attach event context (from
   `data/events/events.csv` for the week) -> record risk level + actions
   in the review log.
2. Log every mitigation (water change volume/date, feeding reduction) as
   ledger rows.
3. Monthly: summarize risk-level distribution, ammonia trend, and whether
   actions preceded or followed threshold crossings.

## Analysis
- Ammonia time series with risk-band overlay (manual points only; gaps are
  gaps — never interpolated).
- Observation-total trend alongside.
- Feeding amount vs next ammonia reading (descriptive association only —
  n is small; no statistical causality claims).
- Event-context table: deterministic pH/temperature events per review week.

## Acceptance criteria for a valid campaign
- >= 6 weekly cycles with ammonia + checklist + risk level recorded.
- Every HIGH/CRITICAL week has a matching mitigation log row within the
  required window.
- No claim anywhere that ammonia/ORP/organic load is sensor-measured.

## Results (fill ONLY with real manual entries)
_Campaign window:_ ____  |  _Weekly cycles:_ ____
_Ammonia min–max (mg/L):_ ____  |  _Risk levels (L/W/H/C counts):_ ____
_Mitigations performed:_ ____  |  _Conclusion:_ _pending_

## Integrity rules
- No invented data; reagent readings logged with kit name and read time.
- Forbidden to claim: automatic ammonia, ORP-based oxidation state, or
  any sensor-derived organic-load estimate. The bounded AI report (S12)
  may only restate logged manual values and deterministic events, labeled
  accordingly, with recommendations gated behind human confirmation.
