# Map: Fitness Tracker v1 spec

Label: wayfinder:map

## Destination

A hand-off-ready spec for v1: a single-user, read-only web app showing a chart of Fitness, Fatigue and Form over the last 30 days, sourced from intervals.icu.

## Notes

- Domain: personal training-load tracking; vocabulary in `GLOSSARY.md` (Fitness/Fatigue/Form, not CTL/ATL/TSB).
- Every session: call grilling + domain-modeling skills.
- Standing preferences: TypeScript, TDD-friendly setup, free hosting tier, no deadline.
- Use intervals.icu's precomputed Fitness/Fatigue/Form (don't compute ourselves); fetch live per page load, no storage.
- Deployed (phone access), not localhost-only.
- Reference app being copied: IntervalsCompanion. Existing API usage: `../running/upload_to_intervals.py`.

## Decisions so far

- [intervals.icu API: where Fitness/Fatigue/Form live](issues/01-intervals-api-fitness-fatigue-form.md): wellness endpoint `ctl`/`atl`, Form derived; Basic auth; CORS allows browser calls (key would be exposed)
- [Chart: how close to IntervalsCompanion](issues/02-chart-design.md): zone headline, 3 values (Form as %), zone bar, range chips (default 42D), split Fitness/Fatigue + Form % charts, linked hover
- [intervals.icu Form % zones](issues/05-form-percent-zones.md): Form % = (Fitness − Fatigue) / Fitness, same day; fixed zones +20/+5/−10/−30; no API field, derive client-side

## Not yet specified

- Error/empty states: invalid key, API down, gaps in data.
- Testing approach for the chosen stack.
- Whether v1 needs real login or just a gate, given login is "maybe later" (may graduate out of Hosting + access protection).

## Out of scope

- Weight tracker
- AI training analysis
- Training plan modifications
- Multi-user / OAuth
- Local data storage / database
- Future projection, stepping back through time, 7-day zone strip: later, not v1 (see [Chart: how close to IntervalsCompanion](issues/02-chart-design.md))
