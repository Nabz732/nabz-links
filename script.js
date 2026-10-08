// ---- Config ----
const YT_CHANNEL_ID = "UCy3HMQmWOT56VHUU-GeuFUw"; // Nabz.732
const TWITCH_CHANNEL = "nabz732";

// ---- Footer year ----
document.getElementById("year").textContent = new Date().getFullYear();

// ---- Latest YouTube video ----
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
        <div class="yt-card__thumb-wrapper">
          <img class="yt-card__thumb" src="${thumb}" alt="" loading="lazy">
          <div class="yt-card__play-overlay">
            <div class="yt-card__play-icon">
              <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        </div>
        <p class="yt-card__title">${escapeHtml(item.title)}</p>
        <span class="yt-card__link">Watch on YouTube</span>
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
function loadTwitchEmbed() {
  const container = document.getElementById("twitch-embed");
  const liveBadge = document.getElementById("live-badge");
  if (!container) return;

  const script = document.createElement("script");
  script.src = "https://embed.twitch.tv/embed/v1.js";
  script.onload = () => {
    const embed = new Twitch.Embed(container.id, {
      width: "100%",
      height: 220,
      channel: TWITCH_CHANNEL,
      layout: "video",
      autoplay: false,
      parent: [window.location.hostname],
    });

    embed.addEventListener(Twitch.Embed.VIDEO_READY, () => {
      const player = embed.getPlayer();
      const setLive = (isLive) => {
        if (liveBadge) liveBadge.hidden = !isLive;
      };
      player.addEventListener(Twitch.Player.ONLINE, () => setLive(true));
      player.addEventListener(Twitch.Player.OFFLINE, () => setLive(false));
    });
  };
  script.onerror = () => {
    container.innerHTML = "";
  };
  document.body.appendChild(script);
}

loadTwitchEmbed();

// ---- Mascot click-to-react with Speech Bubble ----
function initMascotReactions() {
  const mascot = document.getElementById("hero-mascot");
  const speech = document.getElementById("mascot-speech");
  if (!mascot) return;

  const expressions = [
    { file: "mascot-neutral.png", label: "Nabz mascot — click to react", phrase: "Yo! What's good?" },
    { file: "mascot-shocked.png", label: "Nabz mascot, shocked", phrase: "CHAT IS THIS REAL?!" },
    { file: "mascot-angry.png", label: "Nabz mascot, annoyed", phrase: "Bro... not again." },
    { file: "mascot-spiky.png", label: "Nabz mascot, smug", phrase: "EZ Clap." },
    { file: "mascot-extra.png", label: "Nabz mascot, confused", phrase: "Wait, what?" },
  ];
  let index = 0;

  function react() {
    index = (index + 1) % expressions.length;
    const next = expressions[index];
    
    // Update image
    mascot.src = `assets/${next.file}`;
    mascot.alt = next.label;
    
    // Update speech bubble
    if (speech) {
      speech.textContent = next.phrase;
      speech.classList.add("visible");
      
      // Clear previous timeout to prevent overlapping
      clearTimeout(window.speechTimeout);
      window.speechTimeout = setTimeout(() => {
        speech.classList.remove("visible");
      }, 2000);
    }

    // Bounce animation
    mascot.classList.remove("bounce");
    void mascot.offsetWidth; // trigger reflow
    mascot.classList.add("bounce");
  }

  mascot.addEventListener("click", react);
  mascot.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      react();
    }
  });
}

initMascotReactions();

// ---- Ambient background embers with Parallax ----
function initEmbers() {
  const canvas = document.getElementById("bg-fx");
  if (!canvas || !canvas.getContext) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  const ctx = canvas.getContext("2d");
  const colors = ["245,171,61", "242,146,29", "201,106,18", "255,255,255"];
  let particles = [];
  let width, height, dpr;
  let running = true;
  
  // Mouse parallax
  let mouseX = 0;
  let mouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeParticle() {
    return {
      x: Math.random() * width,
      y: height + Math.random() * 100,
      r: 1 + Math.random() * 3,
      speed: 0.2 + Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 0.1 + Math.random() * 0.4,
      flicker: Math.random() * Math.PI * 2,
      parallaxFactor: 0.05 + Math.random() * 0.1
    };
  }

  function init() {
    resize();
    const count = width < 480 ? 25 : width < 900 ? 40 : 60;
    particles = Array.from({ length: count }, () => {
      const p = makeParticle();
      p.y = Math.random() * height;
      return p;
    });
  }

  function step() {
    if (!running) return;
    ctx.clearRect(0, 0, width, height);

    // Smooth mouse parallax
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    for (const p of particles) {
      p.y -= p.speed;
      p.x += p.drift;
      p.flicker += 0.02;

      if (p.y < -10) {
        Object.assign(p, makeParticle());
        p.y = height + 10;
      }

      // Apply parallax offset
      const px = p.x + (mouseX * p.parallaxFactor);
      const py = p.y + (mouseY * p.parallaxFactor);

      const flick = 0.6 + 0.4 * Math.sin(p.flicker);
      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${(p.alpha * flick).toFixed(3)})`;
      ctx.fill();
    }

    requestAnimationFrame(step);
  }

  window.addEventListener("resize", resize);

  // Mouse move listener for parallax
  window.addEventListener("mousemove", (e) => {
    targetMouseX = (e.clientX - width / 2) * -1;
    targetMouseY = (e.clientY - height / 2) * -1;
  });

  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) requestAnimationFrame(step);
  });

  init();
  requestAnimationFrame(step);
}

initEmbers();
