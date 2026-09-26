const $ = (s) => document.querySelector(s);
const user = $('#user'), ghost = $('#ghost'), overlay = $('#overlay');
const uctx = user.getContext('2d'), octx = overlay.getContext('2d');
const ghostCtx = ghost.getContext('2d');

// 选择"真实 AI"时走后端 fetch；默认走内嵌 mock（纯静态也能跑）
function useRealAI() { return $('#use-real').checked; }

let drawing = false, tool = 'brush', last = null;

// 阶段切换
$('#stage-select').onchange = (e) => { $('#stage').textContent = e.target.value; };

// 工具
document.querySelectorAll('.toolbar button').forEach(b => {
  b.onclick = () => {
    document.querySelectorAll('.toolbar button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    tool = b.dataset.tool;
  };
});

// 绘制
user.onmousedown = (e) => { drawing = true; last = pos(e); };
window.onmouseup = () => { drawing = false; };
user.onmousemove = (e) => {
  if (!drawing) return;
  const p = pos(e);
  uctx.beginPath();
  uctx.moveTo(last.x, last.y);
  uctx.lineTo(p.x, p.y);
  uctx.strokeStyle = tool === 'eraser' ? '#ffffff' : $('#color').value;
  uctx.lineWidth = $('#size').value;
  uctx.lineCap = 'round';
  uctx.stroke();
  last = p;
};
function pos(e) {
  const r = user.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

// ---------- AI 评估 ----------
async function assess() {
  const stage = $('#stage-select').value;
  if (useRealAI()) {
    const resp = await fetch('/api/assess', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage, canvas: user.toDataURL('image/png'), colors: ['#333'] })
    });
    return resp.json();
  }
  return mockAssess(stage);
}

function mockAssess(stage) {
  const presets = {
    "草图": [
      { text: "画面元素集中在左上，右下留白过多，视觉重心偏左", severity: "suggestion", position: { x: 550, y: 400 } },
      { text: "比例关系合理，可进入线稿阶段", severity: "info" }
    ],
    "线稿": [
      { text: "检测到 2 处断点（线条未闭合），已在画布标出", severity: "warning", position: { x: 220, y: 180 } },
      { text: "线宽一致性良好", severity: "info" }
    ],
    "上色": [
      { text: "主色对比度过高，建议中间加过渡色", severity: "suggestion", position: { x: 400, y: 300 } }
    ],
    "细化": [ { text: "高光区域完成度 70%，可补充 2-3 处反光", severity: "suggestion" } ],
    "完成": [ { text: "整体完成度 85%，风格统一", severity: "info" } ]
  };
  return { stage, issues: presets[stage] || presets["草图"], confidence: 0.7 + Math.random() * 0.2 };
}

$('#btn-assess').onclick = async () => {
  const data = await assess();
  renderAssessment(data);
};

function renderAssessment(data) {
  const side = $('#sidebar');
  side.classList.remove('hidden');
  $('#side-title').textContent = `AI 评估 · ${data.stage}`;
  $('#side-body').innerHTML = (data.issues || []).map(i =>
    `<div class="issue ${i.severity}"><b>[${i.severity}]</b> ${i.text}${i.position ? ` <span style="color:#999;font-size:11px">(x:${i.position.x}, y:${i.position.y})</span>` : ''}</div>`
  ).join('') || '<div class="issue info">没有明显问题。</div>';
  octx.clearRect(0, 0, 800, 600);
  (data.issues || []).filter(i => i.position).forEach(i => {
    octx.beginPath();
    octx.arc(i.position.x, i.position.y, 10, 0, Math.PI * 2);
    octx.strokeStyle = i.severity === 'warning' ? '#d05050' : '#e0a53a';
    octx.lineWidth = 2;
    octx.stroke();
  });
}

// ---------- AI 生成参考 ----------
async function generate(prompt) {
  if (useRealAI()) {
    const resp = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    return (await resp.json()).image_url;
  }
  // 内嵌 mock：在本地生成一张渐变参考图
  const c = document.createElement('canvas');
  c.width = 800; c.height = 600;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 800, 600);
  const h = (prompt.length * 13) % 360;
  g.addColorStop(0, `hsl(${h}, 70%, 55%)`);
  g.addColorStop(1, `hsl(${(h + 120) % 360}, 70%, 45%)`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 800, 600);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "28px sans-serif";
  ctx.fillText("参考: " + prompt.slice(0, 24), 24, 48);
  return c.toDataURL('image/png');
}

$('#btn-generate').onclick = async () => {
  const prompt = $('#gen-prompt').value || '抽象渐变';
  const url = await generate(prompt);
  const img = new Image();
  img.onload = () => {
    ghostCtx.clearRect(0, 0, 800, 600);
    ghostCtx.drawImage(img, 0, 0, 800, 600);
    $('#btn-undo-ai').disabled = false;
  };
  img.src = url;
};

$('#btn-undo-ai').onclick = () => {
  ghostCtx.clearRect(0, 0, 800, 600);
  $('#btn-undo-ai').disabled = true;
};
