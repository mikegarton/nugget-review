// Nugget pipeline — add video (MV3 service worker).
// Two capture surfaces, one endpoint (yt-add):
//   Alt+Q         -> sends the ACTIVE TAB's URL (watch page: one keystroke)
//   context menu  -> right-click any YouTube link/thumbnail, no navigation
// The endpoint + review key live in chrome.storage.local (options page) —
// never in this source, which sits in a public repo.
// Badge = adds accepted today (resets on the first add of a new day).

const DEFAULT_ENDPOINT =
  "https://zowilxlpldqxtotrvekd.supabase.co/functions/v1/yt-add";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "nugget-add-link",
    title: "Send to nugget pipeline",
    contexts: ["link"],
    targetUrlPatterns: [
      "*://www.youtube.com/watch*", "*://youtube.com/watch*",
      "*://m.youtube.com/watch*", "*://youtu.be/*",
      "*://www.youtube.com/shorts/*", "*://www.youtube.com/live/*",
    ],
  });
  chrome.contextMenus.create({
    id: "nugget-add-page",
    title: "Send this video to nugget pipeline",
    contexts: ["page"],
    documentUrlPatterns: [
      "*://www.youtube.com/watch*", "*://m.youtube.com/watch*",
      "*://www.youtube.com/shorts/*", "*://www.youtube.com/live/*",
    ],
  });
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "add-current-video") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url) await sendToPipeline(tab.url);
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  const url = info.menuItemId === "nugget-add-link" ? info.linkUrl : info.pageUrl;
  if (url) await sendToPipeline(url);
});

async function sendToPipeline(url) {
  const cfg = await chrome.storage.local.get(["endpoint", "reviewKey"]);
  if (!cfg.reviewKey) {
    notify("Not configured", "Open the extension options and paste your review key.");
    chrome.runtime.openOptionsPage();
    return;
  }
  try {
    const res = await fetch(cfg.endpoint || DEFAULT_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-review-key": cfg.reviewKey,
      },
      body: JSON.stringify({ urls: [url] }),
    });
    const data = await res.json();
    if (!res.ok) {
      notify("Rejected", data.error || `HTTP ${res.status}`);
      return;
    }
    const r = (data.results || [])[0] || {};
    if (r.status === "added") {
      await bumpBadge();
      notify(
        r.priority === 0 ? "Added — front of the queue" : "Added",
        (r.title || r.video_id || "") +
          (r.priority === 0 ? "\nProcessing within ~5 minutes." : ""),
      );
    } else if (r.status === "already_have") {
      notify("Already in the pipeline", r.title || r.video_id || "");
    } else {
      notify("Not added", `${r.status || "unknown"} — ${url}`);
    }
  } catch (e) {
    notify("Network error", String(e));
  }
}

async function bumpBadge() {
  const today = new Date().toISOString().slice(0, 10);
  const { badgeDay, badgeCount } = await chrome.storage.local.get(["badgeDay", "badgeCount"]);
  const count = badgeDay === today ? (badgeCount || 0) + 1 : 1;
  await chrome.storage.local.set({ badgeDay: today, badgeCount: count });
  chrome.action.setBadgeText({ text: String(count) });
  chrome.action.setBadgeBackgroundColor({ color: "#5aa8f0" });
}

function notify(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon48.png",
    title: `Nugget pipeline: ${title}`,
    message: message || "",
  });
}
