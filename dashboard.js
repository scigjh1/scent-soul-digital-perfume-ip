const $ = (id) => document.getElementById(id);

const labels = {
  role: {
    "perfume-user": "香水爱好者",
    "gift-buyer": "送礼/礼盒用户",
    "content-user": "喜欢晒图分享",
    "product-ops": "产品/运营同学",
    passerby: "普通路人",
    unknown: "未填写"
  },
  reason: {
    visual: "动态画面",
    music: "香气音乐",
    story: "专属故事",
    card: "收藏卡",
    none: "暂时没有",
    unknown: "未填写"
  },
  useCase: {
    self: "自己收藏",
    share: "社交分享",
    gift: "送礼展示",
    brand: "品牌联名",
    "no-use": "暂时不用",
    unknown: "未填写"
  },
  perfume: {
    nile: "尼罗河花园",
    bloom: "绯雾花庭",
    amber: "琥珀书房",
    raintea: "雨后茶室",
    unknown: "未填写"
  }
};

function tokenFromUrl() {
  return new URLSearchParams(location.search).get("token") || localStorage.getItem("scentSoulAdminToken") || "";
}

function setExportUrl(token) {
  $("exportCsv").href = token ? `/api/export/events.csv?token=${encodeURIComponent(token)}` : "/api/export/events.csv";
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function percentNumber(text) {
  return Number(String(text || "0").replace("%", "")) || 0;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderFunnel(funnel = []) {
  const max = Math.max(...funnel.map((item) => item.count), 1);
  $("funnelList").innerHTML = funnel.map((item) => {
    const width = Math.max(3, Math.round((item.count / max) * 100));
    return `
      <div class="funnel-row">
        <b>${item.label}</b>
        <div class="funnel-bar"><span style="width:${width}%"></span></div>
        <em>${item.count}</em>
        <small>${item.rateFromPrevious}</small>
      </div>
    `;
  }).join("");
}

function renderDistribution(title, values = {}, dictionary = {}) {
  const entries = Object.entries(values).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, value]) => value), 1);
  if (!entries.length) {
    return `<div class="distribution-group"><b>${title}</b><p class="eyebrow">暂无数据</p></div>`;
  }
  const rows = entries.map(([key, value]) => `
    <div class="distribution-item">
      <span>${dictionary[key] || key}</span>
      <span style="--w:${Math.round((value / max) * 100)}%"></span>
      <span>${value}</span>
    </div>
  `).join("");
  return `<div class="distribution-group"><b>${title}</b>${rows}</div>`;
}

function renderRecent(items = []) {
  $("recentFeedback").innerHTML = items.length ? items.map((item) => {
    const detail = item.detail || {};
    const note = detail.feedback || "没有文字反馈";
    return `
      <div class="recent-card">
        <p>${escapeHTML(note)}</p>
        <small>${escapeHTML(labels.perfume[detail.perfumeId] || detail.perfumeId || "未知香水")} · 评分 ${escapeHTML(detail.score || "-")} · ${escapeHTML(labels.reason[detail.reason] || detail.reason || "未选打动点")}</small>
      </div>
    `;
  }).join("") : `<div class="recent-card"><p>暂无反馈。先把体验页发给朋友试一下。</p></div>`;
}

function renderReview(review) {
  const priorities = (review.priorities || []).map((item) => `
    <div class="review-card">
      <b>${escapeHTML(item.title)}</b>
      <p>${escapeHTML(item.why)}</p>
      <small>改法：${escapeHTML(item.action)}<br />验证：${escapeHTML(item.metric)}</small>
    </div>
  `).join("");
  const experiments = (review.experiments || []).map((item) => `<li>${escapeHTML(item)}</li>`).join("");
  const risks = (review.risks || []).map((item) => `<li>${escapeHTML(item)}</li>`).join("");
  $("reviewResult").innerHTML = `
    <div class="review-summary">
      <div class="review-score">${escapeHTML(review.score)}</div>
      <p>${escapeHTML(review.summary)}<br /><small>来源：${escapeHTML(review.source || "model")}</small></p>
    </div>
    ${priorities}
    <div class="review-card">
      <b>建议实验</b>
      <ol class="review-list">${experiments}</ol>
    </div>
    <div class="review-card">
      <b>风险提醒</b>
      <ol class="review-list">${risks}</ol>
    </div>
  `;
}

function renderMetrics(data) {
  const feedback = data.feedbackSummary || {};
  $("totalEvents").textContent = data.totalEvents || 0;
  $("uniqueSessions").textContent = data.uniqueSessions || 0;
  $("averageScore").textContent = feedback.averageScore || 0;
  $("purchaseIntent").textContent = feedback.purchaseIntentRate || "0%";
  $("lastEventAt").textContent = data.lastEventAt ? `最后事件 ${new Date(data.lastEventAt).toLocaleString()}` : "暂无数据";
  renderFunnel(data.funnel || []);
  $("distributionList").innerHTML = [
    renderDistribution("体验者类型", feedback.role, labels.role),
    renderDistribution("打动点", feedback.reason, labels.reason),
    renderDistribution("使用场景", feedback.useCase, labels.useCase),
    renderDistribution("香水偏好", feedback.perfume, labels.perfume)
  ].join("");
  renderRecent(data.recentFeedback || []);

  const shareRate = percentNumber(feedback.shareIntentRate);
  document.documentElement.style.setProperty("--accent", shareRate >= 50 ? "#76f0cb" : "#f8d25d");
}

async function loadMetrics() {
  const token = $("adminToken").value.trim();
  if (token) localStorage.setItem("scentSoulAdminToken", token);
  setExportUrl(token);
  const url = token ? `/api/metrics?token=${encodeURIComponent(token)}` : "/api/metrics";
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) {
    showToast(data.error || "口令不对，无法读取数据");
    return;
  }
  renderMetrics(data);
  showToast("数据已刷新");
}

async function loadReview() {
  const token = $("adminToken").value.trim();
  if (token) localStorage.setItem("scentSoulAdminToken", token);
  $("reviewResult").innerHTML = `<p>正在生成产品评审...</p>`;
  const url = token ? `/api/review?token=${encodeURIComponent(token)}` : "/api/review";
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) {
    showToast(data.error || "口令不对，无法生成评审");
    $("reviewResult").innerHTML = `<p>生成失败，请检查管理口令。</p>`;
    return;
  }
  renderReview(data.review);
  showToast("产品评审已生成");
}

function init() {
  const token = tokenFromUrl();
  $("adminToken").value = token;
  setExportUrl(token);
  $("loadMetrics").addEventListener("click", loadMetrics);
  $("loadReview").addEventListener("click", loadReview);
  loadMetrics().catch((error) => showToast(error.message));
}

init();
