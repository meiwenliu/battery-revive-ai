/**
 * 诊断与低碳再生综合决策报告生成器 (含防伪水印与双签章)
 */
const ReportGenerator = {
  renderReport(containerId, data) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const now = new Date();
    const timeStr = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    const reportId = 'REP-' + now.getTime().toString().slice(-8);

    el.innerHTML = `
      <div class="report-paper">
        <div class="report-watermark">焕芯·电愈智策 官方认证</div>

        <h2>《焕芯·电愈智策》多体系电池智能快速诊断与低碳再生评估报告</h2>
        
        <table class="report-meta-table">
          <tr>
            <td class="label">报告编号</td>
            <td><strong>${reportId}</strong></td>
            <td class="label">评估时间</td>
            <td>${timeStr}</td>
          </tr>
          <tr>
            <td class="label">受检电芯编号</td>
            <td><strong style="color:#0284C7; font-size:14px;">${data.cell_id || 'BAT-2026-REC-01'}</strong></td>
            <td class="label">材料与工作窗口</td>
            <td><strong>${data.chemistry_name || '磷酸铁锂 (LFP) 体系'}</strong> (${data.nom_cap_ah || 35.0} Ah · 截止: ${data.v_dis_cut || 2.50}V ~ ${data.v_chg_cut || 3.65}V)</td>
          </tr>
          <tr>
            <td class="label">测试协议</td>
            <td>SINGLE50 极速脉冲 (50% SOC)</td>
            <td class="label">核算标准</td>
            <td>GB/T 34015-2017 / 双碳赛支撑规范</td>
          </tr>
        </table>

        <div class="report-section-title">一、SOH 快速健康诊断结果 (M1 模块)</div>
        <table class="report-meta-table">
          <tr>
            <td class="label">当前评估 SOH</td>
            <td><strong style="color:#059669; font-size:15px;">${data.soh_pct}%</strong> (${data.health_grade || '良好'})</td>
            <td class="label">诊断算法模型</td>
            <td>${data.selected_m1_model || '统一梯度提升决策树 (XGBoost) [推荐]'}</td>
          </tr>
          <tr>
            <td class="label">诊断耗时对比</td>
            <td>180 秒 (极速单点，较传统节省 90% 时间)</td>
            <td class="label">测试工况</td>
            <td>50% SOC 脉冲工况 (SINGLE50)</td>
          </tr>
        </table>

        <div class="report-section-title">二、单次状态容量可恢复性预估 (M2 模块)</div>
        <table class="report-meta-table">
          <tr>
            <td class="label">预测可恢复容量 Q_rec</td>
            <td><strong>${data.predicted_qrec_ah} Ah</strong> (标称恢复率: ${data.recovery_fraction_pct}%)</td>
            <td class="label">90% 保角置信区间</td>
            <td>[ ${data.lower_90_ah} Ah , ${data.upper_90_ah} Ah ]</td>
          </tr>
          <tr>
            <td class="label">恢复潜力指数 (RPI)</td>
            <td><strong>${data.rpi_pct}%</strong></td>
            <td class="label">调理后预期 SOH</td>
            <td><strong style="color:#0284C7; font-size:15px;">${data.predicted_after_soh_pct}%</strong> (预期提升幅度 +${data.soh_gain_pct}%)</td>
          </tr>
        </table>

        <div class="report-section-title">三、四级分选与科学决策依据</div>
        <table class="report-meta-table">
          <tr>
            <td class="label">分选建议评级</td>
            <td colspan="3"><strong style="color:${data.tier_color || '#0284C7'}; font-size:15px;">${data.echelon_tier}</strong></td>
          </tr>
          <tr>
            <td class="label">推荐应用场景</td>
            <td colspan="3">${data.application_scene || '工商业与户用储能 / 5G 通信基站备电 / 离网微电网储能'}</td>
          </tr>
          <tr>
            <td class="label">工艺处理建议</td>
            <td colspan="3">${data.recommended_treatment || '执行 3.6V 恒压充电微调理规程，激活可逆活性锂，提升健康度后再成组'}</td>
          </tr>
        </table>

        <div class="report-section-title">四、微观-宏观制造端碳减排规避量量化 (M3 模块)</div>
        <table class="report-meta-table">
          <tr>
            <td class="label">制造端碳排放规避潜力</td>
            <td><strong style="color:#059669;">${data.ghg_avoided_kg || '420.36'} kgCO₂e</strong> (60.48 kWh 包等效)</td>
            <td class="label">净碳减排量 (扣除电耗)</td>
            <td><strong style="color:#059669; font-size:15px;">${data.ghg_net_kg || '415.42'} kgCO₂e</strong></td>
          </tr>
          <tr>
            <td class="label">等效常压 CO₂ 气体体积</td>
            <td><strong>${data.co2_volume_m3 || '230.79'} m³</strong> (25℃, 1atm)</td>
            <td class="label">生态植树碳汇等效</td>
            <td>约 <strong>${data.trees_equivalent || '23.1'} 棵</strong> 成年树木年吸收量</td>
          </tr>
        </table>

        <div class="report-sign-block">
          <div>
            <span>评估工程师：__________________</span>&nbsp;&nbsp;&nbsp;&nbsp;
            <span>审核专家：__________________</span>
          </div>
          <div>
            <span>系统认证编号：Q/BTY-2026-DIAG</span>
          </div>
        </div>
      </div>
    `;
  },

  printReport() {
    window.print();
  }
};
