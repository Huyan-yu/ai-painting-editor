const $ = (s) => document.querySelector(s);
const user = $('#user'), ghost = $('#ghost'), overlay = $('#overlay');
const uctx = user.getContext('2d'), octx = overlay.getContext('2d');
const ghostCtx = ghost.getContext('2d');

let drawing = false, tool = 'brush', last = null;
let aiHistory = []; // 撤销 AI 修改用

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

// AI 评估
$('#btn-assess').onclick = async () => {
  const stage = $('#stage-select').value;
  const resp = await fetch('/api/assess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage, canvas: user.toDataURL('image/png'), colors: ['#333'] })
  });
  const data = await resp.json();
  renderAssessment(data);
};

function renderAssessment(data) {
  const side = $('#sidebar');
  side.classList.remove('hidden');
  $('#side-title').textContent = `AI 评估 · ${data.stage}`;
  $('#side-body').innerHTML = (data.issues || []).map(i =>
    `<div class="issue ${i.severity}"><b>[${i.severity}]</b> ${i.text}${i.position ? ` <span style="color:#999;font-size:11px">(x:${i.position.x}, y:${i.position.y})</span>` : ''}</div>`
  ).join('') || '<div class="issue info">没有明显问题。</div>';
  // 在 overlay 上画标记
  octx.clearRect(0, 0, 800, 600);
  (data.issues || []).filter(i => i.position).forEach(i => {
    octx.beginPath();
    octx.arc(i.position.x, i.position.y, 10, 0, Math.PI * 2);
    octx.strokeStyle = i.severity === 'warning' ? '#d05050' : '#e0a53a';
    octx.lineWidth = 2;
    octx.stroke();
  });
}

// AI 生成参考
$('#btn-generate').onclick = async () => {
  const prompt = $('#gen-prompt').value || '抽象渐变';
  const resp = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  const data = await resp.json();
  const img = new Image();
  img.onload = () => {
    ghostCtx.clearRect(0, 0, 800, 600);
    ghostCtx.drawImage(img, 0, 0, 800, 600);
    $('#btn-undo-ai').disabled = false;
  };
  img.src = data.image_url;
};

$('#btn-undo-ai').onclick = () => {
  ghostCtx.clearRect(0, 0, 800, 600);
  $('#btn-undo-ai').disabled = true;
};
