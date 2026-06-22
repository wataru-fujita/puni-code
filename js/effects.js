// ==========================================================
// ぷにコード - パーティクル＆チップチューンサウンド
// ==========================================================

// ── パーティクルシステム ──
export class ParticleSystem {
  constructor() {
    this.canvas = document.getElementById('particles-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.running = false;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  // パーティクルを発生させる
  emit(type, x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(type, x, y));
    }
    if (!this.running) this.startLoop();
  }

  // タイプ別パーティクル生成
  createParticle(type, x, y) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 5;
    const base = {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      life: 1,
      decay: 0.008 + Math.random() * 0.015,
      size: 5 + Math.random() * 10,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 15,
      hue: Math.random() * 360,
      glow: true
    };

    switch (type) {
      case 'magic':
        return { ...base, type: 'magic', color: `hsl(${base.hue}, 100%, 75%)`, size: base.size * 1.2 };
      case 'star':
        return { ...base, type: 'star', color: `hsl(${45 + Math.random() * 20}, 100%, 75%)` };
      case 'heart':
        return { ...base, type: 'heart', color: `hsl(${340 + Math.random() * 30}, 100%, 80%)`, size: base.size * 0.9 };
      case 'sparkle':
        return { ...base, type: 'sparkle', color: '#FFF', size: base.size * 0.4, glow: true };
      case 'flower':
        return { ...base, type: 'flower', color: `hsl(${330 + Math.random() * 40}, 100%, 85%)`, size: base.size * 1.3 };
      case 'bubble':
        return { ...base, type: 'bubble', color: `hsla(${200 + Math.random() * 40}, 100%, 85%, 0.7)`, vy: -1.5 - Math.random() * 2, decay: 0.005 };
      case 'confetti':
        return { ...base, type: 'confetti', color: `hsl(${Math.random() * 360}, 100%, 70%)`, vy: -5 - Math.random() * 5 };
      case 'abyss':
        return { ...base, type: 'abyss', color: `hsl(${260 + Math.random() * 60}, 100%, 65%)`, size: base.size * 1.3, glow: true };
      case 'glitch':
        return { ...base, type: 'glitch', color: Math.random() > 0.5 ? '#ff007f' : '#00f3ff', size: base.size * 0.7, decay: 0.02, rotSpeed: (Math.random() - 0.5) * 30 };
      default:
        return { ...base, type: 'sparkle', color: '#FFF' };
    }
  }

  // 描画ループ
  startLoop() {
    this.running = true;
    const loop = () => {
      if (this.particles.length === 0) {
        this.running = false;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        return;
      }
      this.update();
      this.draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      
      if (p.type === 'bubble' || p.type === 'flower') {
        p.vx += Math.sin(Date.now() * 0.005 + p.hue) * 0.15; // ゆらゆら
        p.vy -= 0.03; 
      } else {
        p.vy += 0.12; // 重力
      }

      if (p.type === 'magic') {
        p.hue = (p.hue + 5) % 360; // 虹色変化
        p.color = `hsl(${p.hue}, 100%, 75%)`;
      }
      
      p.life -= p.decay;
      p.rotation += p.rotSpeed;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 背景をわずかに暗くして発光を際立たせる（オプション：必要ならコメントアウト解除）
    // this.ctx.fillStyle = 'rgba(0,0,0,0.02)';
    // this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation * Math.PI / 180);
      this.ctx.globalAlpha = p.life;

      // 超カワイイ「発光(Glow)」エフェクト
      if (p.glow) {
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = p.color;
        this.ctx.globalCompositeOperation = 'lighter'; // 光の重なり
      }

      switch (p.type) {
        case 'magic':
        case 'star': this.drawStar(p); break;
        case 'heart': this.drawHeart(p); break;
        case 'flower': this.drawFlower(p); break;
        case 'bubble': this.drawBubble(p); break;
        case 'confetti': this.drawConfetti(p); break;
        case 'abyss': this.drawAbyss(p); break;
        case 'glitch': this.drawGlitch(p); break;
        default: this.drawSparkle(p); break;
      }

      this.ctx.restore();
    }
  }

  drawStar(p) {
    const s = p.size;
    this.ctx.fillStyle = p.color;
    this.ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const a = (i * 72 - 90) * Math.PI / 180;
        const aInner = ((i * 72) + 36 - 90) * Math.PI / 180;
        this.ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
        this.ctx.lineTo(Math.cos(aInner) * s * 0.45, Math.sin(aInner) * s * 0.45);
    }
    this.ctx.closePath();
    this.ctx.fill();
    // センターハイライト
    this.ctx.fillStyle = '#FFF';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, s * 0.2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawHeart(p) {
    const s = p.size;
    this.ctx.fillStyle = p.color;
    this.ctx.beginPath();
    this.ctx.moveTo(0, s * 0.35);
    this.ctx.bezierCurveTo(-s, -s * 0.3, -s * 0.6, -s, 0, -s * 0.5);
    this.ctx.bezierCurveTo(s * 0.6, -s, s, -s * 0.3, 0, s * 0.35);
    this.ctx.fill();
  }

  drawFlower(p) {
    const s = p.size;
    this.ctx.fillStyle = p.color;
    for (let i = 0; i < 5; i++) {
      this.ctx.beginPath();
      this.ctx.rotate((72 * Math.PI) / 180);
      this.ctx.ellipse(s * 0.5, 0, s * 0.5, s * 0.35, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.fillStyle = '#FFF';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, s * 0.25, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawBubble(p) {
    const s = p.size;
    this.ctx.strokeStyle = p.color;
    this.ctx.lineWidth = 2.5;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, s, 0, Math.PI * 2);
    this.ctx.stroke();
    // 虹色の反射
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.beginPath();
    this.ctx.arc(-s * 0.3, -s * 0.3, s * 0.25, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawSparkle(p) {
    const s = p.size;
    this.ctx.fillStyle = p.color;
    this.ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (i * 90) * Math.PI / 180;
      this.ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
      const aInner = (i * 90 + 45) * Math.PI / 180;
      this.ctx.lineTo(Math.cos(aInner) * s * 0.25, Math.sin(aInner) * s * 0.25);
    }
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawConfetti(p) {
    const s = p.size;
    this.ctx.fillStyle = p.color;
    this.ctx.rotate(p.rotation * 0.1 * Math.PI / 180);
    this.ctx.fillRect(-s / 2, -s / 4, s, s / 2);
  }

  drawAbyss(p) {
    const s = p.size;
    const grad = this.ctx.createRadialGradient(0, 0, s * 0.1, 0, 0, s);
    grad.addColorStop(0, '#FFF');
    grad.addColorStop(0.3, p.color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, s, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawGlitch(p) {
    const s = p.size;
    this.ctx.fillStyle = p.color;
    this.ctx.fillRect(-s / 2, -s / 2, s, s);
    
    this.ctx.strokeStyle = p.color === '#ff007f' ? '#00f3ff' : '#ff007f';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(-s / 2 - 2, -s / 2 + 1, s, s);
  }

  emitTrail(x, y, isDarkMode = false) {
    if (isDarkMode) {
      this.emit('glitch', x, y, 4);
      if (Math.random() > 0.6) this.emit('abyss', x, y, 2);
    } else {
      this.emit('sparkle', x, y, 5);
      this.emit('flower', x, y, 2);
      if (Math.random() > 0.7) this.emit('magic', x, y, 1);
    }
  }

  celebrate(cx, cy, isDarkMode = false) {
    if (isDarkMode) {
      const timeline = [
        { t: 'glitch', c: 40, d: 0 },
        { t: 'abyss', c: 35, d: 150 },
        { t: 'glitch', c: 35, d: 300 },
        { t: 'abyss', c: 30, d: 450 }
      ];
      timeline.forEach(step => {
        setTimeout(() => this.emit(step.t, cx, cy, step.c), step.d);
      });
      setTimeout(() => {
        const corners = [
          { x: 0, y: 0 },
          { x: window.innerWidth, y: 0 },
          { x: 0, y: window.innerHeight },
          { x: window.innerWidth, y: window.innerHeight }
        ];
        corners.forEach(pos => this.emit('glitch', pos.x, pos.y, 40));
      }, 600);
    } else {
      // 超ド派手な「5段階」セレブレーション
      const timeline = [
        { t: 'magic', c: 40, d: 0 },
        { t: 'heart', c: 30, d: 150 },
        { t: 'flower', c: 30, d: 300 },
        { t: 'bubble', c: 25, d: 450 },
        { t: 'star', c: 30, d: 600 }
      ];

      timeline.forEach(step => {
        setTimeout(() => this.emit(step.t, cx, cy, step.c), step.d);
      });
      
      // フィナーレ：画面の四隅からバースト
      setTimeout(() => {
        const corners = [
          { x: 0, y: 0 },
          { x: window.innerWidth, y: 0 },
          { x: 0, y: window.innerHeight },
          { x: window.innerWidth, y: window.innerHeight }
        ];
        corners.forEach(pos => this.emit('confetti', pos.x, pos.y, 40));
      }, 800);
    }
  }
}


// ── チップチューンサウンドマネージャー ──
export class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.initialized = false;
    this.isDarkMode = false;
  }

  // AudioContextは最初のユーザー操作後に初期化
  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      this.enabled = false;
    }
  }

  // チップチューン音を鳴らす基本関数
  playTone(freq, duration, type = 'square', volume = 0.15, delay = 0) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    let actualFreq = freq;
    let actualType = type;
    
    if (this.isDarkMode) {
      actualFreq = freq * 0.65;
      if (type === 'square' || type === 'sine') {
        actualType = 'sawtooth';
      }
    }
    
    osc.type = actualType;
    osc.frequency.setValueAtTime(actualFreq, t);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
  }

  playDarkIn() {
    this.init();
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 1.2);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 1.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 1.2);

    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(90, t);
    sub.frequency.linearRampToValueAtTime(35, t + 1.5);
    subGain.gain.setValueAtTime(0.3, t);
    subGain.gain.linearRampToValueAtTime(0.001, t + 1.5);
    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(t);
    sub.stop(t + 1.5);
  }

  playDarkOut() {
    this.init();
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.8);
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.6);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.8);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.8);
  }

  // UIタップ音
  playTap() {
    this.init();
    this.playTone(880, 0.08, 'square', 0.08);
  }

  // ブロック追加音（ポップ）
  playPop() {
    this.init();
    this.playTone(587, 0.06, 'square', 0.1);
    this.playTone(784, 0.08, 'square', 0.1, 0.05);
  }

  // ブロック削除音
  playRemove() {
    this.init();
    this.playTone(523, 0.06, 'triangle', 0.1);
    this.playTone(392, 0.08, 'triangle', 0.1, 0.05);
  }

  // キャラ移動音
  playMove() {
    this.init();
    this.playTone(523, 0.08, 'square', 0.08);
    this.playTone(659, 0.06, 'square', 0.08, 0.06);
  }

  // キャラ回転音
  playTurn() {
    this.init();
    this.playTone(440, 0.05, 'triangle', 0.1);
    this.playTone(554, 0.05, 'triangle', 0.1, 0.04);
    this.playTone(659, 0.05, 'triangle', 0.1, 0.08);
  }

  // クリア！メロディ
  playClear() {
    this.init();
    const melody = [523, 659, 784, 1047];
    melody.forEach((freq, i) => {
      this.playTone(freq, 0.2, 'square', 0.12, i * 0.12);
    });
    // ハーモニー
    setTimeout(() => {
      this.playTone(784, 0.4, 'triangle', 0.08);
      this.playTone(1047, 0.4, 'triangle', 0.08);
    }, 500);
  }

  // 失敗音
  playFail() {
    this.init();
    this.playTone(330, 0.15, 'square', 0.1);
    this.playTone(262, 0.25, 'square', 0.1, 0.12);
  }

  // ぷにちゃんタッチ（かわいい音）
  playPuni() {
    this.init();
    this.playTone(784, 0.06, 'sine', 0.12);
    this.playTone(988, 0.08, 'sine', 0.1, 0.04);
    this.playTone(1175, 0.06, 'sine', 0.08, 0.08);
  }

  // 壁にぶつかる音
  playBump() {
    this.init();
    this.playTone(150, 0.1, 'sawtooth', 0.1);
    this.playTone(100, 0.15, 'sawtooth', 0.08, 0.08);
  }

  // きせかえ変更音
  playChange() {
    this.init();
    this.playTone(659, 0.08, 'triangle', 0.1);
    this.playTone(784, 0.1, 'triangle', 0.1, 0.06);
  }

  // ゴミ箱音
  playTrash() {
    this.init();
    this.playTone(400, 0.05, 'sawtooth', 0.1);
    this.playTone(300, 0.05, 'sawtooth', 0.1, 0.05);
    this.playTone(200, 0.1, 'sawtooth', 0.1, 0.1);
  }
}
