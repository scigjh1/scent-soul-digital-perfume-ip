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

- 香水选择：内置 49 个香水品牌、70 款代表香水，覆盖 Hermes、Byredo、Diptyque、Chanel、Dior、YSL、Frederic Malle、Tom Ford、MFK、Creed、Le Labo 等。
- 香水顾问：用户输入想要的气味风格、场景和偏好后，系统推荐对应香水并可一键生成数字 IP。
- 大模型生成：IP 名字、人格、场景、视觉参数、音乐参数、故事、分享卡。
- 动态画面：Canvas 根据模型生成的 palette、motifs、motion 实时渲染。
- 香气音乐：Web Audio 根据 bpm、key、brightness、warmth、pulse 生成氛围音。
- 产品闭环：展示购买、激活、体验、分享、复购的完整路径。
- 运营策略：根据用户情绪和香型生成用户分层、活动主题、转化目标和下一步动作。
- 本地兜底：没有 API Key 也能演示，系统会使用本地生成器。
- 运营看板：展示扫码激活、分享率、二次唤醒、偏好情绪等运营指标。
- 数据采集：记录访问、生成、复制、保存和反馈提交，可导出 CSV 做小样本验证。
- 产品数据后台：`/dashboard.html` 可查看转化漏斗、反馈分布、购买兴趣和最近反馈。
- 模型产品评审：数据后台可一键生成改版优先级、实验方案和风险提醒。

## 产品与运营闭环

```text
产品功能：买香水 -> 扫码激活 -> 生成数字 IP -> 动态视听体验 -> 收藏卡分享
运营动作：新品活动 -> 用户分层 -> 话题传播 -> 二次唤醒 -> 复购推荐
```

这个项目的重点不是做一个好看的扫码页面，而是把香水购买后的情绪价值变成可互动、可分享、可留存、可复购的产品运营闭环。

## 如何运行

## 在线网页

GitHub Pages 静态演示地址：

```text
https://scigjh1.github.io/scent-soul-digital-perfume-ip/
```

这个地址适合发给同学、朋友、面试官快速看前端体验：香水顾问、品牌香水库、动态数字 IP 都能打开。  
注意：GitHub Pages 只能托管静态页面，不能保存反馈数据，也不能安全地调用真实大模型 API。要收集调研数据或接入国内大模型，需要运行 `server.mjs` 后端，再用内网穿透或云服务器生成公网链接。

## 项目还能怎么提升

目前最应该提升的不是继续堆页面，而是把它改成一个更像真实产品的“香水选购顾问 + 购买后数字体验”：

1. 推荐链路更像真实导购：先问用户预算、场景、性别倾向、喜欢/讨厌的味道、留香扩香要求，再输出 3 款推荐，不要让用户先看一堆品牌。
2. 结果页更像电商决策页：每款香水给出适合人群、核心香调、价格带、适用季节、踩雷提醒、官网/购买入口和“生成数字 IP”按钮。
3. 香水数据更真实：继续补全 70 款香水的真实商品图、官方链接、价格带、香调结构，并增加国产渠道语境，例如天猫、得物、小红书内容反馈。
4. 运营闭环更清晰：把反馈页数据转成漏斗：访问 -> 推荐 -> 生成 IP -> 复制收藏卡 -> 反馈提交 -> 购买兴趣，后续可写进简历。
5. 大模型接入更稳：国内项目优先接通义/DeepSeek/Kimi，不把 Key 放前端；没有 Key 时用本地推荐规则兜底。
6. 数字 IP 不喧宾夺主：先解决“买哪款香水”，再把数字 IP 当成购买后的情绪价值、收藏卡和分享玩法。

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

### 3. 发给朋友并收集数据

页面已经接入轻量埋点和反馈表单。运行 Node 服务后，数据会写入 `data/events.jsonl`，并可通过下面接口查看：

```text
http://localhost:4177/api/metrics
http://localhost:4177/api/export/events.csv
```

产品数据后台：

```text
http://localhost:4177/dashboard.html?token=你的ADMIN_TOKEN
```

后台里的“模型产品评审”会读取当前转化漏斗和反馈分布，生成下一步怎么改。配置了国内大模型 API Key 时走模型诊断；没有 Key 时使用本地产品评审规则兜底。

正式发给朋友前建议设置 `ADMIN_TOKEN`，再用国内内网穿透或国内云服务器生成公网地址。详细看：

```text
docs/数据采集与国内分享部署说明.md
```

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
