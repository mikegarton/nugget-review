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

1. Filter and sort the abstracts, read them, rate them. Three independent
   star rows, one per reading depth (Mike, 2026-09-17; viewer-spec §15):
   header stars rate the title card (`yt_videos.med_ai_hl_rating`),
   card-line stars rate the headline (`yt_nuggets.nug_ai_hl_rating`),
   expanded-card stars rate the abstract (`yt_nuggets.nug_ai_abstract_rating`,
   the only level that pickles, filters or sorts). Scale: 1 never gonna
   look · 2 unlikely to use · 3 didn't regret · 4 good · 5 outstanding.
   Tap the same star again to clear. Every star row is the last item of
   a right-justified strip, nearest the right thumb; an unselected star is
   a dim beige outline, a selected star solid gold (Mike, 2026-09-18;
   viewer-spec §16).
2. **1–2★ = pickled**: the card shows "pickled — hidden from the default
   view (kept; find it under Rating → Pickled)", then leaves the default
   view. Nothing is ever deleted (the old 1★ purge is retired); pickled
   rows are reachable only through the Rating dropdown's Pickled choice.
3. **A / V / R list buttons** (2026-08-23; on every nugget card, A/V on
   video headers as bulk controls): send a nugget to exactly one list —
   **A** audio (the clips page plays it hands-free), **V** video (the
   watch list; the add-only sync mirrors these videos onto your YouTube
   watch playlist), **R** reading (posts). The data-backed suggestion is
   pre-outlined (dashed green): posts → R; needs-viz ≥ `viz_hi` → V; ≤
   `viz_lo` → A; between/unscored → both. Tap the lit letter to clear;
   another letter moves it. The compact strip `A C B V` (appeal · coach ·
   broccoli ± · needs-viz) on each card is the data behind the choice.
4. **Watched marking is gone** (2026-08-20 ruling): no toggle, no filter,
   nothing reads `watched_at`.

## Controls (viewer-spec draft 6 §1–§3)

Three horizontally scrollable rows of dropdown chips, each chip with its
dimension label above it (the label scrolls with the chip); every filter
leads with **All** as its default; "Any" is retired. Choices persist in
`localStorage` (`ytr3`). Row order follows the layered rule: a control that
modifies another sits to its left; meaning-changers fill the no-scroll
zone; frequency orders the rest; utilities last.

- **Focus strip (viewer-spec §14, 2026-09-11)**: the **focus** button
  pinned at row 1's left collapses the three rows, the count line and the
  status line into one sticky row for read-and-rate sessions. The strip
  pins **controls** (back to the rows), the red Apply while a load is
  pending, and a mode button that cycles three subsets: *where* (the
  lowest-granularity selection, judgment filters as text, and position
  "n of L listed / A available", prefixed "video g of G" when grouped),
  *order* (sort + direction + group as text, the live Headers fold chip),
  *view* (the live A−/A+ pair, the List-as mode as text). Nothing in the
  strip edits a filter — tapping its text reopens the rows. Focus and mode
  are remembered per device. Headers and cards are untouched.
- **Row 1 — content**: Scope (All · YT-subscrip · Substack · My adds ·
  Campaign — provenance only, no group privileged; "YT-subscrip" (key
  `yt_subscribed`) = your subscribed YouTube channels, neither
  campaign-found nor manually added) · Source (only sources present in
  available ∩ scope, alphabetical, each with the channel's running hype
  average; under Scope = Campaign it lists the campaigns instead, each
  with the search phrases that found videos — "all of <campaign>" then
  the phrases; a selection that narrows away resets to All with the
  yellow side-effect fill) · Category (any position in the ordered tag
  array) · Domain · Age (≤ 2 days … ≤ 1 year, by publish date).
- **Pinned, far right, never scrolls — Queued**: `Q shown` / `Q hidden`
  removes queued nuggets from the list ("already decided").
- **Row 2 — order**: Group (None · Video) · Sort · ▲▼. Group never
  changes Sort (2026-09-19). A tap on a card (stars, A/V/R, K) never
  moves it; the declared order returns on the next filter/sort change.
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
  chips (primary first), provenance chips (`substack`, `manual add`, and
  for campaign nuggets `campaign: <name>` + `q: “<search phrase>”`), `A<n>`
  appeal and `C<n>` coach scores, `coach ±N` in Broccoli sort, `viz <n>`
  when needs_viz ≥ 50, ★n, the Q badge.
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

## Lists as delivery modes (viewer-spec §13, 2026-08-23)

The three lists are a MODE of the viewer, not a separate page: the
**Listed (A/V/R)** dropdown on row 3 — All · Hide listed · Audio only ·
Video only · Read only — limits the visible set to one list and shows the
**player bar**; every other widget (Scope, Source, Category, Domain, Age,
Rating, Sort/Dir, Group, counts) keeps working, and playback follows the
current sort. The list you chose is a DELIVERY MODE: Read renders text
(post text, or a video's transcript opened at the nugget's time; Done
stamps played), Audio renders ears-only (post text voiced with the phone's
voice, a post's audio enclosure in our own player, a video's audio via the
in-page clip or the YouTube app — `video → YouTube app` in the bar, Premium
keeps it playing under lock inside the nugget-audio playlist), Video renders
player + screen (the video; audio over a static image; text as a slide).
**Played** (row 3) hides items a renderer finished; **K** = Keeper ("I
expect to use this idea near or mid-term"), also a Rating-dropdown filter.
Listed items ride along with any load so a list is whole under any Scope.
`clips.html` now forwards into the viewer. In-page audio playback: Videos order newest-
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
