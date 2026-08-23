# nugget-review

Phone-first review dashboard for the [nugget pipeline]
(https://github.com/mikegarton/yt-nugget-pipeline) — YouTube channels and
Substack publications through one review loop. This repo is the **static
shell only**, served by GitHub Pages (public + Pages enabled 2026-07-29):

Layout since 2026-08-23: **one folder per installable app**, each with
its own `manifest.webmanifest` whose `scope` is that folder — Chrome
treats overlapping scopes as ONE app (an N-add installed with the old
whole-site scope made the viewer "already installed" and uninstallable
as its own app). Root `index.html` / `ops.html` / `capture.html` /
`share.html` are one-line redirects that carry the query string, so old
bookmarks and an old N-add's share action keep working.

- `view/index.html` — the viewer (filter, sort, rate abstracts, queue
  clips; shows manual adds that produced zero nuggets — you asked, so the
  answer is shown). Installable as **N-view** (`view/manifest.webmanifest`).
- `view/clips.html` — the clip player (2026-08-22): plays the queued
  nuggets as clips back-to-back in an embedded YouTube player — one tap,
  phone in the pocket, audio on earbuds. Same key as the viewer.
- `ops/index.html` — burn rates, campaign yields, channel + per-source
  economics, live knobs (marked knobs and per-source priority editable with
  the ops write key; bounds enforced server-side, changes audited).
  Installable as **N-ops** (`ops/manifest.webmanifest`).
- The control room (`home.html`) moved to `C:\dev\control-room\` on
  2026-08-08 — it is a cross-project personal hub, not part of this app's
  shell. The paste box for sending YouTube links (`yt-add`) lives there.
- `extension/` — Chrome extension (MV3, load unpacked): Alt+Q sends the
  current tab's video to the pipeline; right-click any YouTube link for the
  context menu; badge counts today's adds. Endpoint + review key live in
  the extension's own storage, never in this repo.
- `capture/index.html` — user instructions for all four capture surfaces
  (extension install/use, the Android share sheet, the unlisted-playlist
  inbox that covers the NVIDIA Shield and phone/tablet YouTube apps, and
  the paste box), plus the on-site review-key save box (`#setup`) that the
  share handler depends on; it is also the **N-add** PWA `start_url`
- `capture/manifest.webmanifest` + `capture/share.html` + root `sw.js` —
  N-add: the installable PWA whose `share_target` puts "Nuggets" in
  Android's share sheet; YouTube app → Share → Nuggets posts the video to
  `yt-add` (share.html reads the review key saved by the setup box). The
  service worker (root, registered as `../sw.js` by every page) caches
  nothing — install-eligibility only. Only N-add carries the share_target
  (keeps the share sheet single). Icons: gold N = N-add, blue N+V = N-view,
  green N+O = N-ops.

It contains no data and no secrets: all data comes from the pipeline's
key-gated `yt-review` Supabase function (JSON, CORS-enabled). The key
arrives once via the bookmark's `?key=` parameter and is then kept in the
device's browser localStorage (`cr_review_key`, shared by all pages), so
the installed apps open without a key in any start_url — the public repo
forbids one there.

Why Pages: Supabase's gateway rewrites any `text/html` response from
`*.supabase.co` to `text/plain` with a sandbox CSP, so the shell cannot be
served next to the API.

Bookmark: `https://mikegarton.github.io/nugget-review/view/?key=<YT_REVIEW_KEY>`
(the old root URL redirects there). Clips: `…/nugget-review/view/clips.html`;
ops: `…/nugget-review/ops/`; capture how-to: `…/nugget-review/capture/`.

## The review loop (2026-08-22)

Spec of record: `working_docs/projects/nugget-review/viewer-spec.md` draft 6
— every control documented desc / args / pre / modifies / post, written
before the code, plus the controls-by-state-variables matrix.

1. Filter and sort the abstracts, read them, rate them. The stars rate the
   **abstract** — ONE rating column; there is no video rating (Mike,
   2026-08-22). Scale: 1 never gonna look · 2 unlikely to use · 3 didn't
   regret · 4 good · 5 outstanding. Tap the same star again to clear.
2. **1–2★ = pickled**: the card shows "pickled — hidden from the default
   view (kept; find it under Rating → Pickled)", then leaves the default
   view. Nothing is ever deleted (the old 1★ purge is retired); pickled
   rows are reachable only through the Rating dropdown's Pickled choice.
3. **Q badge** (on every nugget card and every video header): want to
   watch. Green when on; the header badge shows the group's state and
   stamps every unqueued nugget (or clears all when all are queued). Queued
   nuggets are what `clips.html` plays; the add-only watch-playlist sync is
   unaffected (it mirrors manual adds, not Q).
4. **Watched marking is gone** (2026-08-20 ruling): no toggle, no filter,
   nothing reads `watched_at`.

## Controls (viewer-spec draft 6 §1–§3)

Three horizontally scrollable rows of dropdown chips, each chip with its
dimension label above it (the label scrolls with the chip); every filter
leads with **All** as its default; "Any" is retired. Choices persist in
`localStorage` (`ytr3`). Row order follows the layered rule: a control that
modifies another sits to its left; meaning-changers fill the no-scroll
zone; frequency orders the rest; utilities last.

- **Row 1 — content**: Scope (All · Subs · Substack · My adds · Campaign —
  provenance only, no group privileged) · Source (only sources present in
  available ∩ scope, alphabetical, each with the channel's running hype
  average; a selection that narrows away resets to All with the yellow
  side-effect fill) · Category (any position in the ordered tag array) ·
  Domain · Age (≤ 2 days … ≤ 1 year, by publish date).
- **Pinned, far right, never scrolls — Queued**: `Q shown` / `Q hidden`
  removes queued nuggets from the list ("already decided").
- **Row 2 — order**: Group (None · Video) · Sort · ▲▼. Group=Video sets
  Sort=My_rating as a declared side-effect (yellow until you touch Sort).
  Sort keys, every one both directions (ascending is the weeding view):
  **Appeal** (personal_score — a prediction of how much you will like it)
  · **Coach** (expert_score — the mentor's value-per-minute) · **Broccoli**
  (the regression residual: the coach's score above what your appeal
  predicts — good for you, not what you crave; NOT a raw subtraction) ·
  **Needs-viz** (0–100, does understanding need the screen; nulls last) ·
  My_rating · YT_views · Duration · Date-pub · Date-add (manual add, else
  discovery) · Date-dug (when it entered the pile; ascending = expiring
  soonest) · Date-Q · Date-rev.
- **Row 3 — judgment + utilities**: Rating (All · Unrated · 5★ · ≥4★ · 3★ ·
  Pickled 1–2★) · Expired (hidden / shown; re-admits unrated nuggets past
  their categories' TTL — each wears "expired: <tag> <N>d" naming the tag
  whose TTL fired) · A− / A+.
- **Chip fills**: grey = app default; mint = your choice (a value equal to
  the default reads grey); yellow = a side-effect of another control
  (decays when you touch this one); greyed = not applicable.
- **Header count** reads `N listed / M available`: available = rating +
  expired + hide-queued only, content filters ignored — the ratio shows how
  much your scope choice is hiding.
- **Group=Video**: multi-nugget videos under a collapsible header ("X
  nuggets in Y" with channel, date, hype ±N, reprocess generation, header
  stars that rate every unrated nugget in bulk, the group Q badge, and a
  Watch link for the whole video). Groups order by their best nugget under
  the declared sort; nuggets inside a group keep the declared order.
  Singletons stay plain cards.
- **Cards**: headline (tap to expand), channel, date, domain, category
  chips (primary first), `A<n>` appeal and `C<n>` coach scores, `coach ±N`
  in Broccoli sort, `viz <n>` when needs_viz ≥ 50, ★n, the Q badge.
  Expanded: the abstract, rationale, Watch link, stars. Watch links open
  at the nugget's start, clamped so a link never lands past `duration −
  30 s` (spec §7: the processor clamps at write time, the viewer clamps for
  display).
- **Second-dimension stripe**: each card's left edge is colored by the
  score the current sort ISN'T showing (coach everywhere; appeal under
  Coach and Broccoli sorts) — green ≥ 75, gold ≥ 85.
- Substack nuggets wear a `substack` chip and **📖 Read now** links to the
  post; no Q badge (posts are read, not watched; needs_viz is null).
- Campaign nuggets get no special treatment; the legend under their stars
  carries the reminder that ratings teach the campaign.
- Cards you rate or queue stay **pinned in place** until the next
  filter/sort/group change, so acting on a card never yanks it away
  mid-tap.

## clips.html — hands-free sequential playback

List = queued (Q) nuggets, YouTube only, not pickled. Videos order newest-
queued first; clips inside a video play in storyline order. A clip runs
from the nugget's clamped start to the next queued nugget's start in the
same video, else `start + clip_default_seconds` (a `yt_params` knob, 120 s,
editable on the ops page), capped at the video's end. **Start** requests a
screen wake lock and drops a pocket guard (a full-screen overlay that
swallows touches; press-and-hold 1.5 s unlocks); the IFrame player chains
clips on the ENDED event; ▶▶ / ◀ skip; tapping a list item jumps. Known
limits: embedded playback pauses when the screen locks (hence the wake
lock), and Media Session handlers are best effort — the embed's own media
session may win on some devices. Acceptance test (spec §10.2): one tap on
Start must carry into the second clip with no touch, on the phone.

The header strip of the viewer shows pipeline status when quiet (month-to-
date cost, Supadata usage, drift verdict) and turns into an alarm line when
something needs attention.

`ops.html` (same key): read-only ops page — burn-rate cards that name the
resource AND the consumer, pace ratios (blue <0.5× · green ≤1× · yellow
≤1.3× · red >1.3×), per-query campaign yields, channel economics with a
sortable source column, and every tunable number live from `yt_params`.

## Deploying

Push to `main`; GitHub Pages serves the repo root. The API base URL is
hardcoded in `view/index.html`, `view/clips.html`, and `ops/index.html`.
Phone note: an N-add installed before 2026-08-23 keeps the old whole-site
scope until it is uninstalled and reinstalled from `capture/`; until then
Chrome reports the viewer and ops as "already installed".
