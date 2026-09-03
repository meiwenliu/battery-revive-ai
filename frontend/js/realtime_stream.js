/**
 * 双迹线实时动态示波器引擎 (HTML5 Canvas 60fps 双通道采样)
 */
class RealtimeOscilloscope {
  constructor(canvasId, hudId) {
    this.canvas = document.getElementById(canvasId);
    this.hud = document.getElementById(hudId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.isRunning = true;
    this.channelId = 'CH01';
    this.sampleRate = 10; // Hz
    this.dataPoints = [];
    this.maxPoints = 260;
    this.t = 0;
    this.injectedMode = 'auto'; // auto, chg_05c, dis_10c, dis_20c, relax
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initData();
    this.animate();
  }

  resize() {
    if (!this.canvas) return;
    this.width = this.canvas.parentElement.clientWidth || 600;
    this.height = this.canvas.parentElement.clientHeight || 260;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  initData() {
    for (let i = 0; i < this.maxPoints; i++) {
      this.dataPoints.push({ v: 3.295, i: 0.0 });
    }
  }

  injectProtocol(mode) {
    this.injectedMode = mode;
  }

  animate() {
    if (this.isRunning) {
      this.t += 0.05;
      
      let curr = 0.0;
      let volt = 3.295;

      if (this.injectedMode === 'chg_05c') {
        curr = 17.5;
        volt = 3.295 + 0.048;
      } else if (this.injectedMode === 'dis_10c') {
        curr = -35.0;
        volt = 3.295 - 0.068;
      } else if (this.injectedMode === 'dis_20c') {
        curr = -70.0;
        volt = 3.295 - 0.145;
      } else if (this.injectedMode === 'relax') {
        curr = 0.0;
        volt = 3.295 - 0.008;
      } else {
        // auto cycle
        const phase = Math.floor((this.t * 4) % 60);
        if (phase < 15) {
          curr = 0.0;
          volt = 3.295;
        } else if (phase < 35) {
          curr = 17.5; // 0.5C 充电
          volt = 3.295 + 0.045 + 0.004 * Math.log(Math.max(1, phase - 14));
        } else if (phase < 48) {
          curr = -35.0; // 1.0C 放电
          volt = 3.295 - 0.065 - 0.005 * Math.log(Math.max(1, phase - 34));
        } else {
          curr = 0.0; // 撤载松弛
          volt = 3.295 - 0.015 + 0.010 * (1.0 - Math.exp(-(phase - 48) / 3.0));
        }
      }

      volt += (Math.random() - 0.5) * 0.001;
      curr += (Math.random() - 0.5) * 0.05;

      this.dataPoints.push({ v: volt, i: curr });
      if (this.dataPoints.length > this.maxPoints) {
        this.dataPoints.shift();
      }

      // 更新 HUD
      if (this.hud) {
        const last = this.dataPoints[this.dataPoints.length - 1];
        const power = (last.v * last.i).toFixed(1);
        const dcir = (Math.abs(curr) > 1.0 ? Math.abs((last.v - 3.295) / last.i * 1000).toFixed(2) : 12.45);
        this.hud.innerHTML = `
          <span>通道: <strong>${this.channelId}</strong></span>
          <span>Trace-V 电压: <strong style="color:#00E5FF;">${last.v.toFixed(4)} V</strong></span>
          <span>Trace-I 电流: <strong style="color:#34D399;">${last.i > 0 ? '+' : ''}${last.i.toFixed(2)} A</strong></span>
          <span>瞬时功率: <strong>${power} W</strong></span>
          <span>瞬态内阻: <strong>${dcir} mΩ</strong></span>
        `;
      }

      this.draw();
    }
    requestAnimationFrame(() => this.animate());
  }

  draw() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // 1. 绘制网格
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 2. 绘制零位参考线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Trace-I (电流波形: 荧光绿)
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < this.dataPoints.length; i++) {
      const x = (i / (this.maxPoints - 1)) * w;
      const curr = this.dataPoints[i].i;
      const y = h / 2 - (curr / 80.0) * (h * 0.40);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 4. Trace-V (电压波形: 高亮电青色带光晕)
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(0, 229, 255, 0.85)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    for (let i = 0; i < this.dataPoints.length; i++) {
      const x = (i / (this.maxPoints - 1)) * w;
      const volt = this.dataPoints[i].v;
      const y = h / 2 - ((volt - 3.295) / 0.20) * (h * 0.42);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  setChannel(ch) {
    this.channelId = ch;
  }

  toggle() {
    this.isRunning = !this.isRunning;
    return this.isRunning;
  }
}
