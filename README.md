# ScentSoul - 香水数字灵魂 IP 系统

> A generative digital perfume IP demo that turns each perfume bottle into a personalized animated soul with LLM-generated visuals, music, stories, and product-operation loops.

ScentSoul 是一个“香水 + 专属数字 IP + 动态视听体验”的产品 Demo。

用户购买香水后，扫描瓶身二维码/NFC，系统会根据香水香调、瓶身编号、用户昵称和情绪选择，生成一个专属电子 IP。这个 IP 会带有动态视觉、音乐参数、香气故事、收藏卡和分享话题。

## 这个项目解决什么

传统香水购买体验集中在试香、包装和品牌故事上。用户购买后，品牌很难继续和用户互动，也难以沉淀用户偏好、情绪标签和复购线索。

ScentSoul 把“购买后体验”产品化：

- 购买后扫码激活专属数字 IP。
- 同一款香水保持统一世界观，但每瓶都有差异化。
- 动画、音乐、故事和收藏卡由大模型生成。
- 品牌可以基于扫码、分享、二次唤醒做会员运营。

## 特色功能

- 香水选择：尼罗河花园、绯雾花庭、琥珀书房、雨后茶室。
- 大模型生成：IP 名字、人格、场景、视觉参数、音乐参数、故事、分享卡。
- 动态画面：Canvas 根据模型生成的 palette、motifs、motion 实时渲染。
- 香气音乐：Web Audio 根据 bpm、key、brightness、warmth、pulse 生成氛围音。
- 产品闭环：展示购买、激活、体验、分享、复购的完整路径。
- 运营策略：根据用户情绪和香型生成用户分层、活动主题、转化目标和下一步动作。
- 本地兜底：没有 API Key 也能演示，系统会使用本地生成器。
- 运营看板：展示扫码激活、分享率、二次唤醒、偏好情绪等运营指标。

## 产品与运营闭环

```text
产品功能：买香水 -> 扫码激活 -> 生成数字 IP -> 动态视听体验 -> 收藏卡分享
运营动作：新品活动 -> 用户分层 -> 话题传播 -> 二次唤醒 -> 复购推荐
```

这个项目的重点不是做一个好看的扫码页面，而是把香水购买后的情绪价值变成可互动、可分享、可留存、可复购的产品运营闭环。

## 如何运行

### 1. 无 API Key 演示

```powershell
npm start
```

打开：

```text
http://localhost:4177
```

这种模式会使用本地生成器，适合快速演示。

### 2. 接入国内大模型

PowerShell：

```powershell
$env:LLM_PROVIDER="deepseek"
$env:DEEPSEEK_API_KEY="你的 DeepSeek API Key"
$env:LLM_MODEL="deepseek-chat"
npm start
```

然后打开：

```text
http://localhost:4177
```

也支持通义千问、Kimi、智谱和自定义 OpenAI-compatible 服务：

```powershell
# 通义千问
$env:LLM_PROVIDER="qwen"
$env:DASHSCOPE_API_KEY="你的 DashScope API Key"
$env:LLM_MODEL="qwen-plus"
npm start

# Kimi
$env:LLM_PROVIDER="kimi"
$env:MOONSHOT_API_KEY="你的 Moonshot API Key"
$env:LLM_MODEL="moonshot-v1-8k"
npm start
```

注意：不要把 API Key 写进前端代码。这个项目通过 `server.mjs` 调用大模型，前端只请求 `/api/generate`。没有 Key 或模型调用失败时会自动切换本地生成器。

## 文件结构

```text
scent_soul_vibe_demo/
  .env.example
  .gitignore
  LICENSE
  app/
    index.html
    styles.css
    app.js
  docs/
    PRD.md
    功能清单与交付物.md
    指标体系与运营增长.md
    迭代路线图.md
    产品方案.md
    大模型生成链路.md
    运营玩法.md
    产品与产品运营结合打法.md
    GitHub上传指南.md
  resume/
    简历项目段.md
  server.mjs
  package.json
```

## GitHub 上传

当前电脑如果没有安装 Git，可以看：

```text
docs/GitHub上传指南.md
```

## 简历定位

这个项目适合写成：

> ScentSoul - 香水数字 IP 与用户运营系统 ｜ 独立产品设计 & Vibe Coding ｜ 作品集项目

它能同时体现：

- 产品经理：用户场景、需求拆解、MVP、交互流程、技术方案。
- 产品运营：购买后留存、扫码激活、分享传播、会员运营、复购活动。
- AIGC 能力：大模型生成、参数化视听内容、个性化数字 IP。

## GitHub 地址

```text
https://github.com/scigjh1/scent-soul-digital-perfume-ip
```
