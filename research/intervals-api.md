# intervals.icu API: daily Fitness, Fatigue and Form

Researched 2026-10-28 for ticket `.scratch/v1-spec/issues/01-intervals-api-fitness-fatigue-form.md`.
Primary sources: the live OpenAPI spec ([intervals.icu/api/v1/docs](https://intervals.icu/api/v1/docs), rendered at [api-docs.html](https://intervals.icu/api-docs.html)), the developer's (david) forum posts, and unauthenticated header checks against the live API. No authenticated calls were made.

## Endpoint for a date range

`GET https://intervals.icu/api/v1/athlete/{id}/wellness{ext}` — "List wellness records for date range" ([spec](https://intervals.icu/api-docs.html#get-/api/v1/athlete/-id-/wellness-ext-)).

| Param | In | Notes |
|---|---|---|
| `id` | path | athlete id; `0` = athlete owning the key |
| `ext` | path | empty for JSON, `.csv` for CSV |
| `oldest` | query | local ISO-8601 date, oldest record |
| `newest` | query | local ISO-8601 date, **inclusive** |
| `fields` | query | comma-separated fields to return; also drops nulls |
| `cols` | query | CSV column list |

Returns a JSON array of `Wellness` objects, one per day. Example (from the developer's [Integration Cookbook](https://forum.intervals.icu/t/intervals-icu-api-integration-cookbook/80090)):

```bash
curl -u API_KEY:$KEY 'https://intervals.icu/api/v1/athlete/0/wellness?oldest=2026-09-29&newest=2026-10-28&fields=id,ctl,atl,rampRate'
```

Single day: `GET /api/v1/athlete/{id}/wellness/{date}`.

### Fields (from the `Wellness` schema in the OpenAPI spec)

| API field | Type | Meaning |
|---|---|---|
| `id` | string | the local date, `YYYY-MM-DD` |
| `ctl` | number | **Fitness** |
| `atl` | number | **Fatigue** |
| `rampRate` | number | Fitness ramp rate |
| `ctlLoad`, `atlLoad` | number | undocumented in spec (load feeding the models) |
| `sportInfo` | array of `SportInfo` | per-sport info |
| `updated` | date-time | last update |
| `fatigue` | **integer** | **subjective fatigue rating entered by the athlete — NOT Fatigue (`atl`)**. Name collision trap. |

There is **no Form / tsb field** on `Wellness`. Expected shape (built from the schema; not a captured response):

```json
[
  {"id": "2026-10-27", "ctl": 48.2, "atl": 55.9, "rampRate": 3.1, "ctlLoad": 62.0, "atlLoad": 62.0, "updated": "2026-10-27T18:02:11.000+00:00"},
  {"id": "2026-10-28", "ctl": 47.1, "atl": 48.0, "rampRate": 2.4, "ctlLoad": 0.0, "atlLoad": 0.0, "updated": "2026-10-28T06:00:00.000+00:00"}
]
```

Other places Fitness/Fatigue appear (not needed for v1):
- `Activity` / `Event` objects carry `icu_ctl` / `icu_atl`.
- `GET /api/v1/athlete/{id}/athlete-summary{ext}` returns `SummaryWithCats` with `fitness`, `fatigue`, `form`, `rampRate` — but it is "Summary information for followed athletes" (coach view), with `start`/`end` params; it's summary-level, not a per-day series.
- `GET /api/v1/athlete/{id}/fitness-model-events` lists events that influence the fitness calculation.

## Form: derived, and from today's values

- Form is **not returned** by the wellness endpoint; derive `form = ctl - atl` per day.
- intervals.icu's displayed Form uses **the same day's** Fitness and Fatigue (not yesterday's, unlike TrainingPeaks/Golden Cheetah). Developer, 2022-06-26: "Intervals.icu mostly just stores CTL and ATL and calculates form when needed. So using yesterdays numbers for form today is a complication…"; 2020-11-18: "There isn't an option to switch to yesterday's data but I do have that on the todo list." Users were still requesting the option in Jan 2026; no sign it shipped. ([forum thread](https://forum.intervals.icu/t/form-tsb-as-of-yesterday-or-todays/2024))
- So `ctl - atl` on the same record matches what intervals.icu shows (absolute mode). The UI can also show Form as a **percentage** of Fitness — a display setting ([forum](https://forum.intervals.icu/t/comparing-fatigue-on-intervals-icu-with-suunto/95958)).

## Auth (personal API key)

From the developer's pinned post ([API access to Intervals.icu](https://forum.intervals.icu/t/api-access-to-intervals-icu/609)) and the spec's `securitySchemes`:
- HTTP Basic: **username `API_KEY`**, password = the key (generated under /settings → Developer Settings).
- Athlete id **`0`** in the path = the athlete the key belongs to. (`"me"` is not documented; use `0`.)
- Multi-user apps should use OAuth Bearer tokens instead.
- Matches the working script `/Users/samcurteis/repos/personal/running/upload_to_intervals.py` (`auth=("API_KEY", api_key)`).
- Cloudflare may challenge non-browser user agents (e.g. `Python-urllib`); fix by using a browser-like UA. Not an issue from a real browser.

## Rate limits

Same pinned post:
- API key: **5000 requests/day** (resets midnight UTC) and **2500 per rolling 15 min**.
- Plus **10 calls/second per IP** (no rate-limit headers for this one).
- Headers on each request: `X-RateLimit-Limit: <15m>,<daily>`, `X-RateLimit-Remaining: <15m>,<daily>`.
- Over limit: HTTP **429** with `Retry-After: <seconds>`.

One 30-day wellness call per page load is nowhere near the limits.

## CORS: direct browser calls work

Checked live on 2026-10-28 with `Origin: https://example.com`:

Preflight `OPTIONS /api/v1/athlete/0/wellness` → 200:
```
access-control-allow-origin: https://example.com   (origin echoed)
access-control-allow-headers: origin, authorization, accept, content-type, x-requested-with
access-control-allow-methods: GET, HEAD, POST, PUT, DELETE, TRACE, OPTIONS
access-control-max-age: 3600
```
`GET` (with and without bogus Basic auth) → 401 but still carries `access-control-allow-origin: <origin>`.

So a browser `fetch` with an `Authorization: Basic …` header is allowed by CORS; no server proxy is technically needed. Caveats:
- No `Access-Control-Expose-Headers` seen, so browser JS likely **can't read `X-RateLimit-*`** headers (status code 429 is still visible).
- The key would live in the browser (bundle, localStorage or user input) — a security/design choice, not a CORS constraint. The developer warns the key grants access to your data.
- Not tested with a valid key; an authenticated 200 should carry the same ACAO header as the 401 did.

## Other notes

- Strava-sourced data is not available via the API (Strava terms). Activities synced from Strava may not contribute in the same way — not verified for wellness `ctl`/`atl`, which are computed by intervals.icu.
- Pinned post (Oct 2026 updates) warns Garmin data access via API may be blocked/changed; affects Garmin-sourced data, not obviously the computed `ctl`/`atl`.
