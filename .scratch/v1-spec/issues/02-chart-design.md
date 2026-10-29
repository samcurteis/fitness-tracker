# Chart: how close to IntervalsCompanion

Type: prototype
Status: resolved
Assignee: sam.curteis

## Question

What should the v1 Fitness/Fatigue/Form chart look like and do? Decide: fixed 30 days vs selectable range, Form zone shading, today's values as headline numbers, future projection. Bring an IntervalsCompanion screenshot.

## Comments

Prototype (variants A-D, D won) on branch `prototype/chart-design` at `.scratch/v1-spec/prototypes/chart-design-prototype.html`. Reference screenshot: [IntervalsCompanion Fitness screen](../assets/intervals-companion-fitness.png)

Interim decisions (2026-10-29):
- Form in its own chart, separate from Fitness/Fatigue (variant A).
- Headline: three tiles, Fitness / Fatigue / Form + zone (variant A).
- Zone bar (variant B) above the charts, reversed: Transition → Fresh → Grey → Optimal → High risk.
- Range chips (superseded below).
- Future projection: later, not v1.
- Form zones as % of Fitness to start.
- 7-day zone strip: later, not v1.
- No zone stripes behind the Form chart (the zone bar shows the zone).
- Drop B's mini trend lines.
- Hover: linked across both charts; one readout shows Fitness, Fatigue and Form for that day.
- Form shown as % (headline tile and Form chart axis). % zone boundaries pending: [intervals.icu Form % zones](05-form-percent-zones.md).

Resolution (2026-10-29): variant D, adjusted after comparing with IntervalsCompanion. Top to bottom:
1. Zone name as headline (e.g. "Fresh").
2. Three values: Fitness, Fatigue, Form % (= Form / Fitness).
3. Zone bar with today's marker, Transition on the left through High risk on the right. Gradient vs solid blocks is a styling detail.
4. Range chips YTD / 1Y / 6M / 3M / 42D / 14D, default 42D, not remembered between visits.
5. Fitness/Fatigue chart.
6. Form % chart: line coloured by zone, no fill, no background stripes.
Hover/tap is linked across both charts, with one readout of Fitness, Fatigue and Form % for that day (today when idle).
Not v1: future projection, stepping back through time (arrows/date picker), 7-day zone strip, mini trend lines.
