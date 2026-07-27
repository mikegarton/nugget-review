# nugget-review

Phone-first review dashboard for the [YouTube nugget pipeline]
(https://github.com/mikegarton/yt-nugget-pipeline). This repo is the **static
shell only** — a single `index.html` served by GitHub Pages. It contains no
data and no secrets: all data comes from the pipeline's key-gated `yt-review`
Supabase function (JSON, CORS-enabled), and the key lives only in the
bookmark's `?key=` parameter.

Why Pages: Supabase's gateway rewrites any `text/html` response from
`*.supabase.co` to `text/plain` with a sandbox CSP, so the shell cannot be
served next to the API.

Bookmark: `https://mikegarton.github.io/nugget-review/?key=<YT_REVIEW_KEY>`

## The review loop

1. Skim cards and rate the **nugget** from its abstract (star tooltips carry
   the scale: 1 never gonna look · 2 unlikely to use · 3 didn't regret ·
   4 good · 5 outstanding). Tap the same star again to clear.
2. Rating **4–5 queues it** — the Queue mode is the after-work watch list
   (rated ≥ 4 and unwatched), with links that start just before the nugget.
3. The **Watch link marks the card watched** on click (the toggle undoes a
   mis-click). After watching, the same stars become the **video rating** —
   revise or confirm.
4. A card that is both rated and watched drops out of the default views;
   surface it again via the state filter.

## Modes and filters

- **Comfort** — sorted by personal_score (tired-day mode).
- **Stretch** — sorted by mentor residual, the part of expert_score your
  taste doesn't explain (good-day mode).
- **Newest** — by publish date.
- **Queue** — the watch list (see above).
- State filter: **open** (default — everything not yet both rated and
  watched) · any state · unrated · unwatched · watched. Plus channel /
  domain / type filters. Choices persist in `localStorage`.
- **By video** toggle (default on): multi-nugget videos group under a
  collapsible header — "X nuggets in Y" with channel, date, and a Watch
  button for the whole video (marks every nugget in the group watched).
  Groups sort by their best nugget in the current mode; nuggets within a
  group run in timestamp order. Singletons stay plain cards. Duration
  shows once the video's `duration_seconds` is enriched.

Cards you rate or watch stay **pinned in place** (dimmed) until the next
mode/filter change or reload, so acting on a card never yanks it out of the
list mid-interaction. Watched-but-unrated cards show a "rate the video to
close it out" nudge.

The header strip shows pipeline status when quiet (month-to-date cost,
Supadata usage, drift verdict) and turns into an alarm line when something
needs attention.

## Deploying

Push to `main`; GitHub Pages serves the repo root. The API base URL is
hardcoded in `index.html`.
