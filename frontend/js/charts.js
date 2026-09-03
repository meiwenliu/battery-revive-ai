/**
 * ECharts 可视化图表配置与渲染器 (Phase 3 升级：现代化环形能量仪表盘，绝无文字重叠)
 */
const ChartManager = {
  charts: {},
  currentTheme: 'dark',

  setTheme(theme) {
    this.currentTheme = theme;
    this.renderM1FeatureImportance('m1FeatureChart');
    this.renderM1ModelCompare('m1ModelCompareChart', document.getElementById('selM1Model')?.value || 'xgboost');
    this.renderM2Conformal('m2ConformalChart');
    this.renderEchelonRadar('echelonRadarChart');
    this.renderCarbonWaterfall('carbonWaterfallChart');
    this.renderBatchDonut('batchDonutChart');
    this.renderSohGauge('sohGaugeChart', parseFloat(document.getElementById('valSOH')?.textContent) || 75.4);
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

  // 1. M1 物理特征重要性得分排序柱状图
  renderM1FeatureImportance(domId) {
    const t = this.getThemeOptions();
    const opt = {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { top: 15, right: 25, bottom: 15, left: 150 },
      xAxis: {
        type: 'value',
        name: '分裂增益得分 (%)',
        splitLine: { lineStyle: { color: t.splitLineColor } }
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: [
          'U₀ (稳态开路电压)',
          'ΔR_dc (倍率敏感内阻差)',
          'η (极化过电位)',
          'R_dc,dis (放电直流阻抗)',
          'ΔU_relax (撤载弛豫电压)',
          'A_sym (充放过程不对称度)',
          'R_dc,chg (充电直流阻抗)'
        ],
        axisLabel: { color: t.textColor, fontSize: 11 }
      },
      series: [{
        name: '特征贡献度',
        type: 'bar',
        data: [38.5, 21.4, 15.2, 11.6, 6.8, 4.1, 2.4],
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
    const modelNames = ['统一XGBoost', '随机森林', '岭回归', '偏最小二乘', 'SVR回归', '均值基线'];
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

  // 3. M2 逐电芯恢复容量预测值与 90% 保角预测区间
  renderM2Conformal(domId) {
    const t = this.getThemeOptions();
    const cellNames = ['72', 'Cella', 'CellG', 'CellJ', 'CellT', 'Cellf', 'Cellg2', 'Cellh2', 'Cellj2', 'Cellk2', 'Celll2', 'Cellm', 'Cello', 'Cellp2', 'Cellq2', 'Cellr2', 'Cells2', 'Cellu2', 'Cell15', 'Cell16', 'CellC11', 'CellC14'];
    const trueVals = [0.06, 0.09, 0.10, 0.10, 0.10, 0.14, 0.13, 0.17, 0.16, 0.17, 0.24, 0.18, 0.14, 0.21, 0.32, 0.12, 0.17, 0.10, 0.25, 0.15, 0.10, 0.34];
    const predVals = [0.061, 0.126, 0.102, 0.096, 0.130, 0.148, 0.107, 0.129, 0.139, 0.193, 0.220, 0.142, 0.152, 0.160, 0.290, 0.153, 0.160, 0.157, 0.204, 0.213, 0.068, 0.450];
    
    const opt = {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      legend: { data: ['实测恢复量', '模型预估量'], textStyle: { color: t.textColor }, top: 0 },
      grid: { top: 35, right: 15, bottom: 35, left: 45 },
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

  // 5. 碳减排规避量瀑布图
  renderCarbonWaterfall(domId, data = null) {
    const t = this.getThemeOptions();
    const opt = {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { top: 25, right: 15, bottom: 35, left: 55 },
      xAxis: {
        type: 'category',
        data: ['额定电量', '恢复电量', '制造减排潜力', '调理电耗扣减', '净碳减排量'],
        axisLabel: { color: t.subTextColor, fontSize: 10.5 }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: t.splitLineColor } }
      },
      series: [{
        type: 'bar',
        data: [
          { value: 60.48, itemStyle: { color: '#3B82F6' } },
          { value: 6.57, itemStyle: { color: '#06B6D4' } },
          { value: 420.36, itemStyle: { color: '#10B981' } },
          { value: -4.94, itemStyle: { color: '#EF4444' } },
          { value: 415.42, itemStyle: { color: '#F59E0B' } }
        ],
        label: { show: true, position: 'top', color: t.textColor }
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
    return this.initChart(domId, opt);
  }
};

window.addEventListener('resize', () => ChartManager.resizeAll());
