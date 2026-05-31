const $ = (id) => document.getElementById(id);

const PERFUMES = {
  nile: {
    name: "尼罗河花园",
    family: "柑橘水生绿意调",
    notes: ["青芒果", "莲花", "柑橘皮", "青草", "清澈水流"],
    palette: ["#6fe7c8", "#f9d75d", "#4a9cff", "#dfffe8"],
    motifs: ["river", "grass", "citrus", "petal"],
    tempo: 94
  },
  bloom: {
    name: "绯雾花庭",
    family: "花香粉感麝香调",
    notes: ["玫瑰", "梨花", "粉雾", "白麝香", "柔软丝绸"],
    palette: ["#ff8fb7", "#ffd6e6", "#b892ff", "#fff0f7"],
    motifs: ["petal", "veil", "ribbon", "spark"],
    tempo: 78
  },
  amber: {
    name: "琥珀书房",
    family: "木质琥珀皮革调",
    notes: ["雪松", "纸张", "琥珀", "烟草", "皮革"],
    palette: ["#d8994b", "#5d3a22", "#f3cf8a", "#1f1510"],
    motifs: ["ember", "paper", "wood", "smoke"],
    tempo: 66
  },
  raintea: {
    name: "雨后茶室",
    family: "茶香绿叶雨水调",
    notes: ["龙井茶", "雨水", "竹叶", "白花", "湿石"],
    palette: ["#9bdc8c", "#6bb7a8", "#d5f6ef", "#61796a"],
    motifs: ["rain", "leaf", "steam", "ripple"],
    tempo: 84
  }
};

const state = {
  mood: "清透",
  profile: null,
  particles: [],
  startedAt: performance.now(),
  width: 0,
  height: 0,
  dpr: 1,
  busy: false
};

const canvas = $("scentCanvas");
const ctx = canvas.getContext("2d");

let audioCtx = null;
let musicTimer = null;
let padNodes = [];
let isPlaying = false;

function hashNumber(value, min, max) {
  let hash = 2166136261;
  const str = String(value);
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const n = (hash >>> 0) / 4294967295;
  return min + n * (max - min);
}

function pick(list, seed) {
  return list[Math.floor(hashNumber(seed, 0, list.length - 0.0001))];
}

function randomBottle() {
  const a = Math.floor(100000 + Math.random() * 899999);
  return `SS-${a}`;
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const value = parseInt(normalized.length === 3
    ? normalized.split("").map((c) => c + c).join("")
    : normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function rgba(hex, alpha) {
  const c = hexToRgb(hex);
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, Number(n) || min));
}

function localProfile(payload) {
  const perfume = PERFUMES[payload.perfumeId] || PERFUMES.nile;
  const seed = `${payload.perfumeId}-${payload.bottleId}-${payload.ownerName}-${payload.mood}`;
  const names = {
    nile: ["河光青芒", "汀草回声", "柑橘水灵", "莲岸信使"],
    bloom: ["绯雾花仆", "玫瑰耳语", "粉庭织梦", "梨光小像"],
    amber: ["琥珀旧页", "雪松守夜", "烟草书灵", "皮革火种"],
    raintea: ["雨茶竹影", "湿石白花", "云叶茶侍", "青盏回声"]
  };
  const id = payload.perfumeId || "nile";
  return {
    source: "local",
    generatedAt: new Date().toISOString(),
    perfume: {
      id,
      name: perfume.name,
      family: perfume.family,
      notes: perfume.notes
    },
    bottle: {
      id: payload.bottleId,
      ownerName: payload.ownerName,
      edition: pick(["晨雾版", "河光版", "温室版", "雨声版", "夜航版"], seed),
      rarity: pick(["Common", "Uncommon", "Rare", "Rare", "Secret"], seed + "rarity")
    },
    ip: {
      name: pick(names[id], seed + "name"),
      archetype: pick(["情绪记录员", "气味采样师", "花园引路者", "瓶中守望者"], seed + "arch"),
      personality: pick([
        "安静但反应很快，会把你的情绪翻译成颜色。",
        "像一阵刚被阳光照到的风，轻快、敏感、带一点任性。",
        "喜欢收集微小的气味变化，把它们整理成可播放的记忆。",
        "不说太多话，但会用水纹、花瓣和旋律提醒你今天的状态。"
      ], seed + "personality"),
      catchphrase: pick([
        "我替你把今天的味道藏进光里。",
        "靠近一点，这瓶香气正在醒来。",
        "你的编号，不会和任何人重复。",
        "每次唤醒，我都会变得更像你。"
      ], seed + "catch")
    },
    scene: {
      environment: `${perfume.name} 的私人气味世界`,
      palette: perfume.palette,
      motifs: perfume.motifs,
      weather: pick(["清晨微光", "雨后薄雾", "傍晚金色风", "玻璃温室", "夜里潮湿的空气"], seed + "weather"),
      motion: {
        flow: hashNumber(seed + "flow", 0.5, 1.25),
        bloom: hashNumber(seed + "bloom", 0.25, 1.15),
        sparkle: hashNumber(seed + "spark", 0.1, 0.9),
        density: hashNumber(seed + "density", 0.4, 0.95)
      }
    },
    music: {
      bpm: Math.round(perfume.tempo + hashNumber(seed, -10, 14)),
      key: pick(["C Lydian", "D Major", "E Minor", "G Major", "A Dorian"], seed + "key"),
      instruments: pick([
        ["water pad", "glass bell", "soft marimba"],
        ["breath synth", "pluck", "field recording"],
        ["warm pad", "low cello", "vinyl noise"],
        ["rain keys", "tea bowl", "air flute"]
      ], seed + "inst"),
      mood: payload.mood,
      brightness: hashNumber(seed + "bright", 0.25, 0.95),
      warmth: hashNumber(seed + "warm", 0.15, 0.9),
      pulse: hashNumber(seed + "pulse", 0.25, 0.95)
    },
    traits: [
      pick(["清透", "温柔", "潮湿", "灿烂"], seed + "t1"),
      pick(["可收藏", "会回应", "有编号", "会变奏"], seed + "t2"),
      pick(["适合分享", "适合私藏", "适合夜晚唤醒", "适合雨天唤醒"], seed + "t3")
    ],
    story: {
      opening: `${payload.ownerName || "你"} 唤醒编号 ${payload.bottleId} 时，${perfume.notes[0]} 先从瓶口升起，${perfume.notes[1]} 慢慢铺成它的影子。`,
      ritual: `它记住了你选择的“${payload.mood}”，所以这次的动画会更偏向 ${pick(["水流", "花雾", "木纹", "雨线"], seed + "ritual")}，旋律也会留下一个很轻的回声。`,
      unlockHint: "分享收藏卡或连续唤醒 7 天，可以解锁第二段动画和隐藏音色。"
    },
    share: {
      title: `${perfume.name} 的 ${pick(names[id], seed + "name2")}`,
      subtitle: `这不是赠品，是编号 ${payload.bottleId} 的香气数字灵魂。`,
      hashtags: ["#ScentSoul", "#香水数字IP", `#${perfume.name.replace(/\s+/g, "")}`]
    }
  };
}

function resizeCanvas() {
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.width = Math.floor(window.innerWidth);
  state.height = Math.floor(window.innerHeight);
  canvas.width = Math.floor(state.width * state.dpr);
  canvas.height = Math.floor(state.height * state.dpr);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  seedParticles();
}

function seedParticles() {
  const profile = state.profile || localProfile(currentPayload());
  const density = profile.scene.motion.density || 0.65;
  const count = Math.floor(90 + density * 190);
  state.particles = Array.from({ length: count }, (_, i) => ({
    x: hashNumber(`${i}-x-${profile.bottle.id}`, 0, state.width),
    y: hashNumber(`${i}-y-${profile.bottle.id}`, 0, state.height),
    r: hashNumber(`${i}-r-${profile.ip.name}`, 0.8, 5.5),
    speed: hashNumber(`${i}-s-${profile.music.bpm}`, 0.16, 1.8),
    angle: hashNumber(`${i}-a-${profile.scene.weather}`, 0, Math.PI * 2),
    color: pick(profile.scene.palette, `${i}-c-${profile.bottle.id}`),
    motif: pick(profile.scene.motifs, `${i}-m-${profile.ip.name}`),
    phase: hashNumber(`${i}-p`, 0, Math.PI * 2)
  }));
}

function drawBackground(profile, t) {
  const colors = profile.scene.palette;
  const g = ctx.createLinearGradient(0, 0, state.width, state.height);
  g.addColorStop(0, rgba(colors[0], 0.55));
  g.addColorStop(0.45, rgba(colors[1] || colors[0], 0.24));
  g.addColorStop(1, rgba(colors[2] || colors[0], 0.4));
  ctx.fillStyle = "#070806";
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, state.width, state.height);

  const pulse = 0.5 + Math.sin(t * 0.0004) * 0.12;
  const radial = ctx.createRadialGradient(
    state.width * (0.5 + Math.sin(t * 0.00017) * 0.08),
    state.height * (0.45 + Math.cos(t * 0.00019) * 0.08),
    0,
    state.width * 0.5,
    state.height * 0.5,
    Math.max(state.width, state.height) * 0.75
  );
  radial.addColorStop(0, rgba(colors[3] || colors[0], 0.18 + pulse * 0.12));
  radial.addColorStop(1, "rgba(0,0,0,0.68)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, state.width, state.height);
}

function drawRiver(profile, t) {
  const flow = profile.scene.motion.flow;
  const colors = profile.scene.palette;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let line = 0; line < 8; line += 1) {
    const yBase = state.height * (0.25 + line * 0.07);
    ctx.beginPath();
    for (let x = -40; x <= state.width + 40; x += 18) {
      const y = yBase + Math.sin(x * 0.008 + t * 0.001 * flow + line) * (18 + line * 2);
      if (x === -40) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = rgba(colors[line % colors.length], 0.16);
    ctx.lineWidth = 1.2 + line * 0.3;
    ctx.stroke();
  }
  ctx.restore();
}

function drawGrass(profile, t) {
  const colors = profile.scene.palette;
  const flow = profile.scene.motion.flow;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 70; i += 1) {
    const x = (i / 70) * state.width + Math.sin(i) * 18;
    const baseY = state.height + 20;
    const h = 70 + Math.sin(i * 0.7) * 40;
    const sway = Math.sin(t * 0.0012 * flow + i) * 20;
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.quadraticCurveTo(x + sway, baseY - h * 0.56, x + sway * 0.35, baseY - h);
    ctx.strokeStyle = rgba(colors[i % colors.length], 0.16);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

function drawWood(profile, t) {
  const colors = profile.scene.palette;
  ctx.save();
  ctx.globalAlpha = 0.23;
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 18; i += 1) {
    const x = state.width * (0.12 + (i % 6) * 0.17);
    const y = state.height * (0.2 + Math.floor(i / 6) * 0.23);
    ctx.beginPath();
    ctx.ellipse(
      x + Math.sin(t * 0.0002 + i) * 18,
      y,
      58 + i * 2,
      18 + (i % 4) * 5,
      Math.sin(i) * 0.5,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = rgba(colors[i % colors.length], 0.8);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

function drawParticle(p, profile, t) {
  const colors = profile.scene.palette;
  const motion = profile.scene.motion;
  p.x += Math.cos(p.angle) * p.speed * motion.flow;
  p.y += Math.sin(p.angle) * p.speed * motion.flow - 0.12 * motion.bloom;
  p.angle += Math.sin(t * 0.0002 + p.phase) * 0.006;

  if (p.x < -40) p.x = state.width + 40;
  if (p.x > state.width + 40) p.x = -40;
  if (p.y < -50) p.y = state.height + 50;
  if (p.y > state.height + 50) p.y = -50;

  const alpha = 0.16 + motion.sparkle * 0.45;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle + Math.sin(t * 0.001 + p.phase) * 0.8);
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = rgba(p.color || colors[0], alpha);
  ctx.strokeStyle = rgba(p.color || colors[0], alpha * 0.85);
  ctx.lineWidth = 1;

  if (p.motif === "citrus") {
    ctx.beginPath();
    ctx.arc(0, 0, p.r * 2.6, 0.2, Math.PI * 1.65);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(p.r * 2.2, 0);
    ctx.stroke();
  } else if (["petal", "leaf", "paper"].includes(p.motif)) {
    ctx.beginPath();
    ctx.moveTo(0, -p.r * 3);
    ctx.bezierCurveTo(p.r * 2.4, -p.r, p.r * 1.8, p.r * 2.5, 0, p.r * 3);
    ctx.bezierCurveTo(-p.r * 1.8, p.r * 2.5, -p.r * 2.4, -p.r, 0, -p.r * 3);
    ctx.fill();
  } else if (["rain", "river", "ripple"].includes(p.motif)) {
    ctx.beginPath();
    ctx.moveTo(0, -p.r * 4);
    ctx.lineTo(0, p.r * 4);
    ctx.stroke();
  } else if (["ember", "spark"].includes(p.motif)) {
    ctx.beginPath();
    ctx.moveTo(0, -p.r * 2.8);
    ctx.lineTo(p.r * 2.2, p.r * 2.2);
    ctx.lineTo(-p.r * 2.2, p.r * 1.4);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawScene(t) {
  const profile = state.profile || localProfile(currentPayload());
  drawBackground(profile, t);
  const motifs = profile.scene.motifs || [];
  if (motifs.some((m) => ["river", "ripple", "rain"].includes(m))) drawRiver(profile, t);
  if (motifs.includes("grass") || motifs.includes("leaf")) drawGrass(profile, t);
  if (motifs.includes("wood") || motifs.includes("paper")) drawWood(profile, t);

  state.particles.forEach((p) => drawParticle(p, profile, t));

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.font = `700 ${Math.max(82, state.width * 0.11)}px Inter, sans-serif`;
  ctx.fillStyle = rgba(profile.scene.palette[0], 0.055);
  ctx.fillText(profile.perfume.name, state.width * 0.06, state.height * 0.55);
  ctx.restore();

  requestAnimationFrame(drawScene);
}

function currentPayload() {
  return {
    perfumeId: $("perfumeId").value,
    ownerName: $("ownerName").value.trim() || "匿名收藏者",
    bottleId: $("bottleId").value.trim() || randomBottle(),
    mood: state.mood
  };
}

function normalizeProfile(profile) {
  const perfume = PERFUMES[profile?.perfume?.id] || PERFUMES[$("perfumeId").value] || PERFUMES.nile;
  const motion = profile.scene?.motion || {};
  return {
    ...profile,
    source: profile.source || "local",
    perfume: {
      id: profile.perfume?.id || $("perfumeId").value,
      name: profile.perfume?.name || perfume.name,
      family: profile.perfume?.family || perfume.family,
      notes: profile.perfume?.notes || perfume.notes
    },
    scene: {
      environment: profile.scene?.environment || perfume.name,
      palette: profile.scene?.palette?.length >= 4 ? profile.scene.palette : perfume.palette,
      motifs: profile.scene?.motifs?.length ? profile.scene.motifs : perfume.motifs,
      weather: profile.scene?.weather || "清晨微光",
      motion: {
        flow: clamp(motion.flow, 0.2, 1.8),
        bloom: clamp(motion.bloom, 0.1, 1.5),
        sparkle: clamp(motion.sparkle, 0.05, 1.2),
        density: clamp(motion.density, 0.2, 1)
      }
    },
    music: {
      bpm: Math.round(clamp(profile.music?.bpm || perfume.tempo, 50, 132)),
      key: profile.music?.key || "C Lydian",
      instruments: profile.music?.instruments || ["water pad", "glass bell", "soft marimba"],
      mood: profile.music?.mood || state.mood,
      brightness: clamp(profile.music?.brightness, 0, 1),
      warmth: clamp(profile.music?.warmth, 0, 1),
      pulse: clamp(profile.music?.pulse, 0, 1)
    }
  };
}

function applyTheme(profile) {
  const colors = profile.scene.palette;
  document.documentElement.style.setProperty("--accent", colors[0] || "#76f0cb");
  document.documentElement.style.setProperty("--accent2", colors[1] || "#f8d25d");
  document.documentElement.style.setProperty("--danger", colors[2] || "#ff8f9d");
}

function renderProfile(profile, warning = "") {
  const p = normalizeProfile(profile);
  state.profile = p;
  applyTheme(p);
  seedParticles();

  $("ipName").textContent = p.ip.name;
  $("ipLine").textContent = p.ip.catchphrase || p.ip.personality;
  $("sourcePill").textContent = warning ? "FALLBACK" : p.source.toUpperCase();
  $("perfumeName").textContent = p.perfume.name;
  $("editionName").textContent = p.bottle.edition;
  $("rarity").textContent = p.bottle.rarity;
  $("cardRarity").textContent = p.bottle.rarity;
  $("bpm").textContent = p.music.bpm;
  $("openingStory").textContent = p.story.opening;
  $("ritualStory").textContent = p.story.ritual;
  $("familyName").textContent = p.perfume.family;
  $("notes").innerHTML = p.perfume.notes.map((note) => `<span>${note}</span>`).join("");
  $("shareTitle").textContent = p.share.title;
  $("shareSubtitle").textContent = p.share.subtitle;
  $("tags").innerHTML = [...(p.share.hashtags || []), ...(p.traits || []).slice(0, 3)]
    .slice(0, 7)
    .map((tag) => `<span>${tag}</span>`)
    .join("");

  $("flowMeter").value = p.scene.motion.flow;
  $("bloomMeter").value = p.scene.motion.bloom;
  $("sparkMeter").value = p.scene.motion.sparkle;
  $("densityMeter").value = p.scene.motion.density;
  $("scanCount").textContent = Math.round(hashNumber(p.bottle.id + "scan", 900, 9800)).toLocaleString();
  $("shareRate").textContent = `${Math.round(hashNumber(p.ip.name + "share", 18, 48))}%`;
  $("unlockRate").textContent = `${Math.round(hashNumber(p.ip.archetype + "unlock", 8, 36))}%`;
  $("favMood").textContent = p.music.mood || state.mood;

  if (isPlaying) restartMusic();
  if (warning) showToast(warning);
}

async function generateProfile() {
  if (state.busy) return;
  const payload = currentPayload();
  $("bottlePreview").textContent = payload.bottleId;
  state.busy = true;
  $("generateBtn").disabled = true;
  $("generateBtn").querySelector("span").textContent = "正在生成香气灵魂";

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    const data = await response.json();
    if (!data.profile) throw new Error(data.error || "No profile");
    renderProfile(data.profile, data.warning || "");
  } catch (error) {
    renderProfile(localProfile(payload), "未连接后端，已使用浏览器本地生成。");
  } finally {
    state.busy = false;
    $("generateBtn").disabled = false;
    $("generateBtn").querySelector("span").textContent = "生成专属数字灵魂";
  }
}

function noteFrequency(noteName) {
  const base = {
    C: 261.63,
    D: 293.66,
    E: 329.63,
    F: 349.23,
    G: 392.0,
    A: 440.0,
    B: 493.88
  };
  const root = noteName?.trim()?.[0]?.toUpperCase() || "C";
  return base[root] || 261.63;
}

function createAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(freq, time, duration, type, volume, filterFreq) {
  const ac = createAudioContext();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const filter = ac.createBiquadFilter();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(filterFreq, time);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(volume, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  osc.start(time);
  osc.stop(time + duration + 0.04);
}

function startPad(profile) {
  const ac = createAudioContext();
  stopPad();
  const root = noteFrequency(profile.music.key);
  const warmth = profile.music.warmth;
  const brightness = profile.music.brightness;
  [0.5, 1, 1.5].forEach((ratio, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const filter = ac.createBiquadFilter();
    osc.type = i === 0 ? "sine" : "triangle";
    osc.frequency.value = root * ratio * (i === 2 ? 1.333 : 1);
    gain.gain.value = 0.012 + warmth * 0.018;
    filter.type = "lowpass";
    filter.frequency.value = 360 + brightness * 1100;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    padNodes.push({ osc, gain, filter });
  });
}

function stopPad() {
  padNodes.forEach(({ osc, gain }) => {
    try {
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);
      osc.stop(audioCtx.currentTime + 0.1);
    } catch {}
  });
  padNodes = [];
}

function startMusic() {
  const profile = state.profile || localProfile(currentPayload());
  const ac = createAudioContext();
  if (ac.state === "suspended") ac.resume();
  isPlaying = true;
  $("musicIcon").textContent = "Ⅱ";
  $("musicToggle").querySelectorAll("span")[1].textContent = "暂停香气音乐";
  startPad(profile);

  const root = noteFrequency(profile.music.key);
  const scale = profile.music.key.includes("Minor")
    ? [1, 1.125, 1.2, 1.5, 1.667, 1.8]
    : [1, 1.125, 1.25, 1.5, 1.667, 1.875];
  const step = 60000 / profile.music.bpm;
  let tick = 0;
  musicTimer = setInterval(() => {
    const now = ac.currentTime;
    const brightness = profile.music.brightness;
    const pulse = profile.music.pulse;
    const note = root * pick(scale, `${profile.bottle.id}-${tick}`) * pick([0.5, 1, 2], `${profile.ip.name}-${tick}`);
    const type = brightness > 0.68 ? "triangle" : profile.music.warmth > 0.6 ? "sine" : "square";
    playTone(note, now, 0.16 + pulse * 0.28, type, 0.025 + brightness * 0.035, 420 + brightness * 2600);
    if (tick % 4 === 0) {
      playTone(root * 0.5, now, 0.8, "sine", 0.018 + profile.music.warmth * 0.02, 260 + profile.music.warmth * 700);
    }
    tick += 1;
  }, step);
}

function stopMusic() {
  isPlaying = false;
  $("musicIcon").textContent = "▶";
  $("musicToggle").querySelectorAll("span")[1].textContent = "播放香气音乐";
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
  stopPad();
}

function restartMusic() {
  stopMusic();
  startMusic();
}

function copyCard() {
  const p = state.profile || localProfile(currentPayload());
  const text = [
    p.share.title,
    p.share.subtitle,
    `香水：${p.perfume.name}`,
    `编号：${p.bottle.id}`,
    `IP：${p.ip.name} / ${p.ip.archetype}`,
    `故事：${p.story.opening}`,
    ...(p.share.hashtags || [])
  ].join("\n");
  navigator.clipboard?.writeText(text).then(
    () => showToast("收藏卡已复制"),
    () => showToast("浏览器不允许复制，可以手动选中文案")
  );
}

function savePng() {
  const link = document.createElement("a");
  link.download = `${state.profile?.ip?.name || "scent-soul"}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  showToast("动态画面已保存为 PNG");
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2300);
}

function bindEvents() {
  $("scentForm").addEventListener("submit", (event) => {
    event.preventDefault();
    generateProfile();
  });

  $("randomBottle").addEventListener("click", () => {
    $("bottleId").value = randomBottle();
    $("bottlePreview").textContent = $("bottleId").value;
  });

  $("bottleId").addEventListener("input", () => {
    $("bottlePreview").textContent = $("bottleId").value || "SS-000000";
  });

  $("perfumeId").addEventListener("change", () => {
    renderProfile(localProfile(currentPayload()));
  });

  $("moodChips").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-mood]");
    if (!button) return;
    state.mood = button.dataset.mood;
    [...$("moodChips").querySelectorAll("button")].forEach((btn) => btn.classList.toggle("active", btn === button));
  });

  $("musicToggle").addEventListener("click", () => {
    if (isPlaying) stopMusic();
    else startMusic();
  });

  $("copyCard").addEventListener("click", copyCard);
  $("savePng").addEventListener("click", savePng);
  window.addEventListener("resize", resizeCanvas);
}

function init() {
  bindEvents();
  $("bottlePreview").textContent = $("bottleId").value;
  resizeCanvas();
  renderProfile(localProfile(currentPayload()));
  requestAnimationFrame(drawScene);
}

init();
