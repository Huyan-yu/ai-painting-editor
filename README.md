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
