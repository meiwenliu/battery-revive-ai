# -*- coding: utf-8 -*-
"""FastAPI 主应用入口与静态页面托管"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from app.api.diagnosis import router as diag_router
from app.api.recoverability import router as rec_router
from app.api.echelon import router as ech_router
from app.api.carbon import router as carb_router
from app.api.realtime import router as rt_router
from app.api.report import router as rep_router

app = FastAPI(
    title="焕芯·电愈智策——多体系电池智能快速诊断与低碳循环决策系统",
    description="面向多材料体系锂电与储能全场景电池的 SOH 快速健康诊断、单次状态容量恢复精准预估、四级分选与制造端碳减排规避量量化全流程决策平台",
    version="1.0.0"
)

# 允许跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. 基础系统健康检查接口
@app.get("/api/health", summary="系统健康检查")
async def health_check():
    return {
        "status": "healthy",
        "system": "焕芯·电愈智策",
        "version": "1.0.0",
        "timestamp": "2026-08-31"
    }

# 2. 注册各核心业务模块 API 路由
app.include_router(diag_router, prefix="/api")
app.include_router(rec_router, prefix="/api")
app.include_router(ech_router, prefix="/api")
app.include_router(carb_router, prefix="/api")
app.include_router(rt_router, prefix="/api")
app.include_router(rep_router, prefix="/api")

# 3. 挂载前端静态资源子目录
FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend"
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"

if (FRONTEND_DIR / "css").exists():
    app.mount("/css", StaticFiles(directory=str(FRONTEND_DIR / "css")), name="css")

if (FRONTEND_DIR / "js").exists():
    app.mount("/js", StaticFiles(directory=str(FRONTEND_DIR / "js")), name="js")

if (FRONTEND_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="assets")

if DATA_DIR.exists():
    app.mount("/data", StaticFiles(directory=str(DATA_DIR)), name="data")

# 4. 根路径返回 index.html
@app.get("/")
async def serve_index():
    index_file = FRONTEND_DIR / "index.html"
    return FileResponse(str(index_file))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
