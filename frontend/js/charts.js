/**
 * ECharts 可视化图表配置与渲染器 (Phase 3 升级：现代化环形能量仪表盘，绝无文字重叠)
 */
const ChartManager = {
  charts: {},
  currentTheme: 'dark',

  setTheme(theme) {
    const chemKey = document.getElementById('selBatteryChemistry')?.value || 'lfp';
    const nomCap = parseFloat(document.getElementById('inputNomCap')?.value) || 35.0;
    this.renderM1FeatureImportance('m1FeatureChart', chemKey);
    this.renderM1ModelCompare('m1ModelCompareChart', document.getElementById('selM1Model')?.value || 'xgboost');
    this.renderM2Conformal('m2ConformalChart', nomCap);
    this.renderEchelonRadar('echelonRadarChart');
    this.renderCarbonWaterfall('carbonWaterfallChart');
    this.renderBatchDonut('batchDonutChart');
    this.renderSohGauge('sohGaugeChart', parseFloat(document.getElementById('valSOH')?.textContent) || 75.4);
    if (typeof VaultManager !== 'undefined' && VaultManager.currentRecords) {
      this.renderVaultHistoryChart('vaultHistoryChart', VaultManager.currentRecords);
    } else {
      this.renderVaultHistoryChart('vaultHistoryChart');
    }
  },

  getThemeOptions() {
    const isLight = this.currentTheme === 'light';
    return {
      textColor: isLight ? '#0F172A' : '#F8FAFC',
      subTextColor: isLight ? '#64748B' : '#94A3B8',
      splitLineColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
      chartTheme: isLight ? null : 'dark'
    };
  },

  initChart(domId, options) {
    if (typeof echarts === 'undefined') return null;
    const el = document.getElementById(domId);
    if (!el) return null;
    try {
      if (this.charts[domId]) {
        this.charts[domId].dispose();
      }
      const isLight = this.currentTheme === 'light';
      const chart = echarts.init(el, isLight ? null : 'dark', { renderer: 'canvas' });
      chart.setOption(options);
      this.charts[domId] = chart;
      return chart;
    } catch (e) {
      console.error('图表初始化异常:', domId, e);
      return null;
    }
  },

  resizeAll() {
    Object.values(this.charts).forEach(c => {
      try { if (c) c.resize(); } catch (e) {}
    });
  },

  // 0. SOH 现代化动态发光圆弧仪表盘 (高端无指针设计，数字居中发光，彻底消除重叠)
  renderSohGauge(domId, sohValue = 75.4) {
    const isLight = this.currentTheme === 'light';
    const val = +parseFloat(sohValue).toFixed(2);

    // 根据 SOH 动态匹配流光渐变色
    let colorGradient;
    if (val >= 85.0) {
      colorGradient = new echarts.graphic.LinearGradient(0, 0, 1, 0, [
        { offset: 0, color: '#06B6D4' },
        { offset: 1, color: '#10B981' }
      ]);
    } else if (val >= 70.0) {
      colorGradient = new echarts.graphic.LinearGradient(0, 0, 1, 0, [
        { offset: 0, color: '#3B82F6' },
        { offset: 1, color: '#00E5FF' }
      ]);
    } else if (val >= 60.0) {
      colorGradient = new echarts.graphic.LinearGradient(0, 0, 1, 0, [
        { offset: 0, color: '#F59E0B' },
        { offset: 1, color: '#FCD34D' }
      ]);
    } else {
      colorGradient = new echarts.graphic.LinearGradient(0, 0, 1, 0, [
        { offset: 0, color: '#DC2626' },
        { offset: 1, color: '#F87171' }
      ]);
    }

    const opt = {
      backgroundColor: 'transparent',
      series: [
        // 1. 底轨刻度圈
        {
          type: 'gauge',
          startAngle: 210,
          endAngle: -30,
          min: 0,
          max: 100,
          radius: '92%',
          center: ['50%', '52%'],
          splitNumber: 5,
          axisLine: {
            roundCap: true,
            lineStyle: {
              width: 12,
              color: [[1, isLight ? '#E2E8F0' : 'rgba(255,255,255,0.08)']]
            }
          },
          axisTick: { show: false },
          splitLine: {
            show: true,
            distance: -16,
            length: 4,
            lineStyle: { color: isLight ? '#94A3B8' : 'rgba(255,255,255,0.25)', width: 1.5 }
          },
          axisLabel: {
            distance: -18,
            color: isLight ? '#64748B' : '#94A3B8',
            fontSize: 9,
            formatter: (v) => v === 0 ? '0' : (v === 100 ? '100' : '')
          },
          pointer: { show: false },
          title: {
            show: true,
            offsetCenter: [0, '30%'],
            fontSize: 11,
            color: isLight ? '#64748B' : '#94A3B8'
          },
          detail: {
            valueAnimation: true,
            fontSize: 22,
            fontWeight: '900',
            fontFamily: 'Segoe UI, -apple-system, sans-serif',
            offsetCenter: [0, '-8%'],
            formatter: '{value}%',
            color: isLight ? '#0F172A' : '#FFFFFF'
          },
          data: [{ value: val, name: 'SOH 健康度' }]
        },
        // 2. 发光前景进度条
        {
          type: 'gauge',
          startAngle: 210,
          endAngle: -30,
          min: 0,
          max: 100,
          radius: '92%',
          center: ['50%', '52%'],
          progress: {
            show: true,
            roundCap: true,
            width: 12,
            itemStyle: {
              color: colorGradient,
              shadowBlur: isLight ? 4 : 10,
              shadowColor: val >= 80 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(0, 229, 255, 0.6)'
            }
          },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          pointer: { show: false },
          title: { show: false },
          detail: { show: false },
          data: [{ value: val }]
        }
      ]
    };
    return this.initChart(domId, opt);
  },

  // 1. M1 物理特征重要性得分排序柱状图 (支持依据选定材料体系动态呈现主导物理机制)
  renderM1FeatureImportance(domId, chemKey = 'lfp') {
    const t = this.getThemeOptions();
    const spec = (typeof CalculationEngine !== 'undefined' && CalculationEngine.CHEMISTRY_SPECS)
      ? (CalculationEngine.CHEMISTRY_SPECS[chemKey] || CalculationEngine.CHEMISTRY_SPECS.lfp)
      : null;
    const list = (spec && spec.feature_importance) ? spec.feature_importance : [
      { feature: "稳态开路电压 U₀", score: 38.5, mechanism: "两相转变平台位移与活性锂脱嵌损失" },
      { feature: "倍率敏感电阻差 ΔR_dc", score: 21.4, mechanism: "高倍率固相扩散阻抗增加" },
      { feature: "持续极化过电位 η", score: 15.2, mechanism: "电化学反应浓差与界面极化" },
      { feature: "放电直流阻抗 R_dc,dis", score: 11.6, mechanism: "正极脱锂电荷转移阻抗" },
      { feature: "撤载松弛电压 ΔU_relax", score: 6.8, mechanism: "双电层电荷弛豫恢复动力学" },
      { feature: "充放电不对称度 A_sym", score: 4.1, mechanism: "脱嵌动力学极化非对称性" },
      { feature: "充电直流阻抗 R_dc,chg", score: 2.4, mechanism: "负极石墨嵌锂界面阻抗" }
    ];

    const categories = list.map(item => item.feature);
    const dataVals = list.map(item => item.score);

    const opt = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const p = params[0];
          const matched = list.find(x => x.feature === p.name);
          const mech = matched && matched.mechanism ? `<br><span style="color:#00E5FF; font-size:11px;">主导物理机制: ${matched.mechanism}</span>` : '';
          return `${p.name}: 贡献权重 <b>${p.value}%</b>${mech}`;
        }
      },
      grid: { top: 15, right: 35, bottom: 15, left: 165 },
      xAxis: {
        type: 'value',
        name: '特征贡献度 (%)',
        splitLine: { lineStyle: { color: t.splitLineColor } }
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: categories,
        axisLabel: { color: t.textColor, fontSize: 11 }
      },
      series: [{
        name: '特征贡献度',
        type: 'bar',
        data: dataVals,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#0284C7' },
            { offset: 1, color: '#00E5FF' }
          ]),
          borderRadius: [0, 4, 4, 0]
        },
        label: { show: true, position: 'right', formatter: '{c}%', color: t.textColor }
      }]
    };
    return this.initChart(domId, opt);
  },

  // 2. M1 多算法 LOBO 误差横向对比
  renderM1ModelCompare(domId, selectedModel = 'xgboost') {
    const t = this.getThemeOptions();
    const modelKeys = ['xgboost', 'random_forest', 'ridge', 'pls', 'svr', 'mean_baseline'];
    const modelNames = ['统一XGBoost', '随机森林', '岭回归', '偏最小二乘', 'SVR回归', '均值参考基准'];
    const maeVals = [2.85, 3.12, 3.45, 3.68, 3.30, 4.52];

    const barData = modelKeys.map((k, idx) => {
      const isSelected = k === selectedModel.toLowerCase();
      return {
        value: maeVals[idx],
        itemStyle: {
          color: isSelected ? '#00E5FF' : (idx === 0 ? '#10B981' : (idx === 5 ? '#EF4444' : '#3B82F6')),
          borderWidth: isSelected ? 2 : 0,
          borderColor: '#FFFFFF',
          shadowColor: isSelected ? 'rgba(0, 229, 255, 0.8)' : 'transparent',
          shadowBlur: isSelected ? 10 : 0
        }
      };
    });

    const opt = {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', formatter: '{b}: LOBO MAE = {c}%' },
      grid: { top: 25, right: 15, bottom: 35, left: 45 },
      xAxis: {
        type: 'category',
        data: modelNames,
        axisLabel: { color: t.subTextColor, interval: 0, fontSize: 10.5 }
      },
      yAxis: {
        type: 'value',
        name: 'LOBO MAE (%)',
        splitLine: { lineStyle: { color: t.splitLineColor } }
      },
      series: [{
        name: '留一电芯绝对误差',
        type: 'bar',
        data: barData,
        barWidth: '38%',
        label: { show: true, position: 'top', formatter: '{c}%', color: t.textColor, fontWeight: 'bold' }
      }]
    };
    return this.initChart(domId, opt);
  },

  // 3. M2 逐电芯恢复容量预测值与 90% 保角预测区间 (随当前电芯标称容量与体系自适应缩放)
  renderM2Conformal(domId, nomCap = 35.0) {
    const t = this.getThemeOptions();
    const cellNames = ['72', 'Cella', 'CellG', 'CellJ', 'CellT', 'Cellf', 'Cellg2', 'Cellh2', 'Cellj2', 'Cellk2', 'Celll2', 'Cellm', 'Cello', 'Cellp2', 'Cellq2', 'Cellr2', 'Cells2', 'Cellu2', 'Cell15', 'Cell16', 'CellC11', 'CellC14'];
    const scaleFactor = Math.max(0.1, (nomCap || 35.0) / 1.50 * 0.043);
    const baseTrue = [0.06, 0.09, 0.10, 0.10, 0.10, 0.14, 0.13, 0.17, 0.16, 0.17, 0.24, 0.18, 0.14, 0.21, 0.32, 0.12, 0.17, 0.10, 0.25, 0.15, 0.10, 0.34];
    const basePred = [0.061, 0.126, 0.102, 0.096, 0.130, 0.148, 0.107, 0.129, 0.139, 0.193, 0.220, 0.142, 0.152, 0.160, 0.290, 0.153, 0.160, 0.157, 0.204, 0.213, 0.068, 0.450];
    
    const trueVals = baseTrue.map(v => +(v * scaleFactor).toFixed(4));
    const predVals = basePred.map(v => +(v * scaleFactor).toFixed(4));

    const opt = {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      legend: { data: ['实测恢复量', '模型预估量'], textStyle: { color: t.textColor }, top: 0 },
      grid: { top: 35, right: 15, bottom: 35, left: 55 },
      xAxis: {
        type: 'category',
        data: cellNames,
        axisLabel: { color: t.subTextColor, fontSize: 9.5, rotate: 30 }
      },
      yAxis: {
        type: 'value',
        name: 'Q_rec (Ah)',
        splitLine: { lineStyle: { color: t.splitLineColor } }
      },
      series: [
        {
          name: '实测恢复量',
          type: 'scatter',
          symbolSize: 8,
          data: trueVals,
          itemStyle: { color: '#10B981' }
        },
        {
          name: '模型预估量',
          type: 'line',
          data: predVals,
          smooth: true,
          lineStyle: { color: '#00E5FF', width: 2 },
          itemStyle: { color: '#00E5FF' }
        }
      ]
    };
    return this.initChart(domId, opt);
  },

  // 4. 四级分选五维度机理雷达图
  renderEchelonRadar(domId, radarData = null) {
    const t = this.getThemeOptions();
    const data = radarData || { "容量保持度": 76.5, "反应过程对称性": 82.0, "副反应抑制性": 96.5, "容量可恢复潜力": 92.0, "低碳环境效益": 89.5 };
    const opt = {
      backgroundColor: 'transparent',
      tooltip: {},
      radar: {
        indicator: [
          { name: '容量保持度 (SOH)', max: 100 },
          { name: '反应过程对称性', max: 100 },
          { name: '副反应抑制性 (CE)', max: 100 },
          { name: '可恢复潜力 (RPI)', max: 100 },
          { name: '低碳环境效益', max: 100 }
        ],
        shape: 'circle',
        splitNumber: 4,
        axisName: { color: t.textColor, fontSize: 11 },
        splitLine: { lineStyle: { color: t.splitLineColor } },
        splitArea: { show: false }
      },
      series: [{
        name: '电池状态雷达',
        type: 'radar',
        data: [{
          value: [
            data['容量保持度'],
            data['反应过程对称性'] || 82.0,
            data['副反应抑制性'],
            data['容量可恢复潜力'],
            data['低碳环境效益']
          ],
          name: '当前评级',
          areaStyle: { color: 'rgba(0, 229, 255, 0.35)' },
          lineStyle: { color: '#00E5FF', width: 2 }
        }]
      }]
    };
    return this.initChart(domId, opt);
  },

  // 5. 碳减排规避量瀑布图 (依据真实物理核算结果动态渲染)
  renderCarbonWaterfall(domId, carbData = null) {
    const t = this.getThemeOptions();
    const packKwh = carbData ? carbData.pack_capacity_kwh : 60.48;
    const recKwh = carbData ? carbData.recovered_energy_pack_kwh : 6.57;
    const avoided = carbData ? carbData.ghg_avoided_kg : 420.36;
    const proc = carbData ? -carbData.ghg_process_kg : -4.94;
    const net = carbData ? carbData.ghg_net_kg : 415.42;

    const opt = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const p = params[0];
          const unit = (p.name.includes('电能') || p.name.includes('电量')) ? ' kWh' : ' kgCO₂e';
          return `${p.name}: <b>${p.value > 0 ? '+' : ''}${p.value}${unit}</b>`;
        }
      },
      grid: { top: 25, right: 15, bottom: 35, left: 65 },
      xAxis: {
        type: 'category',
        data: ['模组额定电能', '恢复洁净电能', '制造端碳规避', '调理电耗扣减', '净碳减排量'],
        axisLabel: { color: t.subTextColor, fontSize: 10.5 }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: t.splitLineColor } }
      },
      series: [{
        type: 'bar',
        data: [
          { value: packKwh, itemStyle: { color: '#3B82F6' } },
          { value: recKwh, itemStyle: { color: '#06B6D4' } },
          { value: avoided, itemStyle: { color: '#10B981' } },
          { value: proc, itemStyle: { color: '#EF4444' } },
          { value: net, itemStyle: { color: '#00E5FF' } }
        ],
        label: { show: true, position: 'top', color: t.textColor, formatter: '{c}' }
      }]
    };
    return this.initChart(domId, opt);
  },

  // 6. 批量分级分选环形图
  renderBatchDonut(domId, stats = null) {
    const t = this.getThemeOptions();
    const counts = stats || { classA: 38, classB: 41, classC: 15, classD: 6 };
    const opt = {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item', formatter: '{b}: {c} 只 ({d}%)' },
      legend: { bottom: '0%', left: 'center', textStyle: { color: t.textColor, fontSize: 10.5 } },
      series: [{
        name: '分级分选评级',
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 5, borderColor: 'transparent', borderWidth: 1 },
        label: { show: true, position: 'inside', formatter: '{c}只', color: '#FFFFFF', fontWeight: 'bold' },
        data: [
          { value: counts.classA, name: 'A级(储能服役)', itemStyle: { color: '#10B981' } },
          { value: counts.classB, name: 'B级(调理再生)', itemStyle: { color: '#06B6D4' } },
          { value: counts.classC, name: 'C级(轻载利用)', itemStyle: { color: '#F59E0B' } },
          { value: counts.classD, name: 'D级(提锂再生)', itemStyle: { color: '#EF4444' } }
        ]
      }]
    };
  },

  // 7. 电池终身多节点健康衰减与容量恢复时序轨迹图
  renderVaultHistoryChart(domId, records = null) {
    const t = this.getThemeOptions();
    const defaultRecords = [
      { stage: '出厂初始标定', date: '2023-03-15', soh: 100.0, rdc: 9.8, note: '出厂参考基准' },
      { stage: '1.2万km首检', date: '2024-01-20', soh: 93.6, rdc: 11.2, note: '常规健康体检' },
      { stage: '2.8万km巡检', date: '2024-11-08', soh: 86.4, rdc: 12.8, note: '夏季高温后体检' },
      { stage: '4.5万km退役初检', date: '2025-08-30', soh: 75.4, rdc: 14.8, note: '达成储能分选条件' },
      { stage: '微调理激活再生', date: '2025-09-02', soh: 82.2, rdc: 12.1, note: '活性锂脱嵌恢复' }
    ];
    const dataList = (records && records.length > 0) ? records : defaultRecords;
    const stages = dataList.map(r => r.stage);
    const sohVals = dataList.map(r => r.soh);
    const rdcVals = dataList.map(r => r.rdc);

    const opt = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const idx = params[0].dataIndex;
          const r = dataList[idx];
          return `<div style="font-weight:bold; margin-bottom:4px; color:#00E5FF;">${r.stage} (${r.date})</div>
                  <div>SOH 健康度: <b style="color:#10B981;">${r.soh}%</b></div>
                  <div>直流阻抗 R_dc: <b style="color:#F59E0B;">${r.rdc} mΩ</b></div>
                  <div style="color:#94A3B8; font-size:11px; margin-top:2px;">备注: ${r.note || '正常归档'}</div>`;
        }
      },
      legend: {
        data: ['SOH 健康度 (%)', '直流阻抗 (mΩ)'],
        top: 0,
        textStyle: { color: t.textColor }
      },
      grid: { top: 35, right: 45, bottom: 35, left: 45 },
      xAxis: {
        type: 'category',
        data: stages,
        axisLabel: { color: t.subTextColor, fontSize: 10.5, interval: 0 }
      },
      yAxis: [
        {
          type: 'value',
          name: 'SOH (%)',
          min: 50,
          max: 105,
          splitLine: { lineStyle: { color: t.splitLineColor } },
          axisLabel: { color: t.subTextColor, formatter: '{value}%' }
        },
        {
          type: 'value',
          name: '阻抗 (mΩ)',
          min: 5,
          max: 25,
          splitLine: { show: false },
          axisLabel: { color: t.subTextColor, formatter: '{value}' }
        }
      ],
      series: [
        {
          name: 'SOH 健康度 (%)',
          type: 'line',
          yAxisIndex: 0,
          data: sohVals,
          smooth: true,
          symbolSize: 9,
          lineStyle: { color: '#10B981', width: 3 },
          itemStyle: { color: '#10B981', borderColor: '#FFFFFF', borderWidth: 1.5 },
          markLine: {
            silent: true,
            symbol: 'none',
            data: [{ yAxis: 80, lineStyle: { color: '#EF4444', type: 'dashed', width: 1.5 }, label: { formatter: '储能梯次基准 (80%)', color: '#EF4444', position: 'insideEndTop' } }]
          },
          label: { show: true, position: 'top', formatter: '{c}%', color: t.textColor, fontWeight: 'bold' }
        },
        {
          name: '直流阻抗 (mΩ)',
          type: 'line',
          yAxisIndex: 1,
          data: rdcVals,
          smooth: true,
          symbolSize: 8,
          lineStyle: { color: '#F59E0B', width: 2, type: 'dotted' },
          itemStyle: { color: '#F59E0B' },
          label: { show: true, position: 'bottom', formatter: '{c}mΩ', color: '#F59E0B', fontSize: 10 }
        }
      ]
    };
    return this.initChart(domId, opt);
  }
};

window.addEventListener('resize', () => ChartManager.resizeAll());
