# nugget-review

Phone-first review dashboard for the [nugget pipeline]
(https://github.com/mikegarton/yt-nugget-pipeline) — YouTube channels and
Substack publications through one review loop. This repo is the **static
shell only**, served by GitHub Pages (public + Pages enabled 2026-07-29):

- `index.html` — the viewer (skim, rate, queue)
- `ops.html` — burn rates, campaign yields, channel economics, live knobs
- `home.html` — the public control room: links to every dashboard and
  reference doc

It contains no data and no secrets: all data comes from the pipeline's
key-gated `yt-review` Supabase function (JSON, CORS-enabled), and the key
lives only in the bookmark's `?key=` parameter (the control room keeps it
in each device's browser localStorage).

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
  (mixed individual ratings are never overwritten; 4–5 queues the lot,
  1–2 dismisses it). A group carrying ONE uniform rating — the result of
  a previous header tap — stays correctable from the header: a different
  star re-rates the lot, the same star clears it. Header stars light up
  to the group's lowest rating.
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
- **Prospect** mode: nuggets from keyword campaigns (`yt-prospector`)
  appear here and ONLY here — the trusted-channel views never see
  them. Stars keep one meaning everywhere ("I intend to watch this");
  the legend under the stars carries the standing reminder, and
  ratings feed the campaign's per-query yield stats.
- Substack nuggets wear a `substack` chip and source-appropriate verbs —
  **📖 Read now / mark seen** — linking to the post itself; header
  actions follow suit. Same stars, same meaning.
- `ops.html` (same key): read-only ops page. **Burn rate** cards lead —
  each card names the resource AND the consumer: whole pipeline
  (Supadata cycle), subscriptions (trusted channels' share after
  campaign reservations), Claude $ (soft budget), and each campaign
  cap — used/quota with a pace ratio normalized by elapsed period,
  blue &lt;0.5× · green ≤1× · yellow ≤1.3× · red &gt;1.3×, tick =
  exactly on pace. Then per-query campaign yields; channel economics
  with a sortable **source** column (youtube | substack), $/nugget to
  5 decimals and $/5★ to 4 (substack costs are magnitudes smaller and
  still deserve a number), and **nug/item** — the density metric both
  sources share, since posts have no transcript minutes; lifetime +
  monthly. Channels processed before 2026-07-25 predate cost logging
  and show $0. Finally the pipeline flow parameters — every tunable
  number, live from the `yt_params` config table. Campaigns and
  parameters are edited in the SQL editor, not here (control GUI
  later).

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
