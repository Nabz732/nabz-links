// ============================================================
// CONFIG
// ============================================================
const YT_CHANNEL_ID = "UCy3HMQmWOT56VHUU-GeuFUw";
const TWITCH_CHANNEL = "nabz732";
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const IS_TOUCH = window.matchMedia("(pointer: coarse)").matches;

// ============================================================
// PRELOADER
// ============================================================
(function initPreloader() {
  const preloader = document.getElementById("preloader");
  const fill = document.getElementById("preloader-fill");
  const text = document.getElementById("preloader-text");
  if (!preloader) return;

  const phrases = ["Booting chaos…", "Loading streams…", "Warming up…", "Ready."];
  let pct = 0;
  let phraseIdx = 0;

  const tick = setInterval(() => {
    pct = Math.min(100, pct + 8 + Math.random() * 15);
    fill.style.width = pct + "%";
    const newIdx = Math.min(phrases.length - 1, Math.floor((pct / 100) * phrases.length));
    if (newIdx !== phraseIdx) { phraseIdx = newIdx; text.textContent = phrases[phraseIdx]; }
    if (pct >= 100) {
      clearInterval(tick);
      setTimeout(() => {
        preloader.classList.add("done");
        document.body.classList.add("loaded");
        // kick off hero reveal
        document.querySelectorAll("[data-reveal]").forEach((el, i) => {
          setTimeout(() => el.classList.add("revealed"), 100 + i * 120);
        });
      }, 450);
    }
  }, 120);
})();

// ============================================================
// FOOTER YEAR
// ============================================================
document.getElementById("year").textContent = new Date().getFullYear();

// ============================================================
// AUDIO ENGINE (Web Audio API — no external files)
// ============================================================
const Audio = (() => {
  let ctx = null;
  let enabled = false;
  let ambientNode = null;

  function ensureCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function blip(freq = 660, dur = 0.08, type = "sine", gain = 0.05) {
    if (!enabled) return;
    const c = ensureCtx();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, c.currentTime + dur);
    g.gain.setValueAtTime(gain, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    osc.connect(g); g.connect(c.destination);
    osc.start(); osc.stop(c.currentTime + dur);
  }

  function ambientStart() {
    if (!enabled || ambientNode) return;
    const c = ensureCtx();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.value = 55;
    g.gain.value = 0.012;
    osc.connect(g); g.connect(c.destination);
    osc.start();
    ambientNode = { osc, g };
  }

  function ambientStop() {
    if (!ambientNode) return;
    try { ambientNode.osc.stop(); } catch (e) {}
    ambientNode = null;
  }

  return {
    get enabled() { return enabled; },
    toggle() {
      enabled = !enabled;
      if (enabled) { ensureCtx(); blip(880, 0.1, "sine", 0.06); ambientStart(); }
      else { ambientStop(); }
      return enabled;
    },
    hover() { blip(1200, 0.04, "sine", 0.025); },
    click() { blip(540, 0.09, "triangle", 0.07); },
    pop()   { blip(320, 0.14, "sawtooth", 0.06); },
    error() { blip(140, 0.22, "square", 0.05); },
    party() {
      if (!enabled) return;
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.15, "triangle", 0.08), i * 100));
    },
  };
})();

const soundToggle = document.getElementById("sound-toggle");
soundToggle.addEventListener("click", () => {
  const on = Audio.toggle();
  soundToggle.setAttribute("aria-pressed", String(on));
});

// Global hover/click sounds
document.querySelectorAll("[data-sound='hover']").forEach(el => {
  el.addEventListener("mouseenter", () => Audio.hover());
});
document.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (a) Audio.click();
}, { passive: true });

// ============================================================
// CUSTOM CURSOR
// ============================================================
(function initCursor() {
  if (IS_TOUCH || REDUCED_MOTION) return;
  const dot = document.getElementById("cursor-dot");
  const ring = document.getElementById("cursor-ring");
  if (!dot || !ring) return;

  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener("mousemove", (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx - 3}px, ${my - 3}px)`;
  });

  function loop() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx - 17}px, ${ry - 17}px)`;
    requestAnimationFrame(loop);
  }
  loop();

  const hoverables = "a, button, [role='button'], [data-magnetic], .social-pill, .xtc__discord";
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest(hoverables)) ring.classList.add("hovering");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest(hoverables)) ring.classList.remove("hovering");
  });
})();

// ============================================================
// MAGNETIC BUTTONS
// ============================================================
(function initMagnetic() {
  if (IS_TOUCH || REDUCED_MOTION) return;
  document.querySelectorAll("[data-magnetic]").forEach(el => {
    let raf = null;
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px) scale(1.03)`;
      });
    });
    el.addEventListener("mouseleave", () => {
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = "";
    });
  });
})();

// ============================================================
// SCROLL PROGRESS
// ============================================================
(function initScrollProgress() {
  const bar = document.getElementById("scroll-progress");
  if (!bar) return;
  function update() {
    const h = document.documentElement;
    const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
    bar.style.width = (scrolled * 100) + "%";
  }
  document.addEventListener("scroll", update, { passive: true });
  update();
})();

// ============================================================
// SCROLL REVEAL (for elements not in hero)
// ============================================================
(function initReveal() {
  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("revealed");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -50px 0px" });
  document.querySelectorAll("[data-reveal]").forEach(el => io.observe(el));
})();

// ============================================================
// TEXT SCRAMBLE
// ============================================================
(function initScramble() {
  if (REDUCED_MOTION) return;
  const chars = "!<>-_\\/[]{}—=+*^?#________";
  document.querySelectorAll("[data-scramble]").forEach(el => {
    const original = el.textContent;
    let frame = 0;
    const total = 22;
    function scramble() {
      let out = "";
      for (let i = 0; i < original.length; i++) {
        const reveal = (frame / total) * original.length;
        out += i < reveal
          ? original[i]
          : chars[Math.floor(Math.random() * chars.length)];
      }
      el.textContent = out;
      if (frame < total) {
        frame++;
        requestAnimationFrame(scramble);
      } else {
        el.textContent = original;
      }
    }
    // Trigger on first intersection
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) { scramble(); io.disconnect(); }
        });
      }, { threshold: 0.5 });
      io.observe(el);
    } else {
      scramble();
    }
  });
})();

// ============================================================
// STAT COUNTERS
// ============================================================
(function initCounters() {
  const nums = document.querySelectorAll(".stat__num");
  if (!nums.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || "";
      const dur = 1200;
      const start = performance.now();
      function step(t) {
        const p = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  nums.forEach(n => io.observe(n));
})();

// ============================================================
// LENS 3D TILT
// ============================================================
(function initTilt() {
  if (IS_TOUCH || REDUCED_MOTION) return;
  document.querySelectorAll("[data-tilt]").forEach(card => {
    let raf = null;
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rotY = (px - 0.5) * 12;
      const rotX = (0.5 - py) * 12;
      card.style.setProperty("--mx", (px * 100) + "%");
      card.style.setProperty("--my", (py * 100) + "%");
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(6px)`;
      });
    });
    card.addEventListener("mouseleave", () => {
      if (raf) cancelAnimationFrame(raf);
      card.style.transform = "";
    });
  });
})();

// ============================================================
// YOUTUBE LATEST VIDEO
// ============================================================
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
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        </div>
        <p class="yt-card__title">${escapeHtml(item.title)}</p>
        <span class="yt-card__link">Watch on YouTube</span>
      </a>
    `;
    Audio.pop();
  } catch (err) {
    body.innerHTML = `
      <p class="lens__loading">Couldn't load the latest video right now.</p>
      <a class="twitch-fallback" href="https://www.youtube.com/@Nabz.7327" target="_blank" rel="noopener">
        <span>Go to YouTube channel</span><span class="twitch-fallback__arrow">→</span>
      </a>
    `;
    Audio.error();
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

loadLatestVideo();

// ============================================================
// TWITCH EMBED
// ============================================================
function loadTwitchEmbed() {
  const container = document.getElementById("twitch-embed");
  const liveBadge = document.getElementById("live-badge");
  if (!container) return;

  const script = document.createElement("script");
  script.src = "https://embed.twitch.tv/embed/v1.js";
  script.onload = () => {
    try {
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
          if (isLive) Audio.pop();
        };
        player.addEventListener(Twitch.Player.ONLINE, () => setLive(true));
        player.addEventListener(Twitch.Player.OFFLINE, () => setLive(false));
      });
    } catch (e) {
      container.innerHTML = "";
    }
  };
  script.onerror = () => { container.innerHTML = ""; };
  document.body.appendChild(script);
}

loadTwitchEmbed();

// ============================================================
// MASCOT REACTIONS + PARTICLE BURST
// ============================================================
(function initMascot() {
  const mascot = document.getElementById("hero-mascot");
  const speech = document.getElementById("mascot-speech");
  const burstCanvas = document.getElementById("burst-canvas");
  if (!mascot) return;

  const expressions = [
    { file: "mascot-neutral.png", label: "Nabz mascot — click to react", phrase: "Yo! What's good?" },
    { file: "mascot-shocked.png", label: "Nabz mascot, shocked",          phrase: "CHAT IS THIS REAL?!" },
    { file: "mascot-angry.png",   label: "Nabz mascot, annoyed",          phrase: "Bro… not again." },
    { file: "mascot-spiky.png",   label: "Nabz mascot, smug",             phrase: "EZ Clap." },
    { file: "mascot-extra.png",   label: "Nabz mascot, confused",         phrase: "Wait, what?" },
  ];
  let index = 0;
  let speechTimer = null;

  // Burst canvas sizing
  let bctx = null;
  let particles = [];
  function sizeBurst() {
    if (!burstCanvas) return;
    const rect = burstCanvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    burstCanvas.width = rect.width * dpr;
    burstCanvas.height = rect.height * dpr;
    bctx = burstCanvas.getContext("2d");
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  if (burstCanvas) { sizeBurst(); window.addEventListener("resize", sizeBurst); }

  function spawnBurst() {
    if (!bctx || REDUCED_MOTION) return;
    const rect = burstCanvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const count = 26;
    const colors = ["#f2921d", "#ffab3d", "#c96a12", "#f5e9d8", "#fff"];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 3 + Math.random() * 5;
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.015 + Math.random() * 0.02,
        size: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    if (particles.length && !window.__burstRunning) {
      window.__burstRunning = true;
      requestAnimationFrame(burstLoop);
    }
  }

  function burstLoop() {
    if (!bctx) return;
    const rect = burstCanvas.getBoundingClientRect();
    bctx.clearRect(0, 0, rect.width, rect.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.vy += 0.05;
      p.life -= p.decay;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      bctx.globalAlpha = p.life;
      bctx.fillStyle = p.color;
      bctx.beginPath();
      bctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      bctx.fill();
    }
    bctx.globalAlpha = 1;
    if (particles.length) requestAnimationFrame(burstLoop);
    else {
      window.__burstRunning = false;
      bctx.clearRect(0, 0, rect.width, rect.height);
    }
  }

  function react() {
    index = (index + 1) % expressions.length;
    const next = expressions[index];

    mascot.src = `assets/${next.file}`;
    mascot.alt = next.label;

    if (speech) {
      speech.textContent = next.phrase;
      speech.classList.add("visible");
      clearTimeout(speechTimer);
      speechTimer = setTimeout(() => speech.classList.remove("visible"), 2200);
    }

    mascot.classList.remove("bounce");
    void mascot.offsetWidth;
    mascot.classList.add("bounce");

    spawnBurst();
    Audio.pop();
  }

  mascot.addEventListener("click", react);
  mascot.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); react(); }
  });
})();

// ============================================================
// AMBIENT BACKGROUND PARTICLES + PARALLAX
// ============================================================
(function initEmbers() {
  const canvas = document.getElementById("bg-fx");
  if (!canvas || !canvas.getContext) return;
  if (REDUCED_MOTION) return;

  const ctx = canvas.getContext("2d");
  const colors = ["245,171,61", "242,146,29", "201,106,18", "255,255,255"];
  let particles = [];
  let width, height, dpr;
  let running = true;
  let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;

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
      r: 0.8 + Math.random() * 2.4,
      speed: 0.2 + Math.random() * 0.45,
      drift: (Math.random() - 0.5) * 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 0.15 + Math.random() * 0.35,
      flicker: Math.random() * Math.PI * 2,
      parallax: 0.04 + Math.random() * 0.12,
    };
  }

  function init() {
    resize();
    const count = width < 480 ? 22 : width < 900 ? 38 : 55;
    particles = Array.from({ length: count }, () => {
      const p = makeParticle();
      p.y = Math.random() * height;
      return p;
    });
  }

  function step() {
    if (!running) return;
    ctx.clearRect(0, 0, width, height);

    mouseX += (targetX - mouseX) * 0.05;
    mouseY += (targetY - mouseY) * 0.05;

    for (const p of particles) {
      p.y -= p.speed;
      p.x += p.drift;
      p.flicker += 0.02;

      if (p.y < -10) { Object.assign(p, makeParticle()); p.y = height + 10; }

      const px = p.x + mouseX * p.parallax;
      const py = p.y + mouseY * p.parallax;
      const flick = 0.6 + 0.4 * Math.sin(p.flicker);

      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${(p.alpha * flick).toFixed(3)})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(${p.color}, ${(p.alpha * 0.6).toFixed(3)})`;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    requestAnimationFrame(step);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", (e) => {
    targetX = (e.clientX - width / 2) * -1;
    targetY = (e.clientY - height / 2) * -1;
  });
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) requestAnimationFrame(step);
  });

  init();
  requestAnimationFrame(step);
})();

// ============================================================
// KONAMI CODE EASTER EGG
// ============================================================
(function initKonami() {
  const seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  let idx = 0;

  document.addEventListener("keydown", (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === seq[idx]) {
      idx++;
      if (idx === seq.length) {
        idx = 0;
        triggerParty();
      }
    } else {
      idx = (key === seq[0]) ? 1 : 0;
    }
  });

  function triggerParty() {
    document.body.classList.add("party-mode");
    Audio.party();

    // Confetti burst from top
    const colors = ["#f2921d", "#ffab3d", "#c96a12", "#f5e9d8", "#fff", "#ff3c3c", "#9146ff", "#00f2ea"];
    const container = document.body;
    for (let i = 0; i < 80; i++) {
      const c = document.createElement("div");
      c.style.cssText = `
        position: fixed;
        top: -20px;
        left: ${Math.random() * 100}vw;
        width: ${6 + Math.random() * 8}px;
        height: ${6 + Math.random() * 8}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
        pointer-events: none;
        z-index: 99999;
        transform: rotate(${Math.random() * 360}deg);
        transition: transform ${2 + Math.random() * 2}s ease-in, top ${2 + Math.random() * 2}s ease-in, opacity 0.5s ease ${2 + Math.random()}s;
      `;
      container.appendChild(c);
      requestAnimationFrame(() => {
        c.style.top = (100 + Math.random() * 20) + "vh";
        c.style.transform = `rotate(${Math.random() * 720 - 360}deg) translateX(${(Math.random() - 0.5) * 200}px)`;
        c.style.opacity = "0";
      });
      setTimeout(() => c.remove(), 4500);
    }

    setTimeout(() => document.body.classList.remove("party-mode"), 8000);
  }
})();
