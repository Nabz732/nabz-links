// ---- Config ----
const YT_CHANNEL_ID = "UCy3HMQmWOT56VHUU-GeuFUw"; // Nabz.732
const TWITCH_CHANNEL = "nabz732";

// ---- Footer year ----
document.getElementById("year").textContent = new Date().getFullYear();

// ---- Latest YouTube video ----
// YouTube's RSS feed doesn't send CORS headers, so we go through rss2json
// (free, no key needed for light traffic) to turn it into fetchable JSON.
async function loadLatestVideo() {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CHANNEL_ID}`;
  const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
  const body = document.getElementById("yt-body");

  try {
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error("Feed request failed");
    const data = await res.json();
    const item = data.items && data.items[0];
    if (!item) throw new Error("No videos found");

    const videoIdMatch = item.link.match(/(?:v=|\/)([\w-]{11})(?:$|[?&])/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    const thumb = videoId
      ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
      : (item.thumbnail || "");

    body.innerHTML = `
      <a class="yt-card" href="${item.link}" target="_blank" rel="noopener">
        <img class="yt-card__thumb" src="${thumb}" alt="" loading="lazy">
        <p class="yt-card__title">${escapeHtml(item.title)}</p>
        <span class="yt-card__link">Watch on YouTube →</span>
      </a>
    `;
  } catch (err) {
    body.innerHTML = `
      <p class="lens__loading">Couldn't load the latest video right now.</p>
      <a class="twitch-fallback" href="https://www.youtube.com/@Nabz.7327" target="_blank" rel="noopener">Go to YouTube channel</a>
    `;
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

loadLatestVideo();

// ---- Twitch embed ----
// Uses Twitch's official embed widget so live/offline status is handled
// automatically without needing an authenticated API call.
function loadTwitchEmbed() {
  const container = document.getElementById("twitch-embed");
  if (!container) return;

  const script = document.createElement("script");
  script.src = "https://embed.twitch.tv/embed/v1.js";
  script.onload = () => {
    new Twitch.Embed(container.id, {
      width: "100%",
      height: 220,
      channel: TWITCH_CHANNEL,
      layout: "video",
      autoplay: false,
      parent: [window.location.hostname],
    });
  };
  script.onerror = () => {
    container.innerHTML = "";
  };
  document.body.appendChild(script);
}

loadTwitchEmbed();
