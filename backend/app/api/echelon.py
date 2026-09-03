# -*- coding: utf-8 -*-
"""二次服役与循环再生四级智能分选决策 API 路由"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, Any

from app.core.echelon_matrix import EchelonTieringEngine

router = APIRouter(prefix="/echelon", tags=["二次服役与循环再生智能分选决策"])


class EchelonClassificationRequest(BaseModel):
    cell_id: str = Field(default="BAT-2026-RET-01", description="电芯编号")
    soh_pct: float = Field(default=72.5, description="当前健康状态 SOH (%)")
    rpi_pct: float = Field(default=18.4, description="恢复潜力指数 RPI (%)")
    predicted_after_soh_pct: float = Field(default=79.2, description="调理后预期 SOH (%)")
    internal_res_ohm: float = Field(default=0.0132, description="直流内阻 (Ω)")
    coulombic_efficiency: float = Field(default=0.982, description="库仑效率")


@router.post("/classify", summary="执行二次服役与循环再生四级智能分选决策与雷达评级")
async def classify_echelon(req: EchelonClassificationRequest) -> Dict[str, Any]:
    res = EchelonTieringEngine.classify_battery(
        soh_pct=req.soh_pct,
        rpi_pct=req.rpi_pct,
        predicted_after_soh_pct=req.predicted_after_soh_pct,
        internal_res_ohm=req.internal_res_ohm,
        coulombic_efficiency=req.coulombic_efficiency
    )
    res["cell_id"] = req.cell_id
    return res
