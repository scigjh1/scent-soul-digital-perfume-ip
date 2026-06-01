import { createServer } from "node:http";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { PERFUME_CATALOG, buildPerfumeMap } from "./app/catalog.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const appDir = join(__dirname, "app");
const dataDir = join(__dirname, "data");
const eventsFile = join(dataDir, "events.jsonl");
const port = Number(process.env.PORT || 4177);
const provider = (process.env.LLM_PROVIDER || process.env.MODEL_PROVIDER || "").toLowerCase();
const adminToken = process.env.ADMIN_TOKEN || "";

const PROVIDERS = {
  deepseek: {
    baseURL: "https://api.deepseek.com",
    model: "deepseek-chat",
    apiKey: process.env.DEEPSEEK_API_KEY
  },
  qwen: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
    apiKey: process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY
  },
  dashscope: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
    apiKey: process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY
  },
  kimi: {
    baseURL: "https://api.moonshot.cn/v1",
    model: "moonshot-v1-8k",
    apiKey: process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY
  },
  moonshot: {
    baseURL: "https://api.moonshot.cn/v1",
    model: "moonshot-v1-8k",
    apiKey: process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY
  },
  zhipu: {
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
    model: "glm-4-flash",
    apiKey: process.env.ZHIPU_API_KEY
  },
  openai: {
    baseURL: "https://api.openai.com/v1",
    model: "gpt-4.1-mini",
    apiKey: process.env.OPENAI_API_KEY
  }
};

function inferProvider() {
  if (provider) return provider;
  if (process.env.LLM_API_KEY && process.env.LLM_BASE_URL) return "custom";
  if (process.env.DEEPSEEK_API_KEY) return "deepseek";
  if (process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY) return "qwen";
  if (process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY) return "kimi";
  if (process.env.ZHIPU_API_KEY) return "zhipu";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "local";
}

const activeProvider = inferProvider();
const providerDefaults = PROVIDERS[activeProvider] || PROVIDERS.deepseek;
const llmBaseURL = (process.env.LLM_BASE_URL || providerDefaults.baseURL).replace(/\/+$/, "");
const llmApiKey = process.env.LLM_API_KEY || providerDefaults.apiKey || "";
const model = process.env.LLM_MODEL || process.env.OPENAI_MODEL || providerDefaults.model;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

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

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function text(res, status, content, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    ...headers
  });
  res.end(content);
}

function isAdminRequest(req) {
  if (!adminToken) return true;
  const url = new URL(req.url, `http://localhost:${port}`);
  return req.headers["x-admin-token"] === adminToken || url.searchParams.get("token") === adminToken;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function hashNumber(value, min, max) {
  const h = crypto.createHash("sha256").update(String(value)).digest();
  const n = h.readUInt32BE(0) / 0xffffffff;
  return min + n * (max - min);
}

function pick(list, seed) {
  const idx = Math.floor(hashNumber(seed, 0, list.length - 0.0001));
  return list[idx];
}

function safeString(value, max = 240) {
  return String(value ?? "").slice(0, max);
}

async function trackEvent(req) {
  const payload = await readBody(req);
  const record = {
    receivedAt: new Date().toISOString(),
    event: safeString(payload.event || "unknown", 80),
    sessionId: safeString(payload.sessionId || "anonymous", 120),
    path: safeString(payload.path || "", 240),
    userAgent: safeString(req.headers["user-agent"] || "", 320),
    detail: payload.detail && typeof payload.detail === "object" ? payload.detail : { value: payload.detail ?? null }
  };
  await mkdir(dataDir, { recursive: true });
  await appendFile(eventsFile, `${JSON.stringify(record)}\n`, "utf8");
  return record;
}

async function readEvents() {
  if (!existsSync(eventsFile)) return [];
  const content = await readFile(eventsFile, "utf8");
  return content
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function summarizeEvents(events) {
  const byEvent = {};
  const sessions = new Set();
  for (const event of events) {
    byEvent[event.event] = (byEvent[event.event] || 0) + 1;
    if (event.sessionId) sessions.add(event.sessionId);
  }
  const count = (name) => byEvent[name] || 0;
  const rate = (part, base) => (base ? `${Math.round((part / base) * 1000) / 10}%` : "0%");
  const funnel = [
    { key: "page_view", label: "访问页面", count: count("page_view") },
    { key: "generate_start", label: "点击生成", count: count("generate_start") },
    { key: "generate_success", label: "生成成功", count: count("generate_success") },
    { key: "copy_card", label: "复制收藏卡", count: count("copy_card") },
    { key: "feedback_submit", label: "提交反馈", count: count("feedback_submit") }
  ].map((step, index, list) => ({
    ...step,
    rateFromVisit: rate(step.count, list[0]?.count || 0),
    rateFromPrevious: index === 0 ? "100%" : rate(step.count, list[index - 1].count)
  }));
  const feedbackEvents = events.filter((event) => event.event === "feedback_submit");
  const distribution = (field) => feedbackEvents.reduce((acc, event) => {
    const value = event.detail?.[field] || "unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
  const scores = feedbackEvents.map((event) => Number(event.detail?.score)).filter((score) => Number.isFinite(score));
  const yesRate = (field) => rate(feedbackEvents.filter((event) => event.detail?.[field] === "yes").length, feedbackEvents.length);
  const feedbackSummary = {
    count: feedbackEvents.length,
    averageScore: scores.length ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10 : 0,
    shareIntentRate: yesRate("shareIntent"),
    purchaseIntentRate: yesRate("purchaseIntent"),
    role: distribution("role"),
    reason: distribution("reason"),
    useCase: distribution("useCase"),
    perfume: distribution("perfumeId")
  };
  return {
    totalEvents: events.length,
    uniqueSessions: sessions.size,
    byEvent,
    funnel,
    feedbackSummary,
    recentFeedback: feedbackEvents.slice(-12).reverse().map((event) => ({
      receivedAt: event.receivedAt,
      sessionId: event.sessionId,
      detail: event.detail
    })),
    lastEventAt: events.at(-1)?.receivedAt || null
  };
}

function csvEscape(value) {
  const textValue = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return `"${textValue.replace(/"/g, '""')}"`;
}

function eventsToCsv(events) {
  const fields = ["receivedAt", "event", "sessionId", "path", "userAgent", "detail"];
  const rows = events.map((event) => fields.map((field) => csvEscape(event[field])).join(","));
  return `${fields.join(",")}\n${rows.join("\n")}`;
}

function localProductReview(metrics) {
  const feedback = metrics.feedbackSummary || {};
  const byEvent = metrics.byEvent || {};
  const pageViews = byEvent.page_view || 0;
  const generateStarts = byEvent.generate_start || 0;
  const generateSuccess = byEvent.generate_success || 0;
  const copyCards = byEvent.copy_card || 0;
  const feedbackCount = feedback.count || 0;
  const topReason = Object.entries(feedback.reason || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || "visual";
  const actionByReason = {
    visual: "把首屏动态画面做成更强的香调差异：尼罗河突出水流和柑橘，琥珀突出纸张、木纹和暖光。",
    music: "把播放按钮前置到主舞台，并增加 3 秒自动预览，让用户不用理解功能也能听到香气音乐。",
    story: "把开场故事压缩成一句更强的社交标题，再展开第二段故事，减少阅读负担。",
    card: "把收藏卡做成可截图的独立卡片，并增加小红书/朋友圈两种文案模板。",
    none: "首屏价值表达还不够直接，应先强化“买一瓶香水获得专属电子 IP”的一句话解释。"
  };
  const lowData = pageViews < 10 || feedbackCount < 5;

  return {
    source: "local-review",
    generatedAt: new Date().toISOString(),
    score: lowData ? 72 : Math.min(92, 72 + feedback.averageScore * 4 + Math.min(copyCards, 8)),
    summary: lowData
      ? "当前产品形态已经能表达香水数字 IP 的概念，但样本量不足，下一步应先扩大朋友体验样本，再判断最强转化点。"
      : "当前产品的核心吸引点集中在动态体验和收藏传播，下一步应减少理解成本，并把分享与购买兴趣承接得更自然。",
    priorities: [
      {
        title: "降低首屏理解成本",
        why: generateStarts < pageViews * 0.5 ? "访问后点击生成的人偏少，说明用户可能还没快速理解要做什么。" : "生成点击表现尚可，但首屏仍需要更强的一句话价值锚点。",
        action: "把主按钮上方改成一句强提示：扫码后生成只属于这瓶香水的动画、音乐和收藏卡。",
        metric: "观察 generate_start / page_view 是否提升。"
      },
      {
        title: "强化最打动点",
        why: `当前反馈里最明显的打动点是 ${topReason}。`,
        action: actionByReason[topReason] || actionByReason.visual,
        metric: "观察 feedback_submit 中 reason 的集中度和 averageScore。"
      },
      {
        title: "把分享变成自然下一步",
        why: copyCards < generateSuccess * 0.35 ? "生成后复制收藏卡的人还不够多，分享动作需要更明显的理由。" : "收藏卡已经能承接部分分享，应继续强化卡片价值。",
        action: "生成后在收藏卡模块增加一句“把这张卡发给朋友，让 TA 猜你的香气人格”。",
        metric: "观察 copy_card / generate_success 是否提升。"
      }
    ],
    experiments: [
      "A/B 测试主按钮文案：生成专属数字灵魂 vs 唤醒我的香水 IP。",
      "给尼罗河花园单独做水流/柑橘更强的默认动效，对比平均评分。",
      "把反馈入口从右侧底部移动到生成成功后的收藏卡下方，对比反馈提交率。"
    ],
    risks: [
      "样本太少时不要在简历里写真实提升百分比，只写已建立指标口径和小样本验证链路。",
      "如果接入真实模型，API Key 必须放在服务端环境变量，不要写进前端。",
      "朋友调研时避免收集手机号、微信等敏感信息，先只收体验偏好。"
    ]
  };
}

function buildReviewPrompt(metrics) {
  return `
你是一个严厉但建设性的产品经理面试官 + 增长产品顾问。
请评价一个名为 ScentSoul 的香水数字 IP 产品，并给出下一步怎么改。

产品定位：
- 用户购买香水后扫码，获得专属电子 IP。
- 每瓶香水生成不同的动画、音乐、故事和收藏卡。
- 目标是提升购买后互动、分享、二次唤醒和小样/礼盒兴趣。

当前数据：
${JSON.stringify(metrics, null, 2)}

只返回 JSON，不要 Markdown。字段如下：
{
  "score": 0-100,
  "summary": "80字以内总体评价",
  "priorities": [
    {
      "title": "优先级标题",
      "why": "为什么要改",
      "action": "具体怎么改",
      "metric": "用什么指标验证"
    }
  ],
  "experiments": ["3个可做的小实验"],
  "risks": ["2-3个风险提醒"]
}

要求：
1. 不要泛泛而谈，每条建议都要能落到页面、交互、文案、转化或运营动作上。
2. 如果数据少，要明确说先扩大样本，不要编造结论。
3. 语言直接，适合学生拿去改作品集和准备产品经理面试。
`;
}

function normalizeReview(raw, metrics, source) {
  const fallback = localProductReview(metrics);
  return {
    source,
    generatedAt: new Date().toISOString(),
    score: Math.max(0, Math.min(100, Number(raw.score) || fallback.score)),
    summary: safeString(raw.summary || fallback.summary, 220),
    priorities: Array.isArray(raw.priorities) && raw.priorities.length
      ? raw.priorities.slice(0, 5).map((item) => ({
        title: safeString(item.title, 80),
        why: safeString(item.why, 220),
        action: safeString(item.action, 260),
        metric: safeString(item.metric, 180)
      }))
      : fallback.priorities,
    experiments: Array.isArray(raw.experiments) && raw.experiments.length
      ? raw.experiments.slice(0, 5).map((item) => safeString(item, 220))
      : fallback.experiments,
    risks: Array.isArray(raw.risks) && raw.risks.length
      ? raw.risks.slice(0, 4).map((item) => safeString(item, 220))
      : fallback.risks
  };
}

async function llmProductReview(metrics) {
  if (!llmApiKey || activeProvider === "local") return localProductReview(metrics);

  try {
    const response = await fetch(`${llmBaseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${llmApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "你是资深产品经理和增长顾问，只返回合法 JSON，不返回 Markdown。"
          },
          {
            role: "user",
            content: buildReviewPrompt(metrics)
          }
        ],
        temperature: 0.35,
        max_tokens: 1600
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return localProductReview(metrics);
    return normalizeReview(parseLooseJson(extractText(data)), metrics, activeProvider);
  } catch {
    return localProductReview(metrics);
  }
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, Number(n) || min));
}

function normalizeProfile(raw, payload, source = "openai") {
  const perfume = PERFUMES[payload.perfumeId] || PERFUMES.nile;
  const seed = `${payload.perfumeId}-${payload.bottleId}-${payload.ownerName}-${payload.mood}-${Date.now()}`;
  const ip = raw.ip || {};
  const scene = raw.scene || {};
  const music = raw.music || {};
  const story = raw.story || {};
  const share = raw.share || {};
  const ops = raw.ops || {};
  const traits = Array.isArray(raw.traits) ? raw.traits : [];
  const colors = Array.isArray(scene.palette) && scene.palette.length >= 4 ? scene.palette : perfume.palette;

  return {
    source,
    generatedAt: new Date().toISOString(),
    perfume: {
      id: payload.perfumeId || "nile",
      name: perfume.name,
      family: perfume.family,
      notes: perfume.notes
    },
    bottle: {
      id: payload.bottleId || `SS-${Math.floor(hashNumber(seed, 100000, 999999))}`,
      ownerName: payload.ownerName || "匿名收藏者",
      edition: raw.edition || pick(["晨雾版", "河光版", "月下版", "信风版", "秘密编号版"], seed + "edition"),
      rarity: raw.rarity || pick(["Common", "Uncommon", "Rare", "Rare", "Secret"], seed + "rarity")
    },
    ip: {
      name: ip.name || fallbackName(perfume, seed),
      archetype: ip.archetype || pick(["引路者", "梦境采样师", "河岸守夜人", "花园记录员", "风的译者"], seed + "arch"),
      personality: ip.personality || "敏感、轻盈、会把气味变成可以收藏的瞬间。",
      catchphrase: ip.catchphrase || "我把今天的气味，替你保存起来。"
    },
    scene: {
      environment: scene.environment || `${perfume.name} 的气味世界`,
      palette: colors.slice(0, 5),
      motifs: Array.isArray(scene.motifs) && scene.motifs.length ? scene.motifs : perfume.motifs,
      weather: scene.weather || pick(["清晨微光", "雨后薄雾", "傍晚金色风", "玻璃温室"], seed + "weather"),
      motion: {
        flow: clamp(scene.motion?.flow ?? hashNumber(seed + "flow", 0.45, 1.15), 0.2, 1.8),
        bloom: clamp(scene.motion?.bloom ?? hashNumber(seed + "bloom", 0.2, 1.1), 0.1, 1.5),
        sparkle: clamp(scene.motion?.sparkle ?? hashNumber(seed + "sparkle", 0.15, 0.9), 0.05, 1.2),
        density: clamp(scene.motion?.density ?? hashNumber(seed + "density", 0.35, 0.9), 0.2, 1)
      }
    },
    music: {
      bpm: Math.round(clamp(music.bpm ?? perfume.tempo + hashNumber(seed, -8, 12), 50, 132)),
      key: music.key || pick(["C Lydian", "D Major", "E Minor", "G Major", "A Dorian"], seed + "key"),
      instruments: Array.isArray(music.instruments) && music.instruments.length ? music.instruments : ["soft bell", "water pad", "breath synth"],
      mood: music.mood || payload.mood || "清透",
      brightness: clamp(music.brightness ?? hashNumber(seed + "bright", 0.25, 0.9), 0, 1),
      warmth: clamp(music.warmth ?? hashNumber(seed + "warm", 0.2, 0.85), 0, 1),
      pulse: clamp(music.pulse ?? hashNumber(seed + "pulse", 0.25, 0.95), 0, 1)
    },
    traits: traits.length ? traits.slice(0, 6) : ["可收藏", "可分享", "同款差异化", "情绪陪伴", "品牌会员入口"],
    story: {
      opening: story.opening || `${payload.ownerName || "你"} 扫开瓶身编号时，${perfume.notes[0]} 像一道光先醒来。`,
      ritual: story.ritual || "它会在你每次靠近时记录当天的心情，并用新的光影回应。",
      unlockHint: story.unlockHint || "连续 7 天唤醒它，可以解锁第二段旋律和隐藏卡面。"
    },
    share: {
      title: share.title || `${perfume.name} #${payload.bottleId || "000"} 的数字灵魂`,
      subtitle: share.subtitle || "一瓶香水，一段只属于你的动态气味记忆。",
      hashtags: Array.isArray(share.hashtags) && share.hashtags.length ? share.hashtags.slice(0, 5) : ["#香水数字IP", "#ScentSoul", "#气味人格"]
    },
    ops: {
      segment: ops.segment || pick(["清透探索型用户", "情绪收藏型用户", "社交分享型用户", "夜间仪式型用户"], seed + "segment"),
      campaign: ops.campaign || pick(["新品限量编号活动", "晒出我的香气灵魂", "7日唤醒隐藏卡面", "天气联动香气变奏"], seed + "campaign"),
      conversionGoal: ops.conversionGoal || "提升扫码激活率、收藏卡分享率和二次唤醒率。",
      nextAction: ops.nextAction || `向偏好“${payload.mood || "清透"}”的用户推荐同系列香水或小样。`,
      metrics: {
        activationRate: ops.metrics?.activationRate || `${Math.round(hashNumber(seed + "activation", 42, 76))}%`,
        shareRate: ops.metrics?.shareRate || `${Math.round(hashNumber(seed + "shareRate", 18, 46))}%`,
        recallRate: ops.metrics?.recallRate || `${Math.round(hashNumber(seed + "recall", 9, 32))}%`,
        repurchaseIntent: ops.metrics?.repurchaseIntent || `${Math.round(hashNumber(seed + "repurchase", 6, 22))}%`
      }
    }
  };
}

function fallbackName(perfume, seed) {
  const first = {
    nile: ["河光", "青芒", "汀草", "水影", "橘风"],
    bloom: ["绯雾", "柔瓣", "月粉", "玫影", "梨光"],
    amber: ["琥珀", "木页", "烟棕", "旧书", "火纹"],
    raintea: ["雨茶", "竹雾", "青盏", "石露", "云叶"]
  };
  const last = ["小灵", "守望者", "采样师", "记录员", "回声"];
  const key = Object.keys(PERFUMES).find((id) => PERFUMES[id] === perfume) || "nile";
  const pool = first[key] || [
    perfume.notes?.[0] || "香气",
    perfume.notes?.[1] || "光影",
    perfume.brandCn || "瓶中",
    perfume.family?.slice(0, 2) || "气味"
  ];
  return pick(pool, seed + "a") + pick(last, seed + "b");
}

function localProfile(payload) {
  const perfume = PERFUMES[payload.perfumeId] || PERFUMES.nile;
  const seed = `${payload.perfumeId}-${payload.bottleId}-${payload.ownerName}-${payload.mood}`;
  const ipNames = {
    nile: ["河光青芒", "汀草回声", "柑橘水灵", "莲岸信使"],
    bloom: ["绯雾花仆", "玫瑰耳语", "粉庭织梦", "梨光小像"],
    amber: ["琥珀旧页", "雪松守夜", "烟草书灵", "皮革火种"],
    raintea: ["雨茶竹影", "湿石白花", "云叶茶侍", "青盏回声"]
  };
  const id = payload.perfumeId || "nile";
  const namePool = ipNames[id] || [
    `${perfume.notes[0]}灵`,
    `${perfume.brandCn || ""}${perfume.nameCn || perfume.name}小像`,
    `${perfume.notes[1] || "香气"}回声`,
    `${perfume.family.slice(0, 2)}信使`
  ];
  return normalizeProfile({
    edition: pick(["晨雾版", "河光版", "温室版", "雨声版", "夜航版"], seed),
    rarity: pick(["Common", "Uncommon", "Rare", "Rare", "Secret"], seed + "rarity"),
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
      environment: pick([
        `${perfume.name} 的私人温室`,
        `${perfume.notes[0]} 与 ${perfume.notes[1]} 漂浮的气味河岸`,
        `${perfume.family} 的可视化梦境`,
        `编号 ${payload.bottleId || "000"} 的香气小宇宙`
      ], seed + "env"),
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
      key: pick(["C Lydian", "D Major", "E Minor", "G Major", "A Dorian", "F Major"], seed + "key"),
      instruments: pick([
        ["water pad", "glass bell", "soft marimba"],
        ["breath synth", "pluck", "field recording"],
        ["warm pad", "low cello", "vinyl noise"],
        ["rain keys", "tea bowl", "air flute"]
      ], seed + "inst"),
      mood: payload.mood || "清透",
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
      opening: `${payload.ownerName || "你"} 唤醒编号 ${payload.bottleId || "SS-000000"} 时，${perfume.notes[0]} 先从瓶口升起，${perfume.notes[1]} 慢慢铺成它的影子。`,
      ritual: `它记住了你选择的“${payload.mood || "清透"}”，所以这次的动画会更偏向 ${pick(["水流", "花雾", "木纹", "雨线"], seed + "ritual")}，旋律也会留下一个很轻的回声。`,
      unlockHint: "分享收藏卡或连续唤醒 7 天，可以解锁第二段动画和隐藏音色。"
    },
    share: {
      title: `${perfume.name} 的 ${pick(namePool, seed + "name2")}`,
      subtitle: `这不是赠品，是编号 ${payload.bottleId || "SS-000000"} 的香气数字灵魂。`,
      hashtags: ["#ScentSoul", "#香水数字IP", `#${perfume.name.replace(/\s+/g, "")}`]
    },
    ops: {
      segment: pick(["清透探索型用户", "情绪收藏型用户", "社交分享型用户", "夜间仪式型用户"], seed + "segment"),
      campaign: pick(["新品限量编号活动", "晒出我的香气灵魂", "7日唤醒隐藏卡面", "天气联动香气变奏"], seed + "campaign"),
      conversionGoal: "提升扫码激活率、收藏卡分享率和二次唤醒率。",
      nextAction: `向偏好“${payload.mood || "清透"}”的用户推荐同系列香水、小样或节日礼盒。`,
      metrics: {
        activationRate: `${Math.round(hashNumber(seed + "activation", 42, 76))}%`,
        shareRate: `${Math.round(hashNumber(seed + "shareRate", 18, 46))}%`,
        recallRate: `${Math.round(hashNumber(seed + "recall", 9, 32))}%`,
        repurchaseIntent: `${Math.round(hashNumber(seed + "repurchase", 6, 22))}%`
      }
    }
  }, payload, "local");
}

function buildPrompt(payload) {
  const perfume = PERFUMES[payload.perfumeId] || PERFUMES.nile;
  return `
你是一个香水品牌的数字 IP 创意总监 + 产品经理。
请为用户生成一瓶香水的“专属数字香气灵魂”。同一款香水要保持世界观一致，但每个瓶身编号和用户情绪要生成不同细节。

输入：
${JSON.stringify({ ...payload, perfume }, null, 2)}

必须只返回 JSON，不要 Markdown，不要解释。字段如下：
{
  "edition": "版本名，4-8个中文",
  "rarity": "Common|Uncommon|Rare|Secret",
  "ip": {
    "name": "电子IP名字，2-6个中文",
    "archetype": "角色原型，4-8个中文",
    "personality": "人格描述，25-45个中文",
    "catchphrase": "一句可传播口号，12-24个中文"
  },
  "scene": {
    "environment": "动画场景，一句话",
    "palette": ["#HEX", "#HEX", "#HEX", "#HEX"],
    "motifs": ["3-5个视觉元素，如 river/grass/citrus/petal/rain/wood/ember"],
    "weather": "氛围天气，4-8个中文",
    "motion": {
      "flow": 0.2,
      "bloom": 0.2,
      "sparkle": 0.2,
      "density": 0.2
    }
  },
  "music": {
    "bpm": 80,
    "key": "C Lydian",
    "instruments": ["3个音色英文"],
    "mood": "音乐情绪，2-6个中文",
    "brightness": 0.5,
    "warmth": 0.5,
    "pulse": 0.5
  },
  "traits": ["3-6个标签"],
  "story": {
    "opening": "用户扫码后的开场故事，35-60个中文",
    "ritual": "再次唤醒/持续互动机制，25-50个中文",
    "unlockHint": "解锁提示，20-40个中文"
  },
  "share": {
    "title": "分享卡标题",
    "subtitle": "分享卡副标题",
    "hashtags": ["3-5个话题"]
  },
  "ops": {
    "segment": "用户分层名称，6-12个中文",
    "campaign": "运营活动名称，8-16个中文",
    "conversionGoal": "本次运营目标，20-40个中文",
    "nextAction": "下一步运营动作，20-45个中文",
    "metrics": {
      "activationRate": "如 58%",
      "shareRate": "如 31%",
      "recallRate": "如 17%",
      "repurchaseIntent": "如 12%"
    }
  }
}

多样化要求：
1. 同一款香水保持主香调一致，但通过瓶身编号、用户昵称、情绪选择生成个体差异。
2. 不要所有结果都梦幻/高级/治愈，允许清冷、明亮、潮湿、辛辣、安静、顽皮等差异。
3. palette 必须给真实 hex 色值。
4. motion 和 music 的数值范围都是 0-1，bpm 50-132。
`;
}

function extractText(data) {
  if (Array.isArray(data.choices)) {
    return data.choices
      .map((choice) => choice.message?.content || choice.text || "")
      .filter(Boolean)
      .join("\n");
  }
  if (typeof data.output_text === "string") return data.output_text;
  if (Array.isArray(data.output)) {
    return data.output.flatMap((item) => {
      if (typeof item.content === "string") return [item.content];
      if (Array.isArray(item.content)) {
        return item.content.map((c) => c.text || c.value || c.content || "").filter(Boolean);
      }
      return [];
    }).join("\n");
  }
  return "";
}

function parseLooseJson(text) {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Model did not return valid JSON");
  }
}

async function llmProfile(payload) {
  if (!llmApiKey || activeProvider === "local") {
    return { profile: localProfile(payload), warning: "未设置国内模型 API Key，已使用本地生成器。" };
  }

  try {
    const response = await fetch(`${llmBaseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${llmApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "你是严谨的产品创意生成器，只返回合法 JSON，不返回 Markdown。"
          },
          {
            role: "user",
            content: buildPrompt(payload)
          }
        ],
        temperature: 0.85,
        max_tokens: 1800
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        profile: localProfile(payload),
        warning: `${activeProvider} 调用失败，已切换本地生成器：${data.error?.message || response.status}`
      };
    }

    const raw = parseLooseJson(extractText(data));
    return { profile: normalizeProfile(raw, payload, activeProvider) };
  } catch (error) {
    return {
      profile: localProfile(payload),
      warning: `${activeProvider} 调用失败，已切换本地生成器：${error.message}`
    };
  }
}

async function handleStatic(req, res) {
  const url = new URL(req.url, `http://localhost:${port}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const filePath = normalize(join(appDir, pathname));
  if (!filePath.startsWith(appDir) || !existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }
  const content = await readFile(filePath);
  res.writeHead(200, {
    "Content-Type": MIME[extname(filePath)] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  res.end(content);
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/track") {
      const event = await trackEvent(req);
      json(res, 200, { ok: true, event: event.event });
      return;
    }
    if (req.method === "GET" && req.url.startsWith("/api/metrics")) {
      if (!isAdminRequest(req)) {
        json(res, 401, { ok: false, error: "Unauthorized" });
        return;
      }
      const events = await readEvents();
      json(res, 200, { ok: true, ...summarizeEvents(events) });
      return;
    }
    if (req.method === "GET" && req.url.startsWith("/api/review")) {
      if (!isAdminRequest(req)) {
        json(res, 401, { ok: false, error: "Unauthorized" });
        return;
      }
      const events = await readEvents();
      const metrics = summarizeEvents(events);
      json(res, 200, { ok: true, review: await llmProductReview(metrics) });
      return;
    }
    if (req.method === "GET" && req.url.startsWith("/api/export/events.csv")) {
      if (!isAdminRequest(req)) {
        json(res, 401, { ok: false, error: "Unauthorized" });
        return;
      }
      const csv = eventsToCsv(await readEvents());
      text(res, 200, csv, {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=scent-soul-events.csv"
      });
      return;
    }
    if (req.method === "GET" && req.url.startsWith("/api/export/events.jsonl")) {
      if (!isAdminRequest(req)) {
        json(res, 401, { ok: false, error: "Unauthorized" });
        return;
      }
      const content = existsSync(eventsFile) ? await readFile(eventsFile, "utf8") : "";
      text(res, 200, content, {
        "Content-Disposition": "attachment; filename=scent-soul-events.jsonl"
      });
      return;
    }
    if (req.method === "POST" && req.url === "/api/generate") {
      const payload = await readBody(req);
      const result = await llmProfile(payload);
      json(res, 200, result);
      return;
    }
    if (req.method === "GET" && req.url === "/api/health") {
      json(res, 200, {
        ok: true,
        provider: activeProvider,
        model,
        llm: Boolean(llmApiKey),
        localFallback: true,
        dataCollection: true,
        adminProtected: Boolean(adminToken),
        perfumes: Object.keys(PERFUMES),
        catalog: {
          brands: new Set(PERFUME_CATALOG.map((item) => item.brand)).size,
          perfumes: PERFUME_CATALOG.length
        }
      });
      return;
    }
    await handleStatic(req, res);
  } catch (error) {
    json(res, 500, { error: error.message, profile: null });
  }
});

server.listen(port, () => {
  console.log(`ScentSoul running at http://localhost:${port}`);
  console.log(llmApiKey ? `LLM provider: ${activeProvider}; model: ${model}` : "LLM_API_KEY not set; local generator fallback enabled.");
});
