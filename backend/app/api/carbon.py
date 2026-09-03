# -*- coding: utf-8 -*-
"""微观到宏观制造端碳减排规避量量化核算 API 路由"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, Any

from app.core.carbon_lca_engine import CarbonLCAEngine

router = APIRouter(prefix="/carbon", tags=["制造端碳减排量化核算 (M3)"])


class CarbonBenefitRequest(BaseModel):
    recovery_fraction_nominal: float = Field(default=0.1086, description="标称容量恢复比例 (如 0.1086 代表 10.86%)")
    pack_capacity_kwh: float = Field(default=60.48, description="基准电池包容量 (kWh)")
    batch_cell_count: int = Field(default=1, description="评估电芯或电池包批次规模 (组/只)")
    ef_mfg_kg_per_kwh: float = Field(default=105.0, description="电池制造碳排放因子 (kgCO₂e/kWh)")
    ef_grid_kg_per_kwh: float = Field(default=0.5810, description="电网排放因子 (kgCO₂e/kWh)")
    reconditioning_energy_kwh: float = Field(default=0.85, description="单体/单包调理电耗 (kWh)")


@router.post("/calculate", summary="量化计算制造端碳减排规避量与宏观生态效益")
async def calculate_carbon_benefit(req: CarbonBenefitRequest) -> Dict[str, Any]:
    return CarbonLCAEngine.calculate_carbon_benefit(
        recovery_fraction_nominal=req.recovery_fraction_nominal,
        pack_capacity_kwh=req.pack_capacity_kwh,
        batch_cell_count=req.batch_cell_count,
        ef_mfg_kg_per_kwh=req.ef_mfg_kg_per_kwh,
        ef_grid_kg_per_kwh=req.ef_grid_kg_per_kwh,
        reconditioning_energy_kwh=req.reconditioning_energy_kwh
    )
