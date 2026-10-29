# intervals.icu: Form as a percentage, and Form zones

Researched 2026-10-29 for ticket `.scratch/v1-spec/issues/05-form-percent-zones.md`.

Primary sources:
- **intervals.icu web app JS bundle**, fetched 2026-10-29 from `https://intervals.icu/assets/…` (Sentry release `4e8dd052099b925ae18cb72a80ee98a93969e067`). Chunks `Fitness-D0MJETiq.js` (zone constants and Form maths) and `FormChartD3-BbJ-fx2S.js` (the Form chart). This is the code that draws the Fitness page, so it is the most authoritative source here. The hashed filenames will change when the app is redeployed.
- **Live OpenAPI spec** at [intervals.icu/api/v1/docs](https://intervals.icu/api/v1/docs), fetched 2026-10-29.
- **Forum posts by the developer (`david`)**:
  - [Form as a percentage of fitness](https://forum.intervals.icu/t/form-as-a-percentage-of-fitness/869) (announcement, 2020-05-08)
  - [Zones of "Form %" in Fitness-Chart](https://forum.intervals.icu/t/zones-of-form-in-fitness-chart/3623) (2021-04-12)
  - [FITNESS PAGE - a guide to getting started](https://forum.intervals.icu/t/fitness-page-a-guide-to-getting-started/17702) (david's reply of 2023-02-14)

## Formula

**Form % = (Fitness − Fatigue) × 100 / Fitness**, using the same day's Fitness and Fatigue.

From `Fitness-D0MJETiq.js`, where `e` is Fatigue (`atl`), `a` is Fitness (`ctl`) and `l` is the "form as percent" flag:

```js
calcForm(e,a,l){ let n=Math.floor(a+.5)-Math.floor(e+.5); return l ? (a ? Math.floor(n*100/a+.5) : 0) : n }
calcFormUnrounded(e,a,l){ let n=a-e; return l ? (a ? n*100/a : 0) : n }
```

- **Displayed number** (`calcForm`): Fitness and Fatigue are each rounded to integers first (round half up). Form is the difference of those integers. In % mode, that integer difference is divided by the **unrounded** Fitness, ×100, then rounded. If Fitness is 0, Form % is 0.
- **Chart line** (`FormChartD3.calcForm`): uses the unrounded values, `(ctl - atl) * 100 / ctl`.
- **Which day**: both values come from the same day's bucket. On the wellness path the app sets `t.atl = wellness.atl` and `t.ctl = wellness.ctl` for that date. david confirmed this was deliberate: "it just seemed the right way to was to do it all on the day" ([2023-02-14](https://forum.intervals.icu/t/fitness-page-a-guide-to-getting-started/17702)). TrainingPeaks instead uses the previous day's values. david said he "will likely add an option sometime"; no such option appears in the current bundle or the API spec.
- The forum guide by MedTechCD (2022-08-13, same thread) gives the same formula: "Form (percentage of Fitness) = (Fitness-Fatigue)*100/Fitness".

## Zone boundaries

The constants in `Fitness-D0MJETiq.js` are:

```js
highRisk:-30, optimal:-10, fresh:5, transition:20, formPercentFactor:100
```

`calcFormClass(e, a)` checks them in this order: `<= highRisk`, then `<= optimal`, then `>= transition`, then `>= fresh`, and otherwise Grey zone. In % mode, `e` is first multiplied by `formPercentFactor/100`, which is 1, so the numbers are unchanged.

| Zone (UI label) | Absolute Form | Form % |
|---|---|---|
| Transition | ≥ +20 | ≥ +20% |
| Fresh | +5 to +19.x (≥ 5 and < 20) | ≥ 5% and < 20% |
| Grey Zone | > −10 and < +5 | > −10% and < 5% |
| Optimal (Training) | > −30 and ≤ −10 | > −30% and ≤ −10% |
| High Risk | ≤ −30 | ≤ −30% |

Notes:
- **The thresholds are the same numbers in both modes.** david: the zones "are from Joe Friel and are for absolute TSB … I stuck with the same zones for % TSB" ([2021-04-12](https://forum.intervals.icu/t/zones-of-form-in-fitness-chart/3623)). The in-app help text says: "The percentage option scales the zones (e.g. optimal training) to match your current fitness." In other words, −30% means 30% of current Fitness.
- **Edges are inclusive.** −30 counts as High Risk, −10 as Optimal, +20 as Transition and +5 as Fresh. The displayed integer is what gets classified (`calcFormClass(calcForm(...))` in `AthletesPage` and `ActivityCalendar`). The chart background gradient uses the same four thresholds.
- **intervals.icu uses +20 for Transition, not Friel's +25.** Friel's original post (linked from the app help: [joefrielsblog.com/2015/12/managing-training-using-tsb.html](https://www.joefrielsblog.com/2015/12/managing-training-using-tsb.html)) is not quoted here because I did not fetch it. Secondary sources cite +25 and +10 edges. We should mirror the intervals.icu constants rather than Friel.
- **Unverified**: the Planning view passes `!plan` when deciding % mode (`icu_form_as_percent && !plan`), so planned or future views may always show absolute Form. This doesn't matter for v1.

## API exposure

- **Wellness has no Form or Form % field, and no zone field.** The `Wellness` schema only has `ctl`, `atl`, `rampRate`, `ctlLoad`, `atlLoad`, and so on. `fatigue` (integer) there is the athlete's subjective rating, not Fatigue. **We must derive both Form % and the zone from `ctl`/`atl`.**
- **The athlete's display preference is readable**: the `Athlete` schema has `icu_form_as_percent: boolean`, which is the Options/Settings toggle saved by the UI. It comes back from `GET /api/v1/athlete/{id}` and can be written through `AthleteUpdateDTO`. The forum announcement says "Percentage of fitness" is the default for new athletes. **Unverified**: the field may be absent or null for some athletes; the UI treats a missing value as `false`.
- `GET /api/v1/athlete/{id}/athlete-summary{ext}` (`SummaryWithCats`) returns `fitness`, `fatigue` and `form` as floats. **Unverified**: whether that `form` is absolute or percent. It has no zone field. It is not needed if we compute from wellness.

## Configurability

- **Zone boundaries are not configurable per athlete.** They are hard-coded constants in the frontend. No athlete or sport-settings field in the OpenAPI spec holds Form zone thresholds (I searched every schema property for form, tsb, ctl, atl and zone). The only related per-athlete setting is the absolute vs % toggle (`icu_form_as_percent`).
- **What can change per athlete is the Fitness and Fatigue time constants** (defaults 42 and 7 days, via `FITNESS_DAYS` events with `ctl_days`/`atl_days`). These change the `ctl`/`atl` values the API returns, but not the zone thresholds.

## Implementation notes for the app

```ts
const form = Math.round(ctl) - Math.round(atl);              // matches UI integer
const formPct = ctl ? Math.round(form * 100 / ctl) : 0;       // matches UI integer
function zone(v: number) {                                    // v = form or formPct
  if (v <= -30) return "High Risk";
  if (v <= -10) return "Optimal";
  if (v >= 20) return "Transition";
  if (v >= 5) return "Fresh";
  return "Grey Zone";
}
```

`Math.round` and JS `Math.floor(x + .5)` agree for positive values. For negative halves they also agree, because both round toward +∞. Use the same-day `ctl`/`atl` from the wellness record.

## Confidence

- Formula, same-day values, thresholds and inclusive edges: **high**. Read directly from the production JS on 2026-10-29, and consistent with david's forum posts.
- No Form/zone fields in the API; zones not configurable: **high**. Based on a full search of the OpenAPI spec, though an undocumented field can't be ruled out.
- Meaning of `athlete-summary.form` (absolute or %): **unverified**.
