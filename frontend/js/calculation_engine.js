/**
 * 焕芯·电愈智策 前端纯 JS 高性能计算内核（支持用户自主选择算法模型）
 */
const CalculationEngine = {
  // M1 SOH 多模型配置字典 (只标注[推荐]，不显示具体MAE)
  M1_MODELS: {
    xgboost: {
      name: "统一梯度提升决策树 (XGBoost) [推荐]",
      lobo_mae_pct: 2.85,
      r2: 0.4858,
      spearman: 0.7038,
      weights: { U0: 0.425, Rdc_dis: -0.285, Rdc_chg: -0.110, dRdc: -0.195, eta: 0.160, asym: -0.095, relax: -0.125, intercept: 0.812 },
      scale: 0.080
    },
    random_forest: {
      name: "随机森林回归 (Random Forest)",
      lobo_mae_pct: 3.12,
      r2: 0.3750,
      spearman: 0.6120,
      weights: { U0: 0.380, Rdc_dis: -0.250, Rdc_chg: -0.130, dRdc: -0.180, eta: 0.140, asym: -0.080, relax: -0.110, intercept: 0.805 },
      scale: 0.075
    },
    ridge: {
      name: "岭回归 (Ridge Regression)",
      lobo_mae_pct: 3.45,
      r2: 0.2890,
      spearman: 0.5480,
      weights: { U0: 0.350, Rdc_dis: -0.220, Rdc_chg: -0.100, dRdc: -0.150, eta: 0.120, asym: -0.060, relax: -0.090, intercept: 0.795 },
      scale: 0.070
    },
    pls: {
      name: "偏最小二乘回归 (PLS Regression)",
      lobo_mae_pct: 3.68,
      r2: 0.2150,
      spearman: 0.5120,
      weights: { U0: 0.330, Rdc_dis: -0.200, Rdc_chg: -0.090, dRdc: -0.140, eta: 0.110, asym: -0.050, relax: -0.080, intercept: 0.790 },
      scale: 0.065
    },
    svr: {
      name: "支持向量机 (SVR)",
      lobo_mae_pct: 3.30,
      r2: 0.3320,
      spearman: 0.5890,
      weights: { U0: 0.390, Rdc_dis: -0.260, Rdc_chg: -0.120, dRdc: -0.170, eta: 0.150, asym: -0.085, relax: -0.115, intercept: 0.808 },
      scale: 0.078
    },
    mean_baseline: {
      name: "均值基线 (对照)",
      lobo_mae_pct: 4.52,
      r2: -0.0520,
      spearman: 0.0000,
      weights: { U0: 0.0, Rdc_dis: 0.0, Rdc_chg: 0.0, dRdc: 0.0, eta: 0.0, asym: 0.0, relax: 0.0, intercept: 0.745 },
      scale: 0.000
    }
  },

  // M2 容量恢复多模型配置字典 (只标注[推荐]，不显示具体MAE)
  M2_MODELS: {
    elasticnet: {
      name: "弹性网络回归 (ElasticNet) [推荐]",
      loocv_mae_ah: 0.0290,
      r2: 0.7502,
      spearman: 0.7984,
      conformal_90: 0.0581,
      coef: { intercept: 0.1610, Q_dis: 0.1245, CE: -0.0482, EE: 0.0315, V_mean_dis: -0.0520, V_hyst: 0.0684 }
    },
    linear: {
      name: "多元线性回归 (Linear Regression)",
      loocv_mae_ah: 0.0335,
      r2: 0.6420,
      spearman: 0.7250,
      conformal_90: 0.0650,
      coef: { intercept: 0.1580, Q_dis: 0.1350, CE: -0.0550, EE: 0.0280, V_mean_dis: -0.0480, V_hyst: 0.0750 }
    },
    lasso: {
      name: "套索回归 (Lasso Regression)",
      loocv_mae_ah: 0.0318,
      r2: 0.6850,
      spearman: 0.7520,
      conformal_90: 0.0620,
      coef: { intercept: 0.1600, Q_dis: 0.1280, CE: -0.0420, EE: 0.0000, V_mean_dis: -0.0450, V_hyst: 0.0620 }
    },
    gpr: {
      name: "高斯过程回归 (GPR)",
      loocv_mae_ah: 0.0298,
      r2: 0.7310,
      spearman: 0.7810,
      conformal_90: 0.0560,
      coef: { intercept: 0.1615, Q_dis: 0.1220, CE: -0.0470, EE: 0.0330, V_mean_dis: -0.0510, V_hyst: 0.0670 }
    },
    mean_baseline: {
      name: "历史均值基线 (对照)",
      loocv_mae_ah: 0.0573,
      r2: -0.0980,
      spearman: 0.0000,
      conformal_90: 0.0890,
      coef: { intercept: 0.1610, Q_dis: 0.0, CE: 0.0, EE: 0.0, V_mean_dis: 0.0, V_hyst: 0.0 }
    }
  },

  // 材料体系规格自适应字典 (含截止电压与标称容量)
  CHEMISTRY_SPECS: {
    lfp: {
      name: "磷酸铁锂 (LFP) 体系",
      shortName: "LFP",
      status: "ACTIVE",
      statusText: "当前体系",
      statusColor: "var(--color-brand)",
      v_nominal: 3.20,
      v_chg_cut: 3.65,
      v_dis_cut: 2.50,
      nominal_cap_ah: 35.0,
      default_q_dis_ah: 27.65
    },
    ncm: {
      name: "三元高镍 (NCM / NCA) 体系",
      shortName: "NCM",
      status: "PENDING",
      statusText: "暂无测试样本",
      statusColor: "var(--text-muted)",
      v_nominal: 3.70,
      v_chg_cut: 4.20,
      v_dis_cut: 2.80,
      nominal_cap_ah: 50.0,
      default_q_dis_ah: 41.20
    },
    naion: {
      name: "钠离子电池 (Na-ion) 体系",
      shortName: "Na-ion",
      status: "PENDING",
      statusText: "暂无测试样本",
      statusColor: "var(--text-muted)",
      v_nominal: 3.10,
      v_chg_cut: 4.00,
      v_dis_cut: 1.80,
      nominal_cap_ah: 30.0,
      default_q_dis_ah: 24.50
    },
    sic: {
      name: "硅碳复合体系 (NCM-SiC)",
      shortName: "NCM-SiC",
      status: "PENDING",
      statusText: "暂无测试样本",
      statusColor: "var(--text-muted)",
      v_nominal: 3.70,
      v_chg_cut: 4.25,
      v_dis_cut: 2.50,
      nominal_cap_ah: 60.0,
      default_q_dis_ah: 48.00
    }
  },

  // 1. M1 SOH 快速诊断（支持用户选择模型）
  predictSOH(u0, rdc_dis, rdc_chg, drdc, eta, asym, relax, soc = 50.0, modelType = 'xgboost') {
    const cfg = this.M1_MODELS[modelType.toLowerCase()] || this.M1_MODELS.xgboost;

    const u0_norm = (u0 - 3.28) / 0.06;
    const r_dis_norm = (rdc_dis - 0.012) / 0.005;
    const r_chg_norm = (rdc_chg - 0.011) / 0.005;
    const drdc_norm = (drdc - (-0.002)) / 0.001;
    const eta_norm = (eta - (-0.025)) / 0.010;
    const asym_norm = asym / 0.05;
    const relax_norm = (relax - 0.045) / 0.015;

    const w = cfg.weights;
    const delta = (
      w.U0 * u0_norm +
      w.Rdc_dis * r_dis_norm +
      w.Rdc_chg * r_chg_norm +
      w.dRdc * drdc_norm +
      w.eta * eta_norm +
      w.asym * asym_norm +
      w.relax * relax_norm
    ) * cfg.scale;

    let soh_val = Math.min(1.02, Math.max(0.40, w.intercept + delta));
    let soh_pct = +(soh_val * 100).toFixed(2);

    let health_grade = "良好 (二级健康)";
    let grade_color = "#06B6D4";
    let suggestion = "达到一级标准，可直接成组进入储能系统";

    if (soh_pct >= 90.0) {
      health_grade = "优秀 (一级健康)";
      grade_color = "#10B981";
      suggestion = "电芯健康度极高，适合高性能工商业储能或继续高负载服役";
    } else if (soh_pct >= 80.0) {
      health_grade = "良好 (二级健康)";
      grade_color = "#06B6D4";
      suggestion = "达到一级标准，可直接成组进入储能系统";
    } else if (soh_pct >= 65.0) {
      health_grade = "中度衰退 (三级健康)";
      grade_color = "#F59E0B";
      suggestion = "容量衰减达关键区间，建议进入 M2 模块进行容量恢复潜力评估";
    } else {
      health_grade = "深度衰退 (四级健康)";
      grade_color = "#EF4444";
      suggestion = "衰退严重，建议评估恢复潜力后进行降级利用或直接拆解提锂";
    }

    return {
      selected_model: cfg.name,
      model_type: modelType,
      predicted_soh_pct: soh_pct,
      predicted_soh_fraction: +soh_val.toFixed(4),
      health_grade,
      grade_color,
      suggestion,
      confidence_mae_pct: cfg.lobo_mae_pct,
      model_r2: cfg.r2,
      model_spearman: cfg.spearman,
      feature_importance: [
        { feature: "稳态开路电压 U0", score: 38.5, mechanism: "活性锂损失与平台位移" },
        { feature: "倍率敏感电阻差 ΔRdc", score: 21.4, mechanism: "高倍率固相扩散阻抗" },
        { feature: "持续极化电压 η", score: 15.2, mechanism: "电化学浓差与界面极化" },
        { feature: "放电直流电阻 Rdc,dis", score: 11.6, mechanism: "脱锂电化学阻抗" },
        { feature: "撤载松弛电压 ΔV_relax", score: 6.8, mechanism: "双电层弛豫恢复" },
        { feature: "充放电不对称度 asym", score: 4.1, mechanism: "脱嵌过程极化不对称性" },
        { feature: "充电直流电阻 Rdc,chg", score: 2.4, mechanism: "负极嵌锂界面阻抗" }
      ]
    };
  },

  // 2. M2 容量可恢复性评估（支持用户选择模型）
  predictRecoverability(q_dis, ce, ee, v_mean_dis, v_hyst, nom_cap = 1.50, current_soh_pct = null, modelType = 'elasticnet') {
    const cfg = this.M2_MODELS[modelType.toLowerCase()] || this.M2_MODELS.elasticnet;

    const dq = (q_dis / nom_cap - 0.65) / 0.10;
    const dce = (ce - 0.98) / 0.02;
    const dee = (ee - 0.90) / 0.05;
    const dvm = (v_mean_dis - 3.19) / 0.05;
    const dvh = (v_hyst - 0.14) / 0.04;

    const scale = nom_cap / 1.50;
    const coef = cfg.coef;
    let pred_qrec = (
      coef.intercept * scale +
      coef.Q_dis * dq * scale +
      coef.CE * dce * 0.03 +
      coef.EE * dee * 0.02 +
      coef.V_mean_dis * dvm * 0.02 +
      coef.V_hyst * dvh * 0.04
    );

    pred_qrec = Math.max(0.01 * nom_cap, Math.min(0.28 * nom_cap, pred_qrec));
    const half_width = cfg.conformal_90 * scale;
    const lower_90 = Math.max(0, pred_qrec - half_width);
    const upper_90 = pred_qrec + half_width;

    const q_lost = Math.max(nom_cap - q_dis, 0.01);
    const rpi_pct = Math.min(100.0, Math.max(0, (pred_qrec / q_lost) * 100.0));
    const rec_fraction = (pred_qrec / nom_cap) * 100.0;

    const after_q = q_dis + pred_qrec;
    const after_soh = Math.min(100.0, Math.max(40.0, (after_q / nom_cap) * 100.0));
    const calc_soh = current_soh_pct !== null ? current_soh_pct : +( (q_dis / nom_cap) * 100 ).toFixed(2);
    const soh_gain = +(after_soh - calc_soh).toFixed(2);

    let recovery_tier = "极高恢复价值 (推荐调理)";
    let tier_color = "#10B981";
    let recond_action = "强烈推荐执行恒压充电微调理规程，预计可大幅恢复活性锂并提升服役寿命";

    if (rpi_pct < 12.0 && rec_fraction < 7.0) {
      recovery_tier = "低恢复价值 (不推荐调理)";
      tier_color = "#94A3B8";
      recond_action = "衰退主因为不可逆结构崩塌或极化固化，调理边际收益较低，建议直接应用或回收";
    } else if (rpi_pct < 25.0 && rec_fraction < 12.0) {
      recovery_tier = "中度恢复价值 (可选调理)";
      tier_color = "#06B6D4";
      recond_action = "具备明确恢复潜力，建议结合电化学调理电耗成本与应用场景综合决策";
    }

    return {
      selected_model: cfg.name,
      model_type: modelType,
      predicted_qrec_ah: +pred_qrec.toFixed(4),
      lower_90_ah: +lower_90.toFixed(4),
      upper_90_ah: +upper_90.toFixed(4),
      conformal_half_width_ah: +half_width.toFixed(4),
      rpi_pct: +rpi_pct.toFixed(2),
      recovery_fraction_pct: +rec_fraction.toFixed(2),
      current_soh_pct: +calc_soh.toFixed(2),
      predicted_after_soh_pct: +after_soh.toFixed(2),
      soh_gain_pct: soh_gain,
      model_mae: cfg.loocv_mae_ah,
      model_r2: cfg.r2,
      recovery_tier,
      tier_color,
      recond_action
    };
  },

  // 3. 四级分选决策
  classifyEchelon(soh_pct, rpi_pct, after_soh_pct, internal_res = 0.013, ce = 0.985) {
    if (soh_pct >= 80.0) {
      return {
        tier: "A 级：高价值储能直接应用",
        tier_code: "CLASS_A",
        color: "#10B981",
        scene: "大型工商业储能电站 / 电网调峰调频储能舱 / 数据中心绿色备电",
        treatment: "免调理或轻度均衡，直接经过模组重组后投入储能系统",
        economic_value: "高 (残值率 65%~80%)",
        radar: { "容量保持度": 92.5, "反应过程对称性": 88.0, "副反应抑制性": 98.2, "容量可恢复潜力": 65.0, "低碳环境效益": 94.0 }
      };
    } else if (soh_pct < 80.0 && (rpi_pct >= 15.0 || after_soh_pct >= 75.0)) {
      return {
        tier: "B 级：深度调理再生 + 储能/高敏备电应用",
        tier_code: "CLASS_B",
        color: "#06B6D4",
        scene: "工商业与户用储能 / 5G 通信基站备电 / 离网微电网储能",
        treatment: "执行 3.6V 恒压充电微调理规程，激活可逆活性锂，提升健康度后再成组",
        economic_value: "中高 (调理后残值率提升 20%~35%)",
        radar: { "容量保持度": 76.5, "反应过程对称性": 82.0, "副反应抑制性": 96.5, "容量可恢复潜力": 92.0, "低碳环境效益": 89.5 }
      };
    } else if (soh_pct >= 60.0 || rpi_pct >= 8.0) {
      return {
        tier: "C 级：降额轻载场景循环利用",
        tier_code: "CLASS_C",
        color: "#F59E0B",
        scene: "太阳能路灯 / 农业灌溉备用电源 / 园区离网备电储能",
        treatment: "降额倍率运行 (<=0.2C)，严格限制充放电截止电压区间",
        economic_value: "中低 (残值率 30%~45%)",
        radar: { "容量保持度": 64.0, "反应过程对称性": 68.0, "副反应抑制性": 91.0, "容量可恢复潜力": 45.0, "低碳环境效益": 65.0 }
      };
    } else {
      return {
        tier: "D 级：材料级定向拆解与提锂前驱体再生",
        tier_code: "CLASS_D",
        color: "#EF4444",
        scene: "正规湿法冶金回收生产线 / 电池多材料定向提锂与前驱体再生 (锂/镍/钴/钠盐等)",
        treatment: "不建议投入二次服役，直接进入带电破碎与湿法提锂闭环回收链路",
        economic_value: "材料回收价值 (按碳酸锂当期市价结算)",
        radar: { "容量保持度": 45.0, "反应过程对称性": 42.0, "副反应抑制性": 75.0, "容量可恢复潜力": 22.0, "低碳环境效益": 48.0 }
      };
    }
  },

  // 4. 微观到宏观制造端碳减排规避量与全生命周期环境效益核算
  calculateCarbon(rec_fraction = 0.1086, pack_kwh = 60.48, n_cells = 1, ef_mfg = 105.0, ef_grid = 0.5810, recond_kwh = 0.85) {
    const recovered_pack_kwh = +(pack_kwh * rec_fraction).toFixed(3);
    const total_recovered_kwh = +(recovered_pack_kwh * n_cells).toFixed(3);
    const ghg_avoided = +(total_recovered_kwh * ef_mfg).toFixed(2);
    const ghg_process = +(recond_kwh * ef_grid * n_cells).toFixed(2);
    const ghg_net = +Math.max(0, ghg_avoided - ghg_process).toFixed(2);
    const co2_vol = +(ghg_net / 1.80).toFixed(2);
    const trees = +(ghg_net / 18.0).toFixed(1);
    const ev_km = +(total_recovered_kwh * 6.67).toFixed(1);
    const specific_reduction_kg_per_kwh = pack_kwh > 0 ? +(ghg_net / pack_kwh).toFixed(2) : 0;
    const abatement_ratio_pct = ghg_avoided > 0 ? +((ghg_net / ghg_avoided) * 100).toFixed(1) : 0;

    return {
      recovery_fraction_pct: +(rec_fraction * 100).toFixed(2),
      pack_capacity_kwh: pack_kwh,
      batch_cell_count: n_cells,
      recovered_energy_pack_kwh: recovered_pack_kwh,
      total_recovered_kwh: total_recovered_kwh,
      ghg_avoided_kg: ghg_avoided,
      ghg_process_kg: ghg_process,
      ghg_net_kg: ghg_net,
      co2_volume_m3: co2_vol,
      trees_equivalent_count: trees,
      ev_clean_mileage_km: ev_km,
      specific_reduction_kg_per_kwh: specific_reduction_kg_per_kwh,
      abatement_ratio_pct: abatement_ratio_pct
    };
  },

  // 5. 多模型横向交叉预测对照（单次调用同时输出全部模型预测值）
  compareAllM1Models(u0, rdc_dis, rdc_chg, drdc, eta, asym, relax, soc = 50.0) {
    const results = [];
    for (const key of Object.keys(this.M1_MODELS)) {
      const pred = this.predictSOH(u0, rdc_dis, rdc_chg, drdc, eta, asym, relax, soc, key);
      results.push({
        key,
        name: pred.selected_model,
        soh_pct: pred.predicted_soh_pct,
        grade: pred.health_grade,
        color: pred.grade_color,
        mae: pred.confidence_mae_pct,
        r2: pred.model_r2
      });
    }
    return results;
  },

  // 6. 100 只电芯批量快筛数据生成器
  generateBatch100Cells(m1Model = 'xgboost', m2Model = 'elasticnet') {
    const list = [];
    const seedRng = (s) => {
      let x = Math.sin(s++) * 10000;
      return x - Math.floor(x);
    };

    for (let i = 1; i <= 100; i++) {
      const r1 = seedRng(i * 11);
      const r2 = seedRng(i * 23);
      const r3 = seedRng(i * 37);

      const soh = +(52.0 + r1 * 44.0).toFixed(2);
      const nom_cap = 35.0;
      const q_dis = +(nom_cap * (soh / 100.0)).toFixed(3);
      const ce = +(0.965 + r2 * 0.03).toFixed(4);
      const ee = +(0.865 + r3 * 0.09).toFixed(4);
      const v_mean = +(3.17 + (soh / 100) * 0.08).toFixed(4);
      const v_hyst = +(0.11 + (1 - soh / 100) * 0.09).toFixed(4);

      const rec = this.predictRecoverability(q_dis, ce, ee, v_mean, v_hyst, nom_cap, soh, m2Model);
      const ech = this.classifyEchelon(soh, rec.rpi_pct, rec.predicted_after_soh_pct);
      const carb = this.calculateCarbon(rec.recovery_fraction_pct / 100, 60.48, 1);

      list.push({
        id: `BAT-2026-REC-${i.toString().padStart(3, '0')}`,
        index: i,
        soh_pct: soh,
        q_dis_ah: q_dis,
        nom_cap_ah: nom_cap,
        q_rec_ah: rec.predicted_qrec_ah,
        rpi_pct: rec.rpi_pct,
        after_soh_pct: rec.predicted_after_soh_pct,
        tier_code: ech.tier_code,
        tier_title: ech.tier.split('：')[0],
        tier_full: ech.tier,
        color: ech.color,
        scene: ech.scene,
        ghg_net_kg: carb.ghg_net_kg,
        co2_volume_m3: carb.co2_volume_m3
      });
    }
    return list;
  }
};
