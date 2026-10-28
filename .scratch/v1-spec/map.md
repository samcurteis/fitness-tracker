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
