import { PERFUME_BRANDS, PERFUME_CATALOG, buildPerfumeMap, getCatalogItem } from "./catalog.js";

const $ = (id) => document.getElementById(id);

const sessionId = (() => {
  const existing = localStorage.getItem("scentSoulSessionId");
  if (existing) return existing;
  const next = crypto.randomUUID?.() || `ss-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem("scentSoulSessionId", next);
  return next;
})();

function track(event, detail = {}) {
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event,
      detail,
      sessionId,
      path: location.pathname,
      ts: new Date().toISOString()
    })
  }).catch(() => {});
}

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

Object.assign(PERFUMES, buildPerfumeMap());

const PRODUCT_IMAGES = {
  "hermes-nile": "https://assets.hermes.com/is/image/hermesproduct/un-jardin-sur-le-nil-eau-de-toilette--20396-worn-2-0-0-1000-1000_g.jpg",
  "byredo-bal": "https://www.byredo.com/media/catalog/category/ASSET_290_EVG_ECOM_SPOTVIEW_1400x1400_IMAGE_noLogo_noTagline_1.jpg",
  "byredo-gypsy": "https://www.byredo.com/cdn-cgi/image/format=auto,quality=70/https://www.byredo.com/media/catalog/product/cache/538055185084634e259189a2a72f806b/8/0/806168_1_full_no.jpg",
  "byredo-mojave": "https://www.byredo.com/media/catalog/category/ASSET_280_EVG_ECOM_SPOTVIEW_1400x1400_IMAGE_noLogo_noTagline.jpg",
  "byredo-blanche": "https://www.byredo.com/media/catalog/category/ASSET_410_EVG_ECOM_SPOTVIEW_1400x1400_IMAGE_noLogo_noTagline.jpg",
  "diptyque-philosykos": "https://www.diptyqueparis.com/media/catalog/product/d/i/diptyque-philosykos-eau-de-parfum-75ml-philop75-1.jpg?quality=100&bg-color=255,255,255&fit=bounds",
  "diptyque-do-son": "https://cdn.shopify.com/s/files/1/0765/6138/3745/files/483106.jpg?v=1754972128&width=1200&crop=center",
  "diptyque-tamdao": "https://cdn.shopify.com/s/files/1/0765/6138/3745/files/483140.jpg?v=1754971741&width=1200&crop=center",
  "dior-sauvage": "https://www.dior.com/on/demandware.static/-/Sites-master_dior/default/dwafe36935/Y0785220/Y0785220_C099600180_E01_GHC.jpg",
  "dior-jadore": "https://www.dior.com/on/demandware.static/-/Sites-master_dior/default/dw9251021c/Y0998031/Y0998031_C099800246_E01_GHC.jpg",
  "dior-miss-dior": "https://www.dior.com/on/demandware.static/-/Sites-master_dior/default/dwd645641e/Y0996347/Y0996347_C099600763_E01_GHC.jpg",
  "ysl-libre": "https://www.yslbeauty.com/dw/image/v2/BDCR_PRD/on/demandware.static/-/Sites-ysl-master-catalog/en/dw469e11e9/square/Fragrance/Libre_EDP/v23614272648418_libre_eau_de_parfum_50ml.png",
  "ysl-myslf": "https://www.yslbeauty.com/dw/image/v2/BDCR_PRD/on/demandware.static/-/Sites-ysl-master-catalog/default/dw2023d58c/Fragrance/ForHim/MYSLF/WW-51115YSL/3614273852807-myslf-eau-de-parfum-main-v2.png",
  "frederic-musc": "https://www.fredericmalle.com/media/images/products/630x615/fm_sku_FMNA78_630x615_0.jpg",
  "jomalone-pear": "https://www.jomalone.com/media/export/cms/products/670x670/jo_sku_LA6C01_670x670_0.png",
  "lelabo-santal33": "https://lelabo.ips.photos/lelabo-java/images/skus/050PS33100__PRODUCT_01--IMG_1200--SANTAL33--79960236.jpg",
  "lelabo-another13": "https://lelabo.ips.photos/lelabo-java/images/skus/050PA13100__PRODUCT_07--IMG_1200--ANOTHER13--1468125917.jpg",
  "margiela-lazy": "https://www.maisonmargiela.com/on/demandware.static/-/Sites-margiela-master-catalog/default/dwd5bce2b7/images/large/S33YX0018_S10932_001_F.jpg",
  "tomford-oudwood": "https://www.tomfordbeauty.com/cdn/shop/files/tf_sku_T1XF01_2000x2000_0.png?v=1780267534",
  "mfk-br540": "https://www.franciskurkdjian.com/dw/image/v2/BJSB_PRD/on/demandware.static/-/Sites-mfk-master-catalog/default/dwa46019b3/BACCARAT_ROUGE_540/FRAGRANCE/3700559603116_BR540_EDP_70ML_1.png?sw=640&sh=640&strip=false",
  "kilian-love": "https://www.bykilian.com/media/images/products/833x968/kl_sku_N3E601_833x968_0.jpg",
  "creed-aventus": "https://cdn.shopify.com/s/files/1/0765/6138/3745/files/49365.jpg?v=1754972571&width=1200&crop=center",
  "bvlgari-omnia": "https://media.bulgari.com/image/upload/c_pad,h_1090,w_1090/q_auto/f_auto/1675256.png",
  "nishane-hacivat": "https://nishane.com/wp-content/uploads/2022/09/a-50ml-19-HACIVAT.jpg",
  "millerharris-tea": "https://cdn.shopify.com/s/files/1/0028/4606/4709/collections/Hydra_-_Collection_Header_Mobile_1080_x_1080.jpg?v=1763036220",
  "floraiku-umbrella": "https://www.floraiku.com/cdn/shop/files/FAMILLE_nouveauxpursesprays_elargi_e411eeb6-27a3-4f14-9054-0efa79e28719.jpg?v=1642168061&width=2048"
};

const FEATURED_IDS = [
  "byredo-bal",
  "dior-sauvage",
  "lelabo-santal33",
  "tomford-oudwood",
  "mfk-br540"
];

const state = {
  mood: "清透",
  feedbackReason: "visual",
  view: "advisor",
  carouselIndex: 0,
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

function svgText(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function fallbackBottleImage(item, variant = "card") {
  const colors = item.palette || ["#76f0cb", "#f8d25d", "#4a9cff", "#f8f4e9"];
  const width = variant === "hero" ? 980 : 420;
  const height = variant === "hero" ? 620 : 520;
  const brand = svgText(item.brandCn || item.brand);
  const name = svgText(item.nameCn || item.name);
  const family = svgText(item.family);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="${colors[0]}" offset="0"/>
          <stop stop-color="${colors[1] || colors[0]}" offset="0.48"/>
          <stop stop-color="${colors[2] || colors[0]}" offset="1"/>
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#ffffff" stop-opacity="0.92" offset="0"/>
          <stop stop-color="${colors[3] || "#ffffff"}" stop-opacity="0.42" offset="0.55"/>
          <stop stop-color="#111111" stop-opacity="0.2" offset="1"/>
        </linearGradient>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="28" stdDeviation="24" flood-color="#000000" flood-opacity="0.36"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="#0d0d0a"/>
      <rect width="100%" height="100%" fill="url(#bg)" opacity="0.64"/>
      <circle cx="${width * 0.82}" cy="${height * 0.16}" r="${height * 0.24}" fill="#ffffff" opacity="0.12"/>
      <circle cx="${width * 0.18}" cy="${height * 0.86}" r="${height * 0.28}" fill="#000000" opacity="0.22"/>
      <g filter="url(#shadow)" transform="translate(${width * 0.48} ${height * 0.48})">
        <rect x="-62" y="-210" width="124" height="50" rx="11" fill="#11110f"/>
        <rect x="-38" y="-250" width="76" height="44" rx="8" fill="#f8f4e9" opacity="0.9"/>
        <rect x="-118" y="-160" width="236" height="286" rx="36" fill="url(#glass)" stroke="#ffffff" stroke-opacity="0.55" stroke-width="3"/>
        <rect x="-82" y="-84" width="164" height="112" rx="12" fill="#0d0d0a" opacity="0.78"/>
        <text x="0" y="-42" fill="#f8f4e9" font-size="28" font-family="Arial, sans-serif" font-weight="700" text-anchor="middle">${brand}</text>
        <text x="0" y="-6" fill="#f8f4e9" font-size="20" font-family="Arial, sans-serif" text-anchor="middle">${name}</text>
        <text x="0" y="30" fill="#f8f4e9" opacity="0.7" font-size="15" font-family="Arial, sans-serif" text-anchor="middle">${family}</text>
      </g>
      <text x="${width * 0.08}" y="${height - 54}" fill="#f8f4e9" opacity="0.72" font-size="${variant === "hero" ? 26 : 18}" font-family="Arial, sans-serif">ScentSoul Brand Library</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function productImage(item) {
  return (PRODUCT_IMAGES[item.id] || fallbackBottleImage(item)).replace(/^http:/, "https:");
}

function renderMediaFallbacks() {
  document.querySelectorAll("img[data-fallback]").forEach((img) => {
    img.onerror = () => {
      img.onerror = null;
      img.src = img.dataset.fallback;
    };
  });
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
  const namePool = names[id] || [
    `${perfume.notes[0]}灵`,
    `${perfume.brandCn || ""}${perfume.nameCn || perfume.name}小像`,
    `${perfume.notes[1] || "香气"}回声`,
    `${perfume.family.slice(0, 2)}信使`
  ];
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
      name: pick(namePool, seed + "name"),
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
      title: `${perfume.name} 的 ${pick(namePool, seed + "name2")}`,
      subtitle: `这不是赠品，是编号 ${payload.bottleId} 的香气数字灵魂。`,
      hashtags: ["#ScentSoul", "#香水数字IP", `#${perfume.name.replace(/\s+/g, "")}`]
    },
    ops: {
      segment: pick(["清透探索型用户", "情绪收藏型用户", "社交分享型用户", "夜间仪式型用户"], seed + "segment"),
      campaign: pick(["新品限量编号活动", "晒出我的香气灵魂", "7日唤醒隐藏卡面", "天气联动香气变奏"], seed + "campaign"),
      conversionGoal: "提升扫码激活率、收藏卡分享率和二次唤醒率。",
      nextAction: `向偏好“${payload.mood}”的用户推荐同系列香水、小样或节日礼盒。`,
      metrics: {
        activationRate: `${Math.round(hashNumber(seed + "activation", 42, 76))}%`,
        shareRate: `${Math.round(hashNumber(seed + "shareRate", 18, 46))}%`,
        recallRate: `${Math.round(hashNumber(seed + "recall", 9, 32))}%`,
        repurchaseIntent: `${Math.round(hashNumber(seed + "repurchase", 6, 22))}%`
      }
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
    },
    ops: {
      segment: profile.ops?.segment || "清透探索型用户",
      campaign: profile.ops?.campaign || "晒出我的香气灵魂",
      conversionGoal: profile.ops?.conversionGoal || "提升扫码激活率、收藏卡分享率和二次唤醒率。",
      nextAction: profile.ops?.nextAction || `向偏好“${state.mood}”的用户推荐同系列香水、小样或节日礼盒。`,
      metrics: {
        activationRate: profile.ops?.metrics?.activationRate || "58%",
        shareRate: profile.ops?.metrics?.shareRate || "31%",
        recallRate: profile.ops?.metrics?.recallRate || "17%",
        repurchaseIntent: profile.ops?.metrics?.repurchaseIntent || "12%"
      }
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
  const catalogItem = getCatalogItem(p.perfume.id) || getCatalogItem($("perfumeId").value);
  state.profile = p;
  applyTheme(p);
  seedParticles();

  $("ipName").textContent = p.ip.name;
  $("ipLine").textContent = p.ip.catchphrase || p.ip.personality;
  $("sourcePill").textContent = "智能生成";
  $("perfumeName").textContent = p.perfume.name;
  $("editionName").textContent = p.bottle.edition;
  $("rarity").textContent = p.bottle.rarity;
  $("cardRarity").textContent = p.bottle.rarity;
  $("bpm").textContent = p.music.bpm;
  $("openingStory").textContent = p.story.opening;
  $("ritualStory").textContent = p.story.ritual;
  $("familyName").textContent = p.perfume.family;
  $("notes").innerHTML = p.perfume.notes.map((note) => `<span>${note}</span>`).join("");
  if (catalogItem?.link) {
    $("officialLink").href = catalogItem.link;
    $("officialLink").textContent = `查看 ${catalogItem.brandCn} 官方页面`;
    $("officialLink").hidden = false;
  } else {
    $("officialLink").hidden = true;
  }
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
  $("shareRate").textContent = p.ops.metrics.shareRate;
  $("unlockRate").textContent = p.ops.metrics.recallRate;
  $("favMood").textContent = p.music.mood || state.mood;
  $("feedbackScanMirror").textContent = $("scanCount").textContent;
  $("feedbackShareMirror").textContent = p.ops.metrics.shareRate;
  $("feedbackUnlockMirror").textContent = p.ops.metrics.recallRate;
  $("opsSegment").textContent = p.ops.segment;
  $("opsCampaign").textContent = p.ops.campaign;
  $("opsGoal").textContent = p.ops.conversionGoal;
  $("opsNextAction").textContent = p.ops.nextAction;

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
  track("generate_start", {
    perfumeId: payload.perfumeId,
    mood: payload.mood,
    bottleId: payload.bottleId
  });

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
    track("generate_success", {
      perfumeId: payload.perfumeId,
      mood: payload.mood,
      source: data.profile.source,
      fallback: Boolean(data.warning)
    });
  } catch (error) {
    renderProfile(localProfile(payload), "未连接后端，已使用浏览器本地生成。");
    track("generate_fallback", {
      perfumeId: payload.perfumeId,
      mood: payload.mood,
      reason: error.message
    });
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
    () => {
      track("copy_card", { perfumeId: p.perfume.id, bottleId: p.bottle.id, ipName: p.ip.name });
      showToast("收藏卡已复制");
    },
    () => showToast("浏览器不允许复制，可以手动选中文案")
  );
}

function copyOpsPlan() {
  const p = state.profile || localProfile(currentPayload());
  const text = [
    `ScentSoul 产品运营方案`,
    `香水：${p.perfume.name}`,
    `目标用户：${p.ops.segment}`,
    `活动主题：${p.ops.campaign}`,
    `运营目标：${p.ops.conversionGoal}`,
    `下一步动作：${p.ops.nextAction}`,
    `核心指标：激活率 ${p.ops.metrics.activationRate} / 分享率 ${p.ops.metrics.shareRate} / 二次唤醒 ${p.ops.metrics.recallRate} / 复购意向 ${p.ops.metrics.repurchaseIntent}`,
    `产品闭环：购买 - 扫码激活 - 数字 IP 体验 - 收藏卡分享 - 二次唤醒 - 复购推荐`
  ].join("\n");
  navigator.clipboard?.writeText(text).then(
    () => {
      track("copy_ops", { perfumeId: p.perfume.id, segment: p.ops.segment });
      showToast("运营方案已复制");
    },
    () => showToast("浏览器不允许复制，可以手动选中文案")
  );
}

function savePng() {
  const link = document.createElement("a");
  link.download = `${state.profile?.ip?.name || "scent-soul"}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  track("save_png", {
    perfumeId: state.profile?.perfume?.id || $("perfumeId").value,
    ipName: state.profile?.ip?.name || ""
  });
  showToast("动态画面已保存为 PNG");
}

function submitFeedback(event) {
  event.preventDefault();
  const payload = currentPayload();
  const score = $("feedbackScore").value;
  const role = $("feedbackRole").value;
  const shareIntent = $("feedbackShareIntent").value;
  const purchaseIntent = $("feedbackPurchaseIntent").value;
  const useCase = $("feedbackUseCase").value;
  const feedback = $("feedbackText").value.trim();
  track("feedback_submit", {
    perfumeId: payload.perfumeId,
    mood: payload.mood,
    role,
    score,
    reason: state.feedbackReason,
    shareIntent,
    purchaseIntent,
    useCase,
    feedback
  });
  $("feedbackText").value = "";
  showToast("反馈已记录，可以用于小样本调研");
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2300);
}

function optionLabel(item) {
  return `${item.brandCn} ${item.nameCn}｜${item.family}`;
}

function populatePerfumeCatalog() {
  const grouped = PERFUME_CATALOG.reduce((acc, item) => {
    const key = item.brand;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
  $("perfumeId").innerHTML = Object.entries(grouped)
    .map(([brand, items]) => `
      <optgroup label="${items[0].brandCn} / ${brand}">
        ${items.map((item) => `<option value="${item.id}">${optionLabel(item)}</option>`).join("")}
      </optgroup>
    `)
    .join("");
  $("perfumeId").value = "hermes-nile";

  $("brandFilter").innerHTML = [
    `<option value="all">全部品牌（${PERFUME_BRANDS.length}）</option>`,
    ...PERFUME_BRANDS.map((brand) => {
      const count = PERFUME_CATALOG.filter((item) => item.brand === brand).length;
      const label = PERFUME_CATALOG.find((item) => item.brand === brand)?.brandCn || brand;
      return `<option value="${brand}">${label} / ${brand}（${count}）</option>`;
    })
  ].join("");
  $("catalogCount").textContent = `${PERFUME_BRANDS.length} 品牌 / ${PERFUME_CATALOG.length} 款`;
  renderBrandShelf();
}

function renderBrandShelf() {
  const brand = $("brandFilter").value || "all";
  const baseItems = brand === "all" ? PERFUME_CATALOG : PERFUME_CATALOG.filter((item) => item.brand === brand);
  const items = [...baseItems].sort((a, b) => {
    const realA = PRODUCT_IMAGES[a.id] ? 1 : 0;
    const realB = PRODUCT_IMAGES[b.id] ? 1 : 0;
    return realB - realA || a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name);
  });
  const activeId = $("perfumeId").value;
  $("brandShelf").innerHTML = items.map((item) => `
    <article class="brand-item ${item.id === activeId ? "active" : ""}">
      <img class="product-image" src="${productImage(item)}" data-fallback="${fallbackBottleImage(item)}" alt="${item.brandCn} ${item.nameCn}" loading="lazy" />
      <div class="brand-item-copy">
        <button class="brand-select" type="button" data-id="${item.id}">
          <b>${item.brandCn} ${item.nameCn}</b>
          <span>${item.name} · ${item.family}</span>
          <small>${item.tags.slice(0, 4).join(" / ")}</small>
        </button>
        <div class="brand-actions">
          <button class="mini-button brand-generate" type="button" data-id="${item.id}">生成 IP</button>
          <a class="mini-link brand-link" href="${item.link}" target="_blank" rel="noreferrer" data-link-id="${item.id}">官网</a>
        </div>
      </div>
    </article>
  `).join("");
  renderMediaFallbacks();
}

function selectPerfume(perfumeId, source = "catalog") {
  $("perfumeId").value = perfumeId;
  renderProfile(localProfile(currentPayload()));
  renderBrandShelf();
  const item = getCatalogItem(perfumeId);
  track("perfume_select", { perfumeId, brand: item.brand, source });
}

function recommendPerfumes() {
  const need = $("advisorNeed").value.trim();
  const occasion = $("advisorOccasion").value;
  const query = `${need} ${occasion}`.toLowerCase();
  const scored = PERFUME_CATALOG.map((item) => {
    const haystack = [
      item.brand,
      item.brandCn,
      item.name,
      item.nameCn,
      item.family,
      item.description,
      item.gender,
      item.intensity,
      ...item.notes,
      ...item.tags,
      ...item.occasions
    ].join(" ").toLowerCase();
    let score = item.occasions.includes(occasion) ? 18 : 0;
    for (const word of query.split(/\s+/).filter(Boolean)) {
      if (haystack.includes(word)) score += 6;
    }
    if (/干净|清爽|清新|通勤|不甜/.test(need) && item.tags.some((tag) => ["干净", "清爽", "清新", "皂感", "通勤", "亲肤"].includes(tag))) score += 14;
    if (/甜|约会|性感|女/.test(need) && item.tags.some((tag) => ["甜", "约会", "性感", "女性"].includes(tag))) score += 12;
    if (/木|檀|沉稳|男|商务/.test(need) && item.tags.some((tag) => ["木质", "商务", "男香", "成熟"].includes(tag))) score += 12;
    if (/茶|绿|草|夏|水/.test(need) && item.tags.some((tag) => ["茶香", "绿意", "草本", "水感", "夏天", "春夏"].includes(tag))) score += 12;
    return { item, score };
  }).sort((a, b) => b.score - a.score || a.item.brand.localeCompare(b.item.brand));

  const results = scored.slice(0, 5).map(({ item }) => item);
  $("advisorResults").innerHTML = results.map((item) => `
    <article class="advisor-result">
      <img class="advisor-image" src="${productImage(item)}" data-fallback="${fallbackBottleImage(item)}" alt="${item.brandCn} ${item.nameCn}" loading="lazy" />
      <div>
        <b>${item.brandCn} ${item.nameCn}</b>
        <p>${item.description}</p>
        <div class="advisor-actions">
          <button class="mini-button" type="button" data-id="${item.id}">用这款生成 IP</button>
          <a class="mini-link" href="${item.link}" target="_blank" rel="noreferrer">官方链接</a>
        </div>
      </div>
    </article>
  `).join("");
  renderMediaFallbacks();
  track("advisor_recommend", { need, occasion, resultIds: results.map((item) => item.id) });
}

function renderCarousel() {
  const items = FEATURED_IDS.map((id) => getCatalogItem(id)).filter(Boolean);
  if (!items.length) return;
  state.carouselIndex = (state.carouselIndex + items.length) % items.length;
  const item = items[state.carouselIndex];
  $("brandCarousel").innerHTML = `
    <article class="carousel-card">
      <div class="carousel-image-wrap">
        <img class="carousel-image" src="${productImage(item)}" data-fallback="${fallbackBottleImage(item, "hero")}" alt="${item.brandCn} ${item.nameCn}" />
      </div>
      <div class="carousel-copy">
        <p class="eyebrow">${item.brand} / ${item.intensity} / ${item.gender}</p>
        <h3>${item.brandCn} ${item.nameCn}</h3>
        <p>${item.description}</p>
        <div class="carousel-tags">
          ${item.tags.slice(0, 5).map((tag) => `<span>${tag}</span>`).join("")}
        </div>
        <div class="carousel-actions">
          <button class="primary-button brand-generate" type="button" data-id="${item.id}">
            <span>用这款生成数字 IP</span>
            <small>${item.family}</small>
          </button>
          <a class="secondary-button carousel-official" href="${item.link}" target="_blank" rel="noreferrer" data-link-id="${item.id}">查看官网</a>
        </div>
      </div>
    </article>
  `;
  renderMediaFallbacks();
}

function moveCarousel(delta, shouldTrack = true) {
  state.carouselIndex += delta;
  renderCarousel();
  if (shouldTrack) track("carousel_move", { index: state.carouselIndex });
}

function switchView(view) {
  state.view = view;
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  ["advisor", "brands", "feedback"].forEach((name) => {
    $(`${name}View`).classList.toggle("active", view === name);
  });
  if (view === "brands") {
    renderCarousel();
    renderBrandShelf();
  }
  track("view_switch", { view });
}

async function syncModelStatus() {
  const status = $("modelStatus");
  try {
    const response = await fetch("/api/health");
    if (!response.ok) throw new Error(`health ${response.status}`);
    const health = await response.json();
    const connected = Boolean(health.llm);
    status.textContent = connected ? "在线智能推荐" : "智能推荐";
    status.classList.toggle("connected", connected);
    status.classList.toggle("local", !connected);
    $("sourcePill").title = connected
      ? `当前后端模型：${health.provider} / ${health.model}`
      : "当前没有检测到 API Key，使用本地生成逻辑。";
  } catch (error) {
    status.textContent = "本地模式";
    status.classList.add("local");
    $("sourcePill").title = "未检测到后端健康检查，使用浏览器本地生成逻辑。";
  }
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  $("scentForm").addEventListener("submit", (event) => {
    event.preventDefault();
    generateProfile();
  });

  $("randomBottle").addEventListener("click", () => {
    $("bottleId").value = randomBottle();
    $("bottlePreview").textContent = $("bottleId").value;
    track("random_bottle", { bottleId: $("bottleId").value });
  });

  $("bottleId").addEventListener("input", () => {
    $("bottlePreview").textContent = $("bottleId").value || "SS-000000";
  });

  $("perfumeId").addEventListener("change", () => {
    const item = getCatalogItem($("perfumeId").value);
    track("perfume_change", { perfumeId: $("perfumeId").value, brand: item.brand });
    renderProfile(localProfile(currentPayload()));
    renderBrandShelf();
  });

  $("brandFilter").addEventListener("change", () => {
    renderBrandShelf();
    track("brand_filter", { brand: $("brandFilter").value });
  });

  $("brandShelf").addEventListener("click", (event) => {
    const link = event.target.closest("a[data-link-id]");
    if (link) {
      const item = getCatalogItem(link.dataset.linkId);
      track("official_link_click", { perfumeId: link.dataset.linkId, brand: item.brand, source: "brand_shelf" });
      return;
    }
    const generateButton = event.target.closest(".brand-generate[data-id]");
    if (generateButton) {
      selectPerfume(generateButton.dataset.id, "brand_library_generate");
      switchView("advisor");
      generateProfile();
      return;
    }
    const button = event.target.closest(".brand-select[data-id]");
    if (!button) return;
    selectPerfume(button.dataset.id, "brand_shelf");
  });

  $("carouselPrev").addEventListener("click", () => moveCarousel(-1));
  $("carouselNext").addEventListener("click", () => moveCarousel(1));
  $("brandCarousel").addEventListener("click", (event) => {
    const link = event.target.closest("a[data-link-id]");
    if (link) {
      const item = getCatalogItem(link.dataset.linkId);
      track("official_link_click", { perfumeId: item.id, brand: item.brand, source: "brand_carousel" });
      return;
    }
    const button = event.target.closest(".brand-generate[data-id]");
    if (!button) return;
    selectPerfume(button.dataset.id, "brand_carousel_generate");
    switchView("advisor");
    generateProfile();
  });

  $("libraryToAdvisor").addEventListener("click", () => switchView("advisor"));

  $("advisorBtn").addEventListener("click", recommendPerfumes);

  $("promptChips").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-prompt]");
    if (!button) return;
    $("advisorNeed").value = button.dataset.prompt;
    track("prompt_chip_select", { prompt: button.dataset.prompt });
    recommendPerfumes();
  });

  $("advisorResults").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-id]");
    if (!button) return;
    selectPerfume(button.dataset.id, "advisor");
    generateProfile();
  });

  $("moodChips").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-mood]");
    if (!button) return;
    state.mood = button.dataset.mood;
    track("mood_change", { mood: state.mood });
    [...$("moodChips").querySelectorAll("button")].forEach((btn) => btn.classList.toggle("active", btn === button));
  });

  $("feedbackReasons").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-reason]");
    if (!button) return;
    state.feedbackReason = button.dataset.reason;
    [...$("feedbackReasons").querySelectorAll("button")].forEach((item) => item.classList.toggle("active", item === button));
    track("feedback_reason_select", { reason: state.feedbackReason, perfumeId: currentPayload().perfumeId });
  });

  $("musicToggle").addEventListener("click", () => {
    if (isPlaying) {
      stopMusic();
      track("music_stop", { perfumeId: currentPayload().perfumeId });
    } else {
      startMusic();
      track("music_start", { perfumeId: currentPayload().perfumeId });
    }
  });

  $("copyCard").addEventListener("click", copyCard);
  $("copyOps").addEventListener("click", copyOpsPlan);
  $("savePng").addEventListener("click", savePng);
  $("officialLink").addEventListener("click", () => {
    const item = getCatalogItem($("perfumeId").value);
    track("official_link_click", { perfumeId: item.id, brand: item.brand, source: "selected_perfume" });
  });
  $("feedbackForm").addEventListener("submit", submitFeedback);
  window.addEventListener("resize", resizeCanvas);
}

function init() {
  populatePerfumeCatalog();
  renderCarousel();
  bindEvents();
  syncModelStatus();
  track("page_view", { app: "ScentSoul", perfumeId: $("perfumeId").value });
  $("bottlePreview").textContent = $("bottleId").value;
  resizeCanvas();
  renderProfile(localProfile(currentPayload()));
  setInterval(() => {
    if (state.view === "brands") moveCarousel(1, false);
  }, 5200);
  requestAnimationFrame(drawScene);
}

init();
