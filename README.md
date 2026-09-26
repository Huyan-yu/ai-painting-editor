# AI 绘画编辑器

一个与人机协作绘画的 Canvas 编辑器，集成多模态 LLM 评估与图像生成辅助。

## 架构

```
frontend/
  index.html          — 画布 + 工具栏 + 侧边栏
  app.js              — 交互逻辑、Canvas 渲染、AI 调用
  style.css           — 样式
backend/
  mock_ai.py          — Mock 的 LLM 评估 + 图像生成 API（FastAPI）
  real_ai.py          — 真实接入 DeepSeek（评估）+ Agnes（图像生成）
docs/
  交互设计.md          — 交互模式与原则
  工作流设计.md        — 绘画工作流与场景细化
```

## 运行

```bash
# 启动 mock 后端（默认）
cd backend && python mock_ai.py

# 前端直接打开
open ../frontend/index.html
```

## Mock vs 真实

默认使用 mock，无需 API key。设置环境变量 `USE_REAL_AI=1` 后切换：
- 评估：DeepSeek chat API（多模态，传入画布截图 + 上下文）
- 生成：Agnes video/image API（根据 prompt 生成参考图）
## 公网访问
- **GitHub Pages（纯静态，内嵌 mock）**：启用仓库 Pages 后访问 `https://Huyan-yu.github.io/ai-painting-editor/frontend/`，无需后端即可完整运行（评估/生成走本地 mock）
- **带真实 AI 的完整运行**：启动 `backend/mock_ai.py`（或 `real_ai.py`），前端勾选"真实 AI"后走后端接口

## 目录
```
frontend/
  index.html   — 画布 + 工具栏 + 侧边栏
  app.js       — 交互逻辑、Canvas 渲染、内嵌 mock、AI 调用
  style.css    — 样式
backend/
  mock_ai.py   — FastAPI mock 的 LLM 评估 + 图像生成 API
docs/
  交互设计.md   — 交互模式与原则
  工作流设计.md — 绘画工作流与场景细化
README_交付说明.md — 题目要求的交付说明
```

## 本地运行
纯前端（mock）：浏览器直接打开 `frontend/index.html`，无需依赖。

带后端：
```bash
cd backend
pip install fastapi uvicorn pillow
python -m uvicorn mock_ai:app --port 8790
# 打开 frontend/index.html，勾选"真实 AI"
```

## Mock vs 真实
默认内嵌 mock，无需 API key、无需后端。勾选"真实 AI"后改调后端 `/api/assess` 与 `/api/generate`。
