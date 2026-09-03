/**
 * 焕芯·电愈智策 核心应用逻辑 (100% 就地即时交互，无任何跳转干扰)
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. 初始化时钟
  const clockEl = document.getElementById('systemClock');
  const updateClock = () => {
    if (clockEl) {
      const now = new Date();
      clockEl.textContent = now.toLocaleTimeString('zh-CN', { hour12: false });
    }
  };
  setInterval(updateClock, 1000);
  updateClock();

  // 2. 主题切换逻辑
  const themePills = document.querySelectorAll('.btn-theme-pill');
  themePills.forEach(pill => {
    pill.addEventListener('click', () => {
      themePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const theme = pill.getAttribute('data-theme');
      document.documentElement.setAttribute('data-theme', theme);
      ChartManager.setTheme(theme);
    });
  });

  // 3. 主标签页切换
  const tabBtns = document.querySelectorAll('.nav-tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.add('active');
      }
      setTimeout(() => ChartManager.resizeAll(), 50);
    });
  });

  // 4. 六阶流程导航条切换
  const stepBtns = document.querySelectorAll('.pipeline-step');
  stepBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      stepBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tabTarget = btn.getAttribute('data-tab-target');
      if (tabTarget) {
        const correspondingNavBtn = document.querySelector(`.nav-tab-btn[data-tab="${tabTarget}"]`);
        if (correspondingNavBtn) correspondingNavBtn.click();
      }
    });
  });

  // 5. 高级物理特征折叠抽屉
  window.toggleAccordion = function(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.toggle('open');
      const toggleBtn = document.getElementById('accordionToggleBtn');
      if (toggleBtn) {
        toggleBtn.innerHTML = el.classList.contains('open') 
          ? '<span>⚙️ 收起 8 项微观电化学物理特征</span><span>▲</span>' 
          : '<span>⚙️ 展开 8 项微观电化学物理特征配置</span><span>▼</span>';
      }
    }
  };

  // 6. 实时示波器
  const osc = new RealtimeOscilloscope('realtimeCanvas', 'oscilloscopeHud');
  const btnToggleOsc = document.getElementById('btnToggleOsc');
  if (btnToggleOsc) {
    btnToggleOsc.addEventListener('click', () => {
      const running = osc.toggle();
      btnToggleOsc.textContent = running ? '暂停示波器' : '继续波形采样';
    });
  }

  window.injectPulse = function(type) {
    osc.injectProtocol(type);
    if (type === 'chg_05c') {
      document.getElementById('inputRdcChg').value = 0.0118;
    } else if (type === 'dis_10c') {
      document.getElementById('inputRdcDis').value = 0.0132;
    } else if (type === 'dis_20c') {
      document.getElementById('inputDrdc').value = -0.0028;
    }
    runFullEvaluation();
  };

  // 7. 通道切换
  const channelBtns = document.querySelectorAll('.channel-btn');
  channelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      channelBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const ch = btn.getAttribute('data-ch');
      osc.setChannel(ch);
    });
  });

  // 8. 生成 100 只电芯矩阵与批量数据
  let batch100 = CalculationEngine.generateBatch100Cells();
  let currentFilter = 'ALL';
  let activeCellId = 'BAT-2026-REC-001';

  function renderPackMatrix() {
    const grid = document.getElementById('packCellsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    batch100.forEach(c => {
      const chip = document.createElement('div');
      chip.className = `cell-chip ${c.tier_code.toLowerCase().replace('_', '-')}`;
      if (c.id === activeCellId) {
        chip.classList.add('active-cell');
      }
      chip.textContent = c.index;
      chip.title = `${c.id} | SOH: ${c.soh_pct}% | 评级: ${c.tier_title} | 恢复量: ${c.q_rec_ah}Ah (点击立即就地分析)`;
      
      // 点击任意电芯：100% 保持在当前工作台，绝对不跳页！
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        activeCellId = c.id;
        document.querySelectorAll('.cell-chip').forEach(el => el.classList.remove('active-cell'));
        chip.classList.add('active-cell');

        // 设置当前电芯参数
        document.getElementById('inputCellId').value = c.id;
        document.getElementById('inputQDis').value = c.q_dis_ah;
        document.getElementById('inputNomCap').value = c.nom_cap_ah;
        
        // 联动更新微观 8 项特征，使 M1 与 M2 精准反映该电芯
        const sohFrac = c.soh_pct / 100.0;
        document.getElementById('inputU0').value = +(3.265 + sohFrac * 0.058).toFixed(4);
        document.getElementById('inputRdcDis').value = +(0.0185 - sohFrac * 0.0075).toFixed(4);
        document.getElementById('inputRdcChg').value = +(0.0195 - sohFrac * 0.0070).toFixed(4);
        document.getElementById('inputDrdc').value = +(-0.0040 + sohFrac * 0.0018).toFixed(4);
        document.getElementById('inputEta').value = +(-0.040 + sohFrac * 0.016).toFixed(4);
        document.getElementById('inputAsym').value = +(-0.080 + sohFrac * 0.035).toFixed(4);
        document.getElementById('inputRelax').value = +(0.070 - sohFrac * 0.020).toFixed(4);

        // 立即就地运算并驱动表盘
        runFullEvaluation();

        // 给 SOH 仪表盘卡片一个微光发光提醒，指示已成功就地更新
        const gaugeBox = document.getElementById('sohGaugeChart');
        if (gaugeBox && gaugeBox.parentElement) {
          gaugeBox.parentElement.style.transition = 'box-shadow 0.3s ease';
          gaugeBox.parentElement.style.boxShadow = '0 0 20px var(--color-brand)';
          setTimeout(() => {
            gaugeBox.parentElement.style.boxShadow = '';
          }, 600);
        }
      });
      grid.appendChild(chip);
    });
  }

  function renderBatchTable() {
    const tbody = document.getElementById('batchTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const filtered = batch100.filter(c => {
      if (currentFilter === 'ALL') return true;
      return c.tier_code === currentFilter;
    });

    filtered.slice(0, 50).forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${c.id}</strong></td>
        <td><span style="color:var(--color-brand); font-weight:bold;">${c.soh_pct}%</span></td>
        <td>${c.q_dis_ah} Ah</td>
        <td><strong style="color:var(--color-green);">+${c.q_rec_ah} Ah</strong></td>
        <td>${c.rpi_pct}%</td>
        <td><span style="color:${c.color}; font-weight:bold;">${c.tier_full}</span></td>
        <td>${c.ghg_net_kg} kg</td>
      `;
      tbody.appendChild(tr);
    });
  }

  const filterPills = document.querySelectorAll('.filter-pill');
  filterPills.forEach(p => {
    p.addEventListener('click', () => {
      filterPills.forEach(x => x.classList.remove('active'));
      p.classList.add('active');
      currentFilter = p.getAttribute('data-filter');
      renderBatchTable();
    });
  });

  window.exportBatchCSV = function() {
    let csv = '电芯编号,当前SOH(%),当前放电容量(Ah),预估恢复容量(Ah),恢复潜力RPI(%),循环再生定级,净碳减排量(kgCO2e)\n';
    batch100.forEach(c => {
      csv += `${c.id},${c.soh_pct},${c.q_dis_ah},${c.q_rec_ah},${c.rpi_pct},${c.tier_full},${c.ghg_net_kg}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '100只多体系电芯循环再生批量分选与碳量化结果.csv';
    link.click();
  };

  let prevValues = {
    soh: null,
    afterSoh: null
  };

  function animateValue(id, start, end, duration, decimal = 2, suffix = '') {
    const obj = document.getElementById(id);
    if (!obj) return;
    if (Math.abs(start - end) < 0.0001) {
      obj.textContent = end.toFixed(decimal) + suffix;
      return;
    }
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = (progress * (end - start) + start).toFixed(decimal);
      obj.textContent = current + suffix;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  // 8.5 材料体系切换与参数自适应处理器
  function handleChemistryChange(updateInputs = true) {
    const chemKey = document.getElementById('selBatteryChemistry')?.value || 'lfp';
    const spec = CalculationEngine.CHEMISTRY_SPECS[chemKey] || CalculationEngine.CHEMISTRY_SPECS.lfp;

    if (updateInputs) {
      if (document.getElementById('inputVNom')) document.getElementById('inputVNom').value = spec.v_nominal;
      if (document.getElementById('inputVChgCut')) document.getElementById('inputVChgCut').value = spec.v_chg_cut;
      if (document.getElementById('inputVDisCut')) document.getElementById('inputVDisCut').value = spec.v_dis_cut;
      if (document.getElementById('inputNomCap')) document.getElementById('inputNomCap').value = spec.nominal_cap_ah;
      if (document.getElementById('inputQDis')) document.getElementById('inputQDis').value = spec.default_q_dis_ah;
    }

    // 状态徽标联动
    const statusBadge = document.getElementById('chemStatusBadge');
    if (statusBadge) {
      statusBadge.textContent = spec.statusText;
      statusBadge.style.color = spec.statusColor;
    }

    // 右侧看板联动：铁锂显示活跃看板，非铁锂未接入数据时干净留白
    const activeBoard = document.getElementById('dashboardActiveContent');
    const blankBoard = document.getElementById('dashboardPendingBlankState');
    if (spec.status === 'ACTIVE') {
      if (activeBoard) activeBoard.style.display = 'flex';
      if (blankBoard) blankBoard.style.display = 'none';
    } else {
      if (activeBoard) activeBoard.style.display = 'none';
      if (blankBoard) {
        blankBoard.style.display = 'flex';
        const titleEl = document.getElementById('blankStateChemTitle');
        if (titleEl) titleEl.textContent = `【${spec.name}】`;
        if (document.getElementById('blankStateVNom')) document.getElementById('blankStateVNom').textContent = `${spec.v_nominal} V`;
        if (document.getElementById('blankStateVChg')) document.getElementById('blankStateVChg').textContent = `${spec.v_chg_cut} V`;
        if (document.getElementById('blankStateVDis')) document.getElementById('blankStateVDis').textContent = `${spec.v_dis_cut} V`;
        if (document.getElementById('blankStateNomCap')) document.getElementById('blankStateNomCap').textContent = `${spec.nominal_cap_ah} Ah`;
      }
    }
  }

  window.switchToVerifiedLFP = function() {
    const sel = document.getElementById('selBatteryChemistry');
    if (sel) {
      sel.value = 'lfp';
      handleChemistryChange(true);
      runFullEvaluation();
    }
  };

  // 9. 全流程计算与视图更新 (100% 保持在当前页面)
  window.runFullEvaluation = function() {
    const u0 = parseFloat(document.getElementById('inputU0').value) || 3.3116;
    const rdc_dis = parseFloat(document.getElementById('inputRdcDis').value) || 0.0124;
    const rdc_chg = parseFloat(document.getElementById('inputRdcChg').value) || 0.0138;
    const drdc = parseFloat(document.getElementById('inputDrdc').value) || -0.0026;
    const eta = parseFloat(document.getElementById('inputEta').value) || -0.0273;
    const asym = parseFloat(document.getElementById('inputAsym').value) || -0.0521;
    const relax = parseFloat(document.getElementById('inputRelax').value) || 0.0537;
    const soc = parseFloat(document.getElementById('inputSOC').value) || 50.0;

    const nom_cap = parseFloat(document.getElementById('inputNomCap')?.value) || 35.0;
    const v_nom = parseFloat(document.getElementById('inputVNom')?.value) || 3.20;
    const v_chg_cut = parseFloat(document.getElementById('inputVChgCut')?.value) || 3.65;
    const v_dis_cut = parseFloat(document.getElementById('inputVDisCut')?.value) || 2.50;

    const q_dis = parseFloat(document.getElementById('inputQDis')?.value) || +(nom_cap * 0.79).toFixed(2);
    const ce = parseFloat(document.getElementById('inputCE')?.value) || 0.9842;
    const ee = parseFloat(document.getElementById('inputEE')?.value) || 0.8950;
    const v_mean = parseFloat(document.getElementById('inputVMean')?.value) || 3.195;
    const v_hyst = parseFloat(document.getElementById('inputVHyst')?.value) || 0.1420;

    const selM1 = document.getElementById('selM1Model')?.value || 'xgboost';
    const selM2 = document.getElementById('selM2Model')?.value || 'elasticnet';

    // 1. M1 SOH 诊断
    const m1Res = CalculationEngine.predictSOH(u0, rdc_dis, rdc_chg, drdc, eta, asym, relax, soc, selM1);
    
    const oldSoh = prevValues.soh !== null ? prevValues.soh : m1Res.predicted_soh_pct;
    animateValue('valSOH', oldSoh, m1Res.predicted_soh_pct, 200, 2, '%');
    prevValues.soh = m1Res.predicted_soh_pct;

    document.getElementById('valHealthGrade').textContent = m1Res.health_grade;
    document.getElementById('valHealthGrade').style.color = m1Res.grade_color;

    const isM1Rec = m1Res.selected_model.includes('[推荐]');
    if (document.getElementById('dashKpiSohMae')) {
      document.getElementById('dashKpiSohMae').textContent = m1Res.selected_model.replace(/\[.*\]/, '').trim();
    }
    if (document.getElementById('dashKpiSohUnit')) {
      document.getElementById('dashKpiSohUnit').textContent = isM1Rec ? '[推荐]' : '[已选]';
    }
    if (document.getElementById('badgeSelectedM1')) {
      document.getElementById('badgeSelectedM1').textContent = isM1Rec ? '推荐算法' : '备选对照';
      document.getElementById('badgeSelectedM1').className = `kpi-badge ${isM1Rec ? 'success' : 'info'}`;
    }

    // 刷新 SOH 仪表盘
    ChartManager.renderSohGauge('sohGaugeChart', m1Res.predicted_soh_pct);

    // 2. M2 容量恢复预估
    const m2Res = CalculationEngine.predictRecoverability(q_dis, ce, ee, v_mean, v_hyst, nom_cap, m1Res.predicted_soh_pct, selM2);
    document.getElementById('valQrec').textContent = m2Res.predicted_qrec_ah + ' Ah';
    document.getElementById('valConformalBound').textContent = `[ ${m2Res.lower_90_ah} ~ ${m2Res.upper_90_ah} ]`;
    document.getElementById('valRPI').textContent = m2Res.rpi_pct + '%';
    
    const oldAfterSoh = prevValues.afterSoh !== null ? prevValues.afterSoh : m2Res.predicted_after_soh_pct;
    animateValue('valAfterSOH', oldAfterSoh, m2Res.predicted_after_soh_pct, 200, 2, '%');
    prevValues.afterSoh = m2Res.predicted_after_soh_pct;

    const isM2Rec = m2Res.selected_model.includes('[推荐]');
    if (document.getElementById('dashKpiQrecMae')) {
      document.getElementById('dashKpiQrecMae').textContent = m2Res.selected_model.replace(/\[.*\]/, '').trim();
    }
    if (document.getElementById('dashKpiQrecUnit')) {
      document.getElementById('dashKpiQrecUnit').textContent = isM2Rec ? '[推荐]' : '[已选]';
    }
    if (document.getElementById('badgeSelectedM2')) {
      document.getElementById('badgeSelectedM2').textContent = isM2Rec ? '推荐算法' : '备选对照';
      document.getElementById('badgeSelectedM2').className = `kpi-badge ${isM2Rec ? 'info' : 'warning'}`;
    }

    // 3. 循环再生与二次服役定级决策
    const echRes = CalculationEngine.classifyEchelon(m1Res.predicted_soh_pct, m2Res.rpi_pct, m2Res.predicted_after_soh_pct, rdc_dis, ce);
    const tierCard = document.getElementById('echelonDecisionCard');
    if (tierCard) {
      tierCard.className = `tier-decision-card ${echRes.tier_code.toLowerCase().replace('_', '-')}`;
      document.getElementById('valEchelonTierTitle').textContent = echRes.tier;
      document.getElementById('valEchelonScene').textContent = echRes.scene;
      document.getElementById('valEchelonTreatment').textContent = echRes.treatment;
      document.getElementById('valEchelonEcoValue').textContent = echRes.economic_value;
    }
    ChartManager.renderEchelonRadar('echelonRadarChart', echRes.radar);
    ChartManager.renderM1ModelCompare('m1ModelCompareChart', selM1);

    // 4. 多模型横向对照矩阵
    const allM1 = CalculationEngine.compareAllM1Models(u0, rdc_dis, rdc_chg, drdc, eta, asym, relax, soc);
    const compTableBody = document.getElementById('multiModelCompareBody');
    if (compTableBody) {
      compTableBody.innerHTML = '';
      allM1.forEach(m => {
        const isCurrent = m.key === selM1.toLowerCase();
        const tr = document.createElement('tr');
        if (isCurrent) tr.style.background = 'rgba(0, 229, 255, 0.12)';
        tr.innerHTML = `
          <td><strong>${m.name}</strong> ${isCurrent ? '<span class="card-title-badge">当前使用</span>' : ''}</td>
          <td><strong style="color:${m.color}; font-size:13px;">${m.soh_pct}%</strong></td>
          <td>${m.grade}</td>
          <td>±${m.mae}%</td>
        `;
        compTableBody.appendChild(tr);
      });
    }

    // 5. M3 碳量化（以客观物理量与减碳强度衡量，不以微量金额作为衡量）
    const packKwh = +(nom_cap * v_nom * 100 / 1000).toFixed(2) || 60.48;
    document.getElementById('inputPackKwh').value = packKwh;
    const efMfg = parseFloat(document.getElementById('inputEfMfg').value) || 105.0;
    const efGrid = parseFloat(document.getElementById('inputEfGrid').value) || 0.5810;
    const nCells = parseInt(document.getElementById('inputBatchCount').value) || 1;

    const carbRes = CalculationEngine.calculateCarbon(m2Res.recovery_fraction_pct / 100.0, packKwh, nCells, efMfg, efGrid, 0.85);
    document.getElementById('valGhgAvoided').textContent = carbRes.ghg_avoided_kg + ' kg';
    document.getElementById('valGhgNet').textContent = carbRes.ghg_net_kg + ' kg';
    document.getElementById('valCo2Vol').textContent = carbRes.co2_volume_m3 + ' m³';
    document.getElementById('valTrees').textContent = carbRes.trees_equivalent_count + ' 棵';
    if (document.getElementById('valCarbonIntensity')) {
      document.getElementById('valCarbonIntensity').textContent = `${carbRes.specific_reduction_kg_per_kwh} kgCO₂e / kWh (减排率 ${carbRes.abatement_ratio_pct}%)`;
    }

    // 6. 生成报告
    const chemKey = document.getElementById('selBatteryChemistry')?.value || 'lfp';
    const spec = CalculationEngine.CHEMISTRY_SPECS[chemKey] || CalculationEngine.CHEMISTRY_SPECS.lfp;

    ReportGenerator.renderReport('reportContainer', {
      cell_id: document.getElementById('inputCellId').value || 'BAT-2026-REC-01',
      chemistry_name: spec.name,
      is_verified: spec.status === 'ACTIVE',
      nom_cap_ah: nom_cap,
      v_nominal: v_nom,
      v_chg_cut: v_chg_cut,
      v_dis_cut: v_dis_cut,
      soh_pct: m1Res.predicted_soh_pct,
      health_grade: m1Res.health_grade,
      selected_m1_model: m1Res.selected_model,
      selected_m2_model: m2Res.selected_model,
      predicted_qrec_ah: m2Res.predicted_qrec_ah,
      lower_90_ah: m2Res.lower_90_ah,
      upper_90_ah: m2Res.upper_90_ah,
      rpi_pct: m2Res.rpi_pct,
      recovery_fraction_pct: m2Res.recovery_fraction_pct,
      predicted_after_soh_pct: m2Res.predicted_after_soh_pct,
      soh_gain_pct: m2Res.soh_gain_pct,
      echelon_tier: echRes.tier,
      tier_color: echRes.color,
      application_scene: echRes.scene,
      recommended_treatment: echRes.treatment,
      ghg_avoided_kg: carbRes.ghg_avoided_kg,
      ghg_net_kg: carbRes.ghg_net_kg,
      co2_volume_m3: carbRes.co2_volume_m3,
      trees_equivalent: carbRes.trees_equivalent_count
    });
  };

  // 10. 监听模型选择切换与参数自由输入联动
  document.getElementById('selM1Model')?.addEventListener('change', () => runFullEvaluation());
  document.getElementById('selM2Model')?.addEventListener('change', () => runFullEvaluation());
  document.getElementById('selBatteryChemistry')?.addEventListener('change', () => {
    handleChemistryChange(true);
    runFullEvaluation();
  });

  // 监听电压截止与容量规格的手动修改 (支持额外自定义输入)
  ['inputNomCap', 'inputVNom', 'inputVChgCut', 'inputVDisCut', 'inputQDis', 'inputCE', 'inputEE', 'inputCellId'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => runFullEvaluation());
  });

  // 11. 样例快捷载入 (完全就地载入，绝不切页)
  window.loadPresetSample = function(type) {
    if (type === 'pulsebat') {
      document.getElementById('selBatteryChemistry').value = 'lfp';
      handleChemistryChange(true);
      document.getElementById('inputCellId').value = 'BAT-35Ah-01号';
      document.getElementById('inputNomCap').value = 35.0;
      document.getElementById('inputQDis').value = 27.65;
      document.getElementById('inputU0').value = 3.3116;
      document.getElementById('inputRdcDis').value = 0.0124;
      document.getElementById('inputRdcChg').value = 0.0138;
      document.getElementById('inputDrdc').value = -0.0026;
      document.getElementById('inputEta').value = -0.0273;
      document.getElementById('inputAsym').value = -0.0521;
      document.getElementById('inputRelax').value = 0.0537;
      document.getElementById('inputSOC').value = 50.0;
    } else if (type === 'recovery62') {
      document.getElementById('selBatteryChemistry').value = 'lfp';
      handleChemistryChange(true);
      document.getElementById('inputCellId').value = 'Cell-k2 (18650循环电芯)';
      document.getElementById('inputNomCap').value = 1.50;
      document.getElementById('inputQDis').value = 1.025;
      document.getElementById('inputCE').value = 0.9835;
      document.getElementById('inputEE').value = 0.8920;
      document.getElementById('inputVMean').value = 3.192;
      document.getElementById('inputVHyst').value = 0.1450;
    } else if (type === 'echelon_batch') {
      document.getElementById('selBatteryChemistry').value = 'lfp';
      handleChemistryChange(true);
      document.getElementById('inputCellId').value = 'BAT-2026-REC-058';
      document.getElementById('inputBatchCount').value = 100;
    }
    runFullEvaluation();
  };

  // 12. 初始渲染
  ChartManager.renderM1FeatureImportance('m1FeatureChart');
  ChartManager.renderM1ModelCompare('m1ModelCompareChart', 'xgboost');
  ChartManager.renderM2Conformal('m2ConformalChart');
  ChartManager.renderEchelonRadar('echelonRadarChart');
  ChartManager.renderCarbonWaterfall('carbonWaterfallChart');
  ChartManager.renderBatchDonut('batchDonutChart', { classA: 38, classB: 41, classC: 15, classD: 6 });

  handleChemistryChange(false);
  renderPackMatrix();
  renderBatchTable();
  runFullEvaluation();
});
