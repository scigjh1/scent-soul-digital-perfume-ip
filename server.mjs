import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const appDir = join(__dirname, "app");
const port = Number(process.env.PORT || 4177);
const provider = (process.env.LLM_PROVIDER || process.env.MODEL_PROVIDER || "").toLowerCase();

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

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
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
  return pick(first[key], seed + "a") + pick(last, seed + "b");
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
  return normalizeProfile({
    edition: pick(["晨雾版", "河光版", "温室版", "雨声版", "夜航版"], seed),
    rarity: pick(["Common", "Uncommon", "Rare", "Rare", "Secret"], seed + "rarity"),
    ip: {
      name: pick(ipNames[id], seed + "name"),
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
      title: `${perfume.name} 的 ${pick(ipNames[id], seed + "name2")}`,
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
        perfumes: Object.keys(PERFUMES)
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
