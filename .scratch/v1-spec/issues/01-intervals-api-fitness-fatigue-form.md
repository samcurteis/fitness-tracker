# intervals.icu API: where Fitness/Fatigue/Form live

Type: research
Status: resolved

## Question

Which intervals.icu API endpoint(s) and fields return daily Fitness, Fatigue and Form for a date range? How does auth work with a personal API key? Rate limits? Does the API allow direct browser calls (CORS), or must calls go through a server?

## Comments

Research findings on branch `research/intervals-api` at `research/intervals-api.md`

- `GET /api/v1/athlete/0/wellness?oldest=YYYY-MM-DD&newest=YYYY-MM-DD` (newest inclusive) returns one record per day: `id` (date), `ctl` = Fitness, `atl` = Fatigue. Beware: wellness `fatigue` is the subjective rating, not Fatigue.
- No Form field; derive Form = `ctl - atl` from the same day's values. That matches intervals.icu, which uses today's values (not yesterday's).
- Auth: Basic, username `API_KEY`, password = key; athlete id `0` = key owner. Limits: 5000/day, 2500 per rolling 15 min, 10/s per IP; 429 + Retry-After.
- CORS: the server echoes Origin and allows the `authorization` header, so direct browser calls work. No server needed, but the key would live in the browser.

## Answer

Use `GET /api/v1/athlete/0/wellness?oldest=&newest=` (newest inclusive, `fields=id,ctl,atl` to trim). Each day's record has `id` = date, `ctl` = Fitness, `atl` = Fatigue. Form isn't returned; derive Form = `ctl - atl` from the same day's values (matches the intervals.icu UI). Trap: `Wellness.fatigue` is the athlete's own subjective score, not Fatigue. Auth is HTTP Basic with username `API_KEY` and the key as password; athlete `0` = the key's owner. Limits: 5000/day, 2500 per 15 min, 10/s; over the limit gives a 429. CORS allows direct browser calls, so a server isn't strictly required, but then the key sits in the browser. Full findings: branch `research/intervals-api`, `research/intervals-api.md`.
