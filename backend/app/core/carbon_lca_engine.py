# -*- coding: utf-8 -*-
"""微观电化学状态到宏观制造端碳减排规避量量化核算引擎 (M3 LCA)"""

import numpy as np
from typing import Dict, Any, List


class CarbonLCAEngine:
    """全流程微观-宏观碳减排量化核算引擎"""

    # 官方与权威文献碳排放因子数据库 (严禁虚构，数据严格可溯源)
    # 1. 锂电储能与新能源电池制造碳排放因子 (kgCO2e/kWh): 105.0 kgCO2e/kWh (典型电池 LCA 制造基线)
    EF_MFG_LFP_KGCO2E_PER_KWH = 105.0
    
    # 2. 2024 年全国平均电力碳足迹因子 (生态环境部/统计局/能源局官方公告): 0.5777~0.5810 kgCO2e/kWh
    EF_GRID_CHINA_2024 = 0.5810
    EF_GRID_COAL = 0.9240
    EF_GRID_CLEAN = 0.0520  # 光伏/风电清洁绿电

    # 3. 二氧化碳理想气体常压折算密度 (25℃, 1 atm): 1.80 kg/m3 (NIST 数据库)
    CO2_DENSITY_KG_M3 = 1.80

    # 4. 标准储能电池系统模组基准: 60.48 kWh
    DEFAULT_PACK_CAPACITY_KWH = 60.48

    # 5. 生态等效参数: 1棵成年树木年均吸收 CO2 约 18.0 kg; 电动汽车百公里电耗 15 kWh (折算减排里程)
    TREE_ANNUAL_SEQUESTRATION_KG = 18.0
    EV_KM_PER_KWH = 6.67  # 1 kWh 约行驶 6.67 km

    @classmethod
    def calculate_carbon_benefit(
        cls,
        recovery_fraction_nominal: float = 0.1086,
        pack_capacity_kwh: float = 60.48,
        batch_cell_count: int = 1,
        ef_mfg_kg_per_kwh: float = 105.0,
        ef_grid_kg_per_kwh: float = 0.5810,
        reconditioning_energy_kwh: float = 0.85
    ) -> Dict[str, Any]:
        """
        执行完整的微观到宏观碳减排规避量核算：
        1. 电池包等效恢复电量 E_pack,rec = E_pack * recovery_fraction
        2. 制造端规避碳减排潜力 GHG_avoided = E_pack,rec * EF_mfg
        3. 调理过程电耗碳排 GHG_process = E_recond * EF_grid
        4. 净规避碳减排量 GHG_net = GHG_avoided - GHG_process
        5. 常压 CO2 气体体积 V_CO2 = GHG_net / rho_CO2
        """
        frac = float(np.clip(recovery_fraction_nominal, 0.0, 0.50))
        pack_kwh = max(float(pack_capacity_kwh), 1.0)
        n_cells = max(int(batch_cell_count), 1)

        # 1. 电池包等效恢复电量 (kWh)
        recovered_energy_pack_kwh = pack_kwh * frac
        total_recovered_kwh = recovered_energy_pack_kwh * n_cells

        # 2. 制造端碳排放规避潜力 (kgCO2e)
        ghg_avoided_kg = total_recovered_kwh * ef_mfg_kg_per_kwh

        # 3. 电化学调理过程电网耗电碳排放 (kgCO2e)
        ghg_process_kg = reconditioning_energy_kwh * ef_grid_kg_per_kwh * n_cells

        # 4. 净规避碳减排量 (kgCO2e)
        ghg_net_kg = max(0.0, ghg_avoided_kg - ghg_process_kg)

        # 5. 常压 CO2 体积 (m3)
        co2_volume_m3 = ghg_net_kg / cls.CO2_DENSITY_KG_M3

        # 6. 生态与出行等效
        trees_equivalent = ghg_net_kg / cls.TREE_ANNUAL_SEQUESTRATION_KG
        ev_clean_mileage_km = total_recovered_kwh * cls.EV_KM_PER_KWH

        # 7. 不同电网清洁度情景敏感性对比
        scenarios = [
            {
                "scenario_name": "全国基准电网 (当前官方因子 0.5810 kgCO₂e/kWh)",
                "ghg_net_kg": round(ghg_avoided_kg - (reconditioning_energy_kwh * 0.5810 * n_cells), 2),
                "co2_volume_m3": round((ghg_avoided_kg - (reconditioning_energy_kwh * 0.5810 * n_cells)) / cls.CO2_DENSITY_KG_M3, 2),
                "efficiency_gain_pct": 100.0
            },
            {
                "scenario_name": "绿电微电网 (光伏/风电 0.0520 kgCO₂e/kWh)",
                "ghg_net_kg": round(ghg_avoided_kg - (reconditioning_energy_kwh * 0.0520 * n_cells), 2),
                "co2_volume_m3": round((ghg_avoided_kg - (reconditioning_energy_kwh * 0.0520 * n_cells)) / cls.CO2_DENSITY_KG_M3, 2),
                "efficiency_gain_pct": round(((ghg_avoided_kg - (reconditioning_energy_kwh * 0.0520 * n_cells)) / max(ghg_net_kg, 1e-4)) * 100.0, 1)
            },
            {
                "scenario_name": "燃煤火电网 (高碳因子 0.9240 kgCO₂e/kWh)",
                "ghg_net_kg": round(ghg_avoided_kg - (reconditioning_energy_kwh * 0.9240 * n_cells), 2),
                "co2_volume_m3": round((ghg_avoided_kg - (reconditioning_energy_kwh * 0.9240 * n_cells)) / cls.CO2_DENSITY_KG_M3, 2),
                "efficiency_gain_pct": round(((ghg_avoided_kg - (reconditioning_energy_kwh * 0.9240 * n_cells)) / max(ghg_net_kg, 1e-4)) * 100.0, 1)
            }
        ]

        # 8. 全流程量化链路分步节点 (用于瀑布图/桑基图渲染)
        waterfall_steps = [
            {"name": "电池系统基准电量", "value": round(pack_kwh, 2), "unit": "kWh", "type": "base"},
            {"name": "电化学调理恢复电量 (+)", "value": round(total_recovered_kwh, 3), "unit": "kWh", "type": "gain"},
            {"name": "制造端规避碳排潜力 (+)", "value": round(ghg_avoided_kg, 2), "unit": "kgCO₂e", "type": "gain"},
            {"name": "调理电网电耗抵扣 (-)", "value": round(-ghg_process_kg, 2), "unit": "kgCO₂e", "type": "cost"},
            {"name": "净规避碳减排总量 (=)", "value": round(ghg_net_kg, 2), "unit": "kgCO₂e", "type": "total"}
        ]

        return {
            "recovery_fraction_nominal_pct": round(frac * 100.0, 2),
            "pack_capacity_kwh": pack_kwh,
            "batch_cell_count": n_cells,
            "recovered_energy_pack_kwh": round(recovered_energy_pack_kwh, 3),
            "total_recovered_kwh": round(total_recovered_kwh, 3),
            "ghg_avoided_kg": round(ghg_avoided_kg, 2),
            "ghg_process_kg": round(ghg_process_kg, 2),
            "ghg_net_kg": round(ghg_net_kg, 2),
            "co2_volume_m3": round(co2_volume_m3, 2),
            "trees_equivalent_count": round(trees_equivalent, 1),
            "ev_clean_mileage_km": round(ev_clean_mileage_km, 1),
            "ef_mfg_used": ef_mfg_kg_per_kwh,
            "ef_grid_used": ef_grid_kg_per_kwh,
            "scenarios": scenarios,
            "waterfall_steps": waterfall_steps
        }
