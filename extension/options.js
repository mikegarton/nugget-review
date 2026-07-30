// Options page: endpoint + review key, stored in chrome.storage.local only.
const DEFAULT_ENDPOINT =
  "https://zowilxlpldqxtotrvekd.supabase.co/functions/v1/yt-add";

async function load() {
  const cfg = await chrome.storage.local.get(["endpoint", "reviewKey"]);
  document.getElementById("endpoint").value = cfg.endpoint || DEFAULT_ENDPOINT;
  document.getElementById("key").value = cfg.reviewKey || "";
}

document.getElementById("save").addEventListener("click", async () => {
  await chrome.storage.local.set({
    endpoint: document.getElementById("endpoint").value.trim() || DEFAULT_ENDPOINT,
    reviewKey: document.getElementById("key").value.trim(),
  });
  document.getElementById("saved").textContent = "saved ✓";
  setTimeout(() => (document.getElementById("saved").textContent = ""), 1500);
});

load();
