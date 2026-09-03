# -*- coding: utf-8 -*-
"""容量可恢复性预估 API 路由（支持模型选择）"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

from app.core.m2_elastic_engine import M2RecoverabilityEngine

router = APIRouter(prefix="/recoverability", tags=["容量可恢复性预估 (M2)"])


class RecoverabilityRequest(BaseModel):
    cell_id: str = Field(default="REC-LFP-01", description="电芯编号")
    nominal_capacity_ah: float = Field(default=1.50, description="初始标称容量 (Ah)")
    q_dis_ah: float = Field(default=0.985, description="当前放电容量 (Ah)")
    coulombic_efficiency: float = Field(default=0.9842, description="库仑效率 CE")
    energy_efficiency: float = Field(default=0.8950, description="能量效率 EE")
    v_mean_dis_v: float = Field(default=3.195, description="平均放电电压 (V)")
    v_hyst_v: float = Field(default=0.1420, description="平均电压滞后 (V)")
    model_type: str = Field(default="elasticnet", description="选择的预测算法 (elasticnet, linear, lasso, gpr, mean_baseline)")
    current_soh_pct: Optional[float] = Field(default=None, description="当前 SOH (%)")


@router.post("/predict", summary="单次状态特征可恢复容量预测（支持指定算法模型）")
async def predict_capacity_recovery(req: RecoverabilityRequest) -> Dict[str, Any]:
    res = M2RecoverabilityEngine.predict_recovery(
        q_dis_ah=req.q_dis_ah,
        coulombic_efficiency=req.coulombic_efficiency,
        energy_efficiency=req.energy_efficiency,
        v_mean_dis_v=req.v_mean_dis_v,
        v_hyst_v=req.v_hyst_v,
        nominal_capacity_ah=req.nominal_capacity_ah,
        model_type=req.model_type,
        current_soh_pct=req.current_soh_pct
    )
    res["cell_id"] = req.cell_id
    return res
