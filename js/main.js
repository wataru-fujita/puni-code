// ==========================================================
// ぷにコード - メインアプリケーション
// ==========================================================
import { ParticleSystem, SoundManager } from './effects.js';
import { GameEngine } from './game.js';
import { DressUpScreen } from './dressup.js';
import { STAGES } from './stages.js';
import { createCharacter, squishCharacter, getCharacterOptions } from './character.js';

class App {
  constructor() {
    this.sound = new SoundManager();
    this.particles = new ParticleSystem();
    this.game = new GameEngine(this);
    this.dressup = new DressUpScreen(this);
    this.playerData = null;
    this.currentSlot = -1;
    this.isGuest = false;
    this.currentScreen = null;

    // ダークモードの復元
    this.isDarkMode = localStorage.getItem('punicode-darkmode') === 'true';
    document.body.classList.toggle('dark-mode', this.isDarkMode);
    this.sound.isDarkMode = this.isDarkMode;

    this.showTitle();
  }

  // ── プレイヤーデータ管理 ──

  loadAllProfiles() {
    try {
      const data = localStorage.getItem('punicode-profiles');
      if (data) return JSON.parse(data);
    } catch (e) { /* ignore */ }
    return Array(5).fill(null);
  }

  saveAllProfiles(profiles) {
    try {
      localStorage.setItem('punicode-profiles', JSON.stringify(profiles));
    } catch (e) { /* ignore */ }
  }

  createDefaultData() {
    return {
      color: 'pink',
      accessories: {},
      stages: {},
      bestTimes: {},
      lastSaved: Date.now(),
    };
  }

  loadSlot(slotIndex) {
    const profiles = this.loadAllProfiles();
    this.currentSlot = slotIndex;
    this.isGuest = false;
    if (!profiles[slotIndex]) {
      profiles[slotIndex] = this.createDefaultData();
      this.saveAllProfiles(profiles);
    }
    this.playerData = profiles[slotIndex];
  }

  startAsGuest() {
    this.currentSlot = -1;
    this.isGuest = true;
    this.playerData = this.createDefaultData();
  }

  deleteSlot(slotIndex) {
    const profiles = this.loadAllProfiles();
    profiles[slotIndex] = null;
    this.saveAllProfiles(profiles);
  }

  savePlayerData() {
    if (this.isGuest || this.currentSlot < 0) return;
    try {
      this.playerData.lastSaved = Date.now(); // 保存時に日付を更新
      const profiles = this.loadAllProfiles();
      profiles[this.currentSlot] = this.playerData;
      this.saveAllProfiles(profiles);
    } catch (e) { /* ignore */ }
  }

  saveStageResult(stageId, stars, time) {
    if (!this.playerData.stages) this.playerData.stages = {};
    if (!this.playerData.bestTimes) this.playerData.bestTimes = {};

    const prev = this.playerData.stages[stageId];
    if (!prev || stars > (prev.stars || 0)) {
      this.playerData.stages[stageId] = { cleared: true, stars };
    }

    // ベストタイムの更新
    if (time !== undefined) {
      const prevTime = this.playerData.bestTimes[stageId];
      if (prevTime === undefined || time < prevTime) {
        this.playerData.bestTimes[stageId] = time;
      }
    }
    // 次のステージをアンロック
    const idx = STAGES.findIndex(s => s.id === stageId);
    if (idx < STAGES.length - 1) {
      const next = STAGES[idx + 1];
      if (!this.playerData.stages[next.id]) {
        this.playerData.stages[next.id] = { cleared: false, stars: 0 };
      }
    }
    this.savePlayerData();
  }

  getCharacterOptions() {
    return getCharacterOptions(this.playerData);
  }

  // ── 画面管理 ──

  switchScreen(newScreen) {
    const app = document.getElementById('app');

    // すべての既存画面を即座に削除（ID衝突を防ぐため）
    const oldScreens = Array.from(app.querySelectorAll('.screen'));
    oldScreens.forEach(old => {
      old.remove();
    });

    // 新しい画面を追加
    app.appendChild(newScreen);

    // 画面のフェードイン
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        newScreen.classList.add('active');
      });
    });

    this.currentScreen = newScreen;
  }

  // ── タイトル画面 ──

  showTitle() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());

    const screen = document.createElement('div');
    screen.className = 'screen title-screen';
    screen.id = 'title-screen';

    // デコレーションの切り替えと隠しアイコンの挿入
    let decos = this.isDarkMode 
      ? ['💀', '👾', '👿', '🕸️', '🔮', '🌋', '👁️'] 
      : ['🌸', '⭐', '💖', '🌟', '✨', '🎵', '🌈'];
    
    // 隠しアイコンを挿入
    const secretIcon = this.isDarkMode ? '😇' : '😎';
    decos.push(secretIcon);
    
    // シャッフル
    decos.sort(() => Math.random() - 0.5);

    screen.innerHTML = `
      <div class="title-logo">
        <h1>${this.isDarkMode ? 'ぷにコード 🔮' : 'ぷにコード'}</h1>
        <div class="title-subtitle">${this.isDarkMode ? '～ひみつの プログラマーモード～' : '～かわいいスライムにプログラミング！～'}</div>
      </div>
      <div class="title-character" id="title-char"></div>
      <div class="title-buttons">
        <button class="btn ${this.isDarkMode ? 'btn-stop' : 'btn-primary'}" id="btn-play">
          ${this.isDarkMode ? '🔮 はじめる' : '🎮 あそぶ'}
        </button>
      </div>
    `;

    // デコレーション要素を追加
    decos.forEach((d, i) => {
      const span = document.createElement('span');
      const isSecret = (d === '😎' || d === '😇');
      span.className = 'title-deco' + (isSecret ? ' secret-trigger' : '');
      const left = 5 + Math.random() * 85;
      const top = 5 + Math.random() * 85;
      const delay = i * 0.8;
      const size = 1 + Math.random() * 0.8;
      span.style.cssText = `left:${left}%;top:${top}%;animation: floatDeco 6s ease-in-out infinite; animation-delay:${delay}s; font-size:${size}rem;`;
      span.textContent = d;

      // クリックイベント
      span.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const rect = span.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        if (d === '😎') {
          this.triggerDarkModeEvent(x, y);
        } else if (d === '😇') {
          this.triggerNormalModeEvent(x, y);
        } else {
          // 通常のデコレーション絵文字のパーティクル分岐
          this.sound.playTone(600 + Math.random() * 300, 0.08, this.isDarkMode ? 'sawtooth' : 'sine', 0.08);
          
          let pType = 'sparkle';
          if (d === '🌸') pType = 'flower';
          else if (d === '💖') pType = 'heart';
          else if (d === '⭐' || d === '🌟') pType = 'star';
          else if (d === '✨') pType = 'sparkle';
          else if (d === '🌈') pType = 'magic';
          else if (d === 'bubble') pType = 'bubble';
          // ダーク系
          else if (['💀', '👿', '👾', '👁️'].includes(d)) pType = 'abyss';
          else if (['🕸️', '🔮', '🌋'].includes(d)) pType = 'glitch';

          this.particles.emit(pType, x, y, 10);
          
          // タップされた絵文字をちょっとぷにっとさせる
          span.style.transform = 'scale(1.5)';
          setTimeout(() => {
            span.style.transform = '';
          }, 200);
        }
      });

      screen.appendChild(span);
    });

    this.switchScreen(screen);

    // ぷにちゃんを配置（ゲスト or デフォルト表示）
    const charContainer = screen.querySelector('#title-char');
    const opts = this.playerData ? this.getCharacterOptions() : { color: 'pink', accessories: {} };
    const charEl = createCharacter(opts);
    charContainer.appendChild(charEl);

    charContainer.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      
      const rect = charContainer.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 3;

      if (this.isDarkMode) {
        this.sound.playTone(150 + Math.random() * 40, 0.1, 'sawtooth', 0.12);
        squishCharacter(charEl);
        this.particles.emit('abyss', x, y, 6);
        this.particles.emit('glitch', x, y, 2);
      } else {
        this.sound.playPuni();
        squishCharacter(charEl);
        this.particles.emit('heart', x, y, 5);
      }
    });

    screen.querySelector('#btn-play').addEventListener('click', () => {
      this.sound.playTap();
      this.showProfileSelect('play');
    });
  }

  // ── プロフィール選択画面 ──

  showProfileSelect(nextAction = 'play') {
    const screen = document.createElement('div');
    screen.className = 'screen profile-screen';
    screen.id = 'profile-screen';

    const profiles = this.loadAllProfiles();

    const slotsHTML = profiles.map((p, i) => {
      if (p) {
        const totalStars = Object.values(p.stages || {}).reduce((sum, s) => sum + (s.stars || 0), 0);
        const clearedCount = Object.values(p.stages || {}).filter(s => s.cleared).length;
        return `
          <div class="profile-slot has-data" data-slot="${i}">
            <div class="slot-icon" id="slot-char-${i}"></div>
            <div class="slot-info">
              <div class="slot-name">スロット ${i + 1}</div>
              <div class="slot-stats">⭐ ${totalStars} こ ・ ${clearedCount} クリア</div>
              <div class="slot-date">${p.lastSaved ? new Date(p.lastSaved).toLocaleDateString('ja-JP') : ''}</div>
            </div>
            <div class="slot-actions">
              <button class="slot-btn slot-continue" data-slot="${i}">つづきから</button>
              <button class="slot-btn slot-dressup-mini" data-slot="${i}">きせかえ</button>
              <button class="slot-btn slot-delete" data-slot="${i}">けす</button>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="profile-slot empty" data-slot="${i}">
            <div class="slot-icon">➕</div>
            <div class="slot-info">
              <div class="slot-name">スロット ${i + 1}</div>
              <div class="slot-stats">あたらしく はじめる</div>
            </div>
            <button class="slot-btn slot-new" data-slot="${i}">スタート！</button>
          </div>
        `;
      }
    }).join('');

    screen.innerHTML = `
      <div class="header">
        <button class="header-back" id="profile-back">◀ <span>もどる</span></button>
        <div class="header-title">プロフィールを えらんでね</div>
        <div style="width:60px"></div>
      </div>
      <div class="profile-list">
        ${slotsHTML}
        <div class="profile-slot guest">
          <div class="slot-icon">👻</div>
          <div class="slot-info">
            <div class="slot-name">ゲストで あそぶ</div>
            <div class="slot-stats">データは のこらないよ</div>
          </div>
          <button class="slot-btn slot-guest">あそぶ！</button>
        </div>
      </div>
    `;

    this.switchScreen(screen);

    // 戻るボタン
    screen.querySelector('#profile-back').addEventListener('click', () => {
      this.sound.playTap();
      this.showTitle();
    });

    // 各スロットのキャラクターを描画
    profiles.forEach((p, i) => {
      if (p) {
        const container = screen.querySelector(`#slot-char-${i}`);
        if (container) {
          const char = createCharacter({
            color: p.color || 'pink',
            accessories: p.accessories || {}
          });
          container.appendChild(char);
        }
      }
    });

    // スロットクリックイベント
    screen.querySelectorAll('.slot-continue').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.sound.playTap();
        this.loadSlot(parseInt(btn.dataset.slot));
        this.showStageSelect();
      });
    });

    screen.querySelectorAll('.slot-dressup-mini').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.sound.playTap();
        this.loadSlot(parseInt(btn.dataset.slot));
        this.dressup.show('profile'); // profile から遷移
      });
    });

    screen.querySelectorAll('.slot-new').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.sound.playTap();
        this.loadSlot(parseInt(btn.dataset.slot));
        if (nextAction === 'dressup') { this.dressup.show('profile'); }
        else { this.showStageSelect(); }
      });
    });

    screen.querySelectorAll('.slot-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const slot = parseInt(btn.dataset.slot);
        if (confirm(`スロット ${slot + 1} の データを けしますか？`)) {
          this.deleteSlot(slot);
          this.sound.playRemove();
          this.showProfileSelect(nextAction);
        }
      });
    });

    screen.querySelector('.slot-guest').addEventListener('click', () => {
      this.sound.playTap();
      this.startAsGuest();
      this.showStageSelect();
    });
  }

  // ── ステージ選択画面 ──

  showStageSelect() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());

    const screen = document.createElement('div');
    screen.className = 'screen stage-screen';
    screen.id = 'stage-screen';

    // ワールドごとにボタンを生成
    const worlds = this.isDarkMode ? [
      { id: 1, name: '💻 レベル 1 (じゅんじしょり)', subtitle: '// まえに すすむ プログラムを つくろう！' },
      { id: 2, name: '💻 レベル 2 (ほうこうてんかん)', subtitle: '// まがりかどの プログラムを つくろう！' },
      { id: 3, name: '💻 レベル 3 (くりかえし)', subtitle: '// くりかえしを つかって プログラムを かんたんにしよう！' },
    ] : [
      { id: 1, name: '🍀 レベル 1 🍀', subtitle: 'ひとりで まっすぐ すすおう！' },
      { id: 2, name: '🌲 レベル 2 🌲', subtitle: 'まがり道を まわって ぼうけん！' },
      { id: 3, name: '✨ レベル 3 ✨', subtitle: 'まほうの くりかえしを つかおう！' },
    ];

    const worldHTML = worlds.map(world => {
      const worldStages = STAGES.filter(s => s.world === world.id);
      if (worldStages.length === 0) return '';

      const buttons = worldStages.map(stage => {
        const i = STAGES.findIndex(s => s.id === stage.id);
        const data = this.playerData.stages?.[stage.id];
        const isCleared = data?.cleared || false;
        const stars = data?.stars || 0;

        // ダークモード: 全ステージ解放（ハック感）
        let isUnlocked;
        if (this.isDarkMode) {
          isUnlocked = true;
        } else {
          isUnlocked = (i === 0);
          if (i > 0) {
            const prevData = this.playerData.stages?.[STAGES[i - 1].id];
            isUnlocked = prevData?.cleared || false;
          }
        }

        let statusIcon = '🔒';
        let stateClass = 'locked';
        if (isCleared) {
          statusIcon = (this.isDarkMode ? '🔮' : '⭐').repeat(stars);
          stateClass = 'cleared';
        } else if (isUnlocked) {
          statusIcon = this.isDarkMode ? '🔓' : '🌟';
          stateClass = this.isDarkMode ? 'current hacked' : 'current';
        }

        const bestTime = this.playerData.bestTimes?.[stage.id];
        const bestStr = bestTime !== undefined ? `タイム: ${Math.floor(bestTime / 60)}:${(bestTime % 60).toString().padStart(2, '0')}` : '';

        return `
          <button class="stage-btn ${stateClass}" data-id="${stage.id}" ${!isUnlocked ? 'disabled' : ''}>
            <div class="stage-number">ステージ ${stage.id}</div>
            <div class="stage-name">${stage.name}</div>
            <div class="stage-status">${statusIcon}</div>
            ${bestStr ? `<div class="stage-best">${bestStr}</div>` : ''}
          </button>
        `;
      }).join('');

      return `
        <div class="world-section">
          <div class="world-title">${world.name}</div>
          <div class="world-subtitle">${world.subtitle}</div>
          <div class="stage-grid">
            ${buttons}
          </div>
        </div>
      `;
    }).join('');

    const backBtnText = this.isDarkMode ? '◀ <span>もどる</span>' : '◀ <span>もどる</span>';
    const dressupBtnText = this.isDarkMode ? '🔮 <span>きせかえ</span>' : '👗 <span>きせかえ</span>';

    screen.innerHTML = `
      <div class="header">
        <button class="header-back" id="stage-back">${backBtnText}</button>
        <div class="header-title">${this.isDarkMode ? '🔮 ステージ' : 'ステージ'}</div>
        <button class="header-btn" id="stage-dressup">${dressupBtnText}</button>
      </div>
      <div class="stage-scroll">
        ${worldHTML}
      </div>
    `;

    this.switchScreen(screen);

    // イベント
    screen.querySelector('#stage-back').addEventListener('click', () => {
      this.sound.playTap();
      this.showProfileSelect('play');
    });

    screen.querySelector('#stage-dressup').addEventListener('click', () => {
      this.sound.playTap();
      this.dressup.show('stage'); // stage から遷移
    });

    screen.querySelectorAll('.stage-btn:not(.locked)').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sound.playTap();
        this.game.show(btn.dataset.id);
      });
    });
  }

  toggleDarkMode(enabled) {
    this.isDarkMode = enabled;
    localStorage.setItem('punicode-darkmode', enabled ? 'true' : 'false');
    document.body.classList.toggle('dark-mode', enabled);
    this.sound.isDarkMode = enabled;
  }

  triggerDarkModeEvent(x, y) {
    const app = document.getElementById('app');
    app.classList.add('glitch-shake');
    this.sound.playDarkIn();
    
    this.particles.emit('abyss', x, y, 60);
    this.particles.emit('glitch', x, y, 40);

    let flash = document.querySelector('.flash-overlay');
    if (!flash) {
      flash = document.createElement('div');
      flash.className = 'flash-overlay';
      document.body.appendChild(flash);
    }
    
    flash.offsetHeight;
    flash.classList.add('active');

    setTimeout(() => {
      app.classList.remove('glitch-shake');
      this.toggleDarkMode(true);
      this.showTitle();
      
      setTimeout(() => {
        flash.classList.remove('active');
      }, 50);
    }, 450);
  }

  triggerNormalModeEvent(x, y) {
    const app = document.getElementById('app');
    app.classList.add('glitch-shake');
    this.sound.playDarkOut();
    
    this.particles.emit('magic', x, y, 50);
    this.particles.emit('star', x, y, 50);

    let flash = document.querySelector('.flash-overlay');
    if (!flash) {
      flash = document.createElement('div');
      flash.className = 'flash-overlay';
      document.body.appendChild(flash);
    }
    
    flash.offsetHeight;
    flash.classList.add('active');

    setTimeout(() => {
      app.classList.remove('glitch-shake');
      this.toggleDarkMode(false);
      this.showTitle();

      setTimeout(() => {
        flash.classList.remove('active');
      }, 50);
    }, 450);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});