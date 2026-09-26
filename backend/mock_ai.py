"""Mock AI 后端：评估 + 生成。无需 API key。"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import base64, io, random

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.post("/api/assess")
async def assess(body: dict):
    stage = body.get("stage", "草图")
    # mock：按阶段返回预制的合理评估
    presets = {
        "草图": [
            {"text": "画面元素集中在左上，右下留白过多，视觉重心偏左", "severity": "suggestion", "position": {"x": 550, "y": 400}},
            {"text": "比例关系合理，可进入线稿阶段", "severity": "info"}
        ],
        "线稿": [
            {"text": "检测到 2 处断点（线条未闭合），已在画布标出", "severity": "warning", "position": {"x": 220, "y": 180}},
            {"text": "线宽一致性良好", "severity": "info"}
        ],
        "上色": [
            {"text": "主色 #4a90d9 与 #d05050 对比度过高，建议中间加过渡色 #8a8a8a", "severity": "suggestion", "position": {"x": 400, "y": 300}},
        ],
        "细化": [
            {"text": "高光区域完成度 70%，可补充 2-3 处反光", "severity": "suggestion"}
        ],
        "完成": [
            {"text": "整体完成度 85%，风格统一", "severity": "info"}
        ],
    }
    return {"stage": stage, "issues": presets.get(stage, presets["草图"]), "confidence": 0.7 + random.random() * 0.2}

@app.post("/api/generate")
async def generate(body: dict):
    prompt = body.get("prompt", "")
    # mock：返回一张 1x1 的纯色 PNG 作为占位参考图
    from PIL import Image
    img = Image.new("RGB", (800, 600), color=(random.randint(0,255), random.randint(0,255), random.randint(0,255)))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    url = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    return {"image_url": url, "prompt": prompt}

@app.get("/")
def root():
    return {"service": "AI 绘画编辑器 mock 后端"}
