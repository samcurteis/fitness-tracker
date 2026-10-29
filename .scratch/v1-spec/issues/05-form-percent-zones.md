# intervals.icu Form % zones

Type: research
Status: resolved

## Question

How does intervals.icu express Form as a percentage (formula: Form / Fitness? which day's values?), and what are its default zone boundaries in % mode (Transition, Fresh, Grey zone, Optimal, High risk)? Does the API return Form % or the zone directly, or must we derive both from `ctl`/`atl`? Are the boundaries user-configurable per athlete, and if so are they readable via the API?

## Comments

Research findings on branch `research/form-percent-zones` at `research/form-percent-zones.md`

- Form % = (Fitness − Fatigue) × 100 / Fitness, same day's values (deliberate, unlike TrainingPeaks). Fitness 0 → 0%. Displayed value: round Fitness and Fatigue first, divide by unrounded Fitness, round the result. Chart line uses unrounded values.
- Zone boundaries are hard-coded and the same in absolute and % mode (edges inclusive): Transition ≥ +20; Fresh 5 to under 20; Grey zone above −10 and under 5; Optimal above −30 up to −10; High risk ≤ −30. Transition starts at +20, not Friel's +25.
- Wellness has no Form, Form % or zone field: derive all three from `ctl`/`atl`.
- The athlete record (`GET /api/v1/athlete/{id}`) has `icu_form_as_percent` (absolute vs %; default % for new athletes). Zone boundaries can't be changed per athlete; the Fitness/Fatigue time constants can, which changes `ctl`/`atl` but not the zones.
- Not checked: whether `athlete-summary.form` is absolute or %; whether planned views always show absolute Form.
