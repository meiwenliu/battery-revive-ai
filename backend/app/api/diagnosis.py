# -*- coding: utf-8 -*-
"""SOH 快速健康诊断 API 路由（支持模型选择）"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, Any

from app.core.m1_xgboost_engine import M1XGBoostDiagnosisEngine

router = APIRouter(prefix="/diagnosis", tags=["SOH快速健康诊断 (M1)"])


class SOHDiagnosisRequest(BaseModel):
    cell_id: str = Field(default="BAT-LFP-001", description="电芯识别码")
    u0_v: float = Field(default=3.3116, description="稳态开路电压 U0 (V)")
    rdc_dis_ohm: float = Field(default=0.0124, description="放电直流电阻 (Ω)")
    rdc_chg_ohm: float = Field(default=0.0138, description="充电直流电阻 (Ω)")
    drdc_ohm: float = Field(default=-0.0026, description="倍率敏感内阻差 (Ω)")
    eta_v: float = Field(default=-0.0273, description="持续极化电压 η (V)")
    asym: float = Field(default=-0.0521, description="充放电不对称度")
    relax_v: float = Field(default=0.0537, description="撤载松弛电压 (V)")
    soc_pct: float = Field(default=50.0, description="测试荷电状态 (%)")
    model_type: str = Field(default="xgboost", description="选择的预测算法模型 (xgboost, random_forest, ridge, pls, svr, mean_baseline)")
    chemistry: str = Field(default="LFP", description="材料体系")


@router.post("/soh", summary="单电芯 SOH 快速诊断预测（支持指定算法模型）")
async def diagnose_single_cell(req: SOHDiagnosisRequest) -> Dict[str, Any]:
    res = M1XGBoostDiagnosisEngine.predict_soh(
        u0_v=req.u0_v,
        rdc_dis_ohm=req.rdc_dis_ohm,
        rdc_chg_ohm=req.rdc_chg_ohm,
        drdc_ohm=req.drdc_ohm,
        eta_v=req.eta_v,
        asym=req.asym,
        relax_v=req.relax_v,
        soc_pct=req.soc_pct,
        model_type=req.model_type,
        chemistry=req.chemistry
    )
    res["cell_id"] = req.cell_id
    return res
