# -*- coding: utf-8 -*-
"""系统自动化自检与算法验证脚本"""

import sys
from pathlib import Path

# 设置标准输出编码为 UTF-8
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# 添加 backend 到路径
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.core.m1_xgboost_engine import M1XGBoostDiagnosisEngine
from app.core.m2_elastic_engine import M2RecoverabilityEngine
from app.core.echelon_matrix import EchelonTieringEngine
from app.core.carbon_lca_engine import CarbonLCAEngine


def test_all():
    print("=== 开始系统自动化自检 ===")

    # 1. 测试 M1 SOH 快速诊断
    m1 = M1XGBoostDiagnosisEngine.predict_soh(
        u0_v=3.3116, rdc_dis_ohm=0.0124, rdc_chg_ohm=0.0138,
        drdc_ohm=-0.0026, eta_v=-0.0273, asym=-0.0521, relax_v=0.0537, soc_pct=50.0
    )
    assert 50.0 <= m1["predicted_soh_pct"] <= 100.0
    print(f"[通过] M1 快速诊断测试: 预测 SOH = {m1['predicted_soh_pct']}%, 健康等级 = {m1['health_grade']}")

    # 2. 测试 M2 恢复容量预测
    m2 = M2RecoverabilityEngine.predict_recovery(
        q_dis_ah=0.985, coulombic_efficiency=0.9842, energy_efficiency=0.8950,
        v_mean_dis_v=3.195, v_hyst_v=0.1420, nominal_capacity_ah=1.50
    )
    assert m2["predicted_qrec_ah"] > 0
    assert m2["lower_90_ah"] <= m2["predicted_qrec_ah"] <= m2["upper_90_ah"]
    print(f"[通过] M2 恢复容量预测: 预测 Q_rec = {m2['predicted_qrec_ah']} Ah, 90%保角区间 = [{m2['lower_90_ah']} ~ {m2['upper_90_ah']}], 恢复潜力 RPI = {m2['rpi_pct']}%")

    # 3. 测试循环再生四级分选
    ech = EchelonTieringEngine.classify_battery(
        soh_pct=m1["predicted_soh_pct"], rpi_pct=m2["rpi_pct"],
        predicted_after_soh_pct=m2["predicted_after_soh_pct"]
    )
    assert ech["tier_code"] in ["CLASS_A", "CLASS_B", "CLASS_C", "CLASS_D"]
    print(f"[通过] 循环再生分选测试: 分选评级 = {ech['tier']}")

    # 4. 测试 M3 碳量化
    carb = CarbonLCAEngine.calculate_carbon_benefit(
        recovery_fraction_nominal=m2["recovery_fraction_nominal_pct"] / 100.0,
        pack_capacity_kwh=60.48, batch_cell_count=1
    )
    assert carb["ghg_avoided_kg"] > 0
    assert carb["ghg_net_kg"] > 0
    print(f"[通过] M3 碳减排量化测试: 规避制造碳排 = {carb['ghg_avoided_kg']} kgCO2e, 净减排 = {carb['ghg_net_kg']} kgCO2e, CO2体积 = {carb['co2_volume_m3']} m3, 植树等效 = {carb['trees_equivalent_count']} 棵")

    print("=== 全流程自检测试 100% 全部通过！===")


if __name__ == "__main__":
    test_all()
