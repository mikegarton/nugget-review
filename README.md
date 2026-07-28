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
4. A card drops out of the **open** view once it is both rated and watched,
   or as soon as it is rated 1–2 (a low rating dismisses it, watched or
   not). Dismissals are permanent at the API level: after the next reload,
   1–2★ nuggets are never shipped to the app again — 2★ rows stay in the
   database as facts, 1★ rows are deleted outright by the processor after
   a 24 h grace window (un-rate within a day to save a mis-tap).

## Modes and filters

- **Comfort** — sorted by personal_score (tired-day mode).
- **Stretch** — sorted by mentor residual, the part of expert_score your
  taste doesn't explain (good-day mode).
- **Newest** — by publish date.
- **Queue** — the watch list (see above).
- State filter: **open** (default — everything not yet both rated and
  watched, minus anything rated 1–2) · any state · unrated · unwatched ·
  watched. Plus channel / domain / type filters and a max-age filter
  (≤ 2 days … ≤ 1 year, by publish date). Choices persist in
  `localStorage`.
- **By video** toggle (default on): multi-nugget videos group under a
  collapsible header — "X nuggets in Y" with channel, date, a Watch
  button for the whole video (marks every nugget in the group watched),
  and a star row that rates every **unrated** nugget in the group
  (individual ratings are never overwritten; 4–5 queues the lot, 1–2
  dismisses it). Header stars light up to the group's lowest rating.
  The header leads with the humble title (`plain_title` from the
  processor; pre-hype videos fall back to the lead nugget's headline),
  with the channel's verbatim YouTube title below it and a signed
  **hype ±N** chip (−5 underselling … +5 clickbait, scored
  title-vs-transcript at processing time). Groups sort by their best
  nugget in the current mode; nuggets within a group run in timestamp
  order. Singletons stay plain cards. Duration shows once the video's
  `duration_seconds` is enriched.
- Channel dropdown entries carry the channel's running average hype
  level to one decimal — the channel-weeding signal (server-side
  `yt_channel_hype` view, so it includes videos that yielded zero
  nuggets).

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
