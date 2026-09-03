# -*- coding: utf-8 -*-
"""电池全场景循环再生四级智能分选决策矩阵引擎"""

from typing import Dict, Any, List


class EchelonTieringEngine:
    """循环再生分选决策矩阵与机理雷达评级"""

    @classmethod
    def classify_battery(
        cls,
        soh_pct: float,
        rpi_pct: float,
        predicted_after_soh_pct: float,
        internal_res_ohm: float = 0.013,
        coulombic_efficiency: float = 0.985
    ) -> Dict[str, Any]:
        """
        四级智能分选决策规则：
        1. Class A (一级·储能级直接循环再生): SOH >= 80%
        2. Class B (二级·调理再生+储能/备电循环再生): SOH < 80% 且 (RPI >= 15% 或 恢复后SOH >= 75%)
        3. Class C (三级·轻型降额利用): SOH 60%~75% 且 恢复潜力一般
        4. Class D (四级·材料级绿色拆解回收): SOH < 60% 且 恢复潜力极低 (RPI < 8%)
        """
        if soh_pct >= 80.0:
            tier = "A 级：高价值储能直接循环再利用"
            tier_code = "CLASS_A"
            color = "#10B981"
            scene = "大型工商业储能电站 / 电网调峰调频储能舱 / 数据中心绿色备电"
            treatment = "免调理或轻度均衡，直接经过模组重组后投入储能系统"
            economic_value = "高 (残值率 65%~80%)"
        elif soh_pct < 80.0 and (rpi_pct >= 15.0 or predicted_after_soh_pct >= 75.0):
            tier = "B 级：深度调理再生 + 储能/高敏备电应用"
            tier_code = "CLASS_B"
            color = "#06B6D4"
            scene = "工商业与户用储能 / 5G 通信基站备电 / 离网微电网储能"
            treatment = "执行 3.6V 恒压充电微调理规程，激活可逆活性锂，提升健康度后再成组"
            economic_value = "中高 (调理后残值率提升 20%~35%)"
        elif soh_pct >= 60.0 or rpi_pct >= 8.0:
            tier = "C 级：降级轻载场景利用"
            tier_code = "CLASS_C"
            color = "#F59E0B"
            scene = "太阳能路灯 / 农业灌溉备用电源 / 园区离网备电储能"
            treatment = "降额倍率运行 (<=0.2C)，严格限制充放电截止电压区间"
            economic_value = "中低 (残值率 30%~45%)"
        else:
            tier = "D 级：材料级绿色拆解提锂回收"
            tier_code = "CLASS_D"
            color = "#EF4444"
            scene = "正规湿法冶金回收生产线 / 电池多材料定向提锂与前驱体再生 (锂/镍/钴/钠盐等)"
            treatment = "不建议投入二次服役，直接进入带电破碎与湿法提锂闭环回收链路"
            economic_value = "材料回收价值 (按碳酸锂当期市价结算)"

        # 5 维度微观机理雷达评分 (0-100分)
        radar_scores = {
            "容量保持度": round(min(100.0, soh_pct * 1.05), 1),
            "反应过程对称性": round(min(100.0, max(20.0, 100.0 - internal_res_ohm * 3000)), 1),
            "副反应抑制性": round(min(100.0, coulombic_efficiency * 100.0), 1),
            "容量可恢复潜力": round(min(100.0, rpi_pct * 3.5), 1),
            "低碳环境效益": round(min(100.0, max(30.0, (predicted_after_soh_pct if tier_code == 'CLASS_B' else soh_pct) * 1.1)), 1)
        }

        return {
            "tier": tier,
            "tier_code": tier_code,
            "color": color,
            "application_scene": scene,
            "recommended_treatment": treatment,
            "economic_value": economic_value,
            "radar_scores": radar_scores
        }
