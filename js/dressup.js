// ==========================================================
// ぷにコード - きせかえ画面
// ==========================================================
import { createCharacter, setColor, toggleAccessory, squishCharacter } from './character.js';

const COLORS = ['pink', 'lavender', 'mint', 'peach', 'sky', 'lemon'];

const ACCESSORIES = [
  { id: 'ribbon', name: 'リボン', icon: '🎀', unlockStage: null },
  { id: 'cheeks', name: 'ほっぺ', icon: '😊', unlockStage: null },
  { id: 'flower', name: 'おはな', icon: '🌼', unlockStage: '1-2' },
  { id: 'crown', name: 'おうかん', icon: '👑', unlockStage: '1-4' },
  { id: 'hat', name: 'ぼうし', icon: '🎩', unlockStage: '1-6' },
  { id: 'glasses', name: 'めがね', icon: '👓', unlockStage: '1-8' },
];

export class DressUpScreen {
  constructor(app) {
    this.app = app;
    this.previewEl = null;
    this.charEl = null;
  }

  show(backTo = 'title') {
    const screen = document.createElement('div');
    screen.className = 'screen dressup-screen';
    screen.id = 'dressup-screen';

    const playerData = this.app.playerData;

    screen.innerHTML = `
      <div class="header">
        <button class="header-back" id="dressup-back">◀ <span>もどる</span></button>
        <div class="header-title">👗 きせかえ</div>
        <div style="width:60px"></div>
      </div>
      <div class="dressup-content">
        <div class="dressup-preview" id="dressup-preview"></div>

        <div class="dressup-section">
          <div class="dressup-section-title">🎨 いろをえらぼう</div>
          <div class="color-palette" id="color-palette">
            ${COLORS.map(c => `
              <div class="color-swatch ${c === playerData.color ? 'selected' : ''}"
                   data-color="${c}"></div>
            `).join('')}
          </div>
        </div>

        <div class="dressup-section">
          <div class="dressup-section-title">✨ アクセサリー</div>
          <div class="accessory-grid" id="accessory-grid">
            ${ACCESSORIES.map(acc => {
              const isUnlocked = !acc.unlockStage || this.isStageCleared(acc.unlockStage);
              const isSelected = playerData.accessories?.[acc.id] || false;
              return `
                <button class="accessory-btn ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}"
                        data-id="${acc.id}" ${!isUnlocked ? 'disabled' : ''}>
                  <span class="accessory-icon">${acc.icon}</span>
                  <span>${isUnlocked ? acc.name : '🔒'}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    this.app.switchScreen(screen);

    // プレビューキャラクターを配置
    this.previewEl = document.getElementById('dressup-preview');
    this.charEl = createCharacter(this.app.getCharacterOptions());
    this.previewEl.appendChild(this.charEl);

    // タッチでぷにぷに
    this.previewEl.addEventListener('pointerdown', () => {
      this.app.sound.playPuni();
      squishCharacter(this.charEl);
    });

    // イベントリスナー
    document.getElementById('dressup-back').addEventListener('click', () => {
      this.app.sound.playTap();
      if (backTo === 'stage') {
        this.app.showStageSelect();
      } else if (backTo === 'profile') {
        this.app.showProfileSelect();
      } else {
        this.app.showTitle();
      }
    });

    // 色選択
    document.getElementById('color-palette').addEventListener('click', (e) => {
      const swatch = e.target.closest('.color-swatch');
      if (!swatch) return;
      const color = swatch.dataset.color;
      this.app.sound.playChange();

      // UIを更新
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      swatch.classList.add('selected');

      // キャラクターを更新
      setColor(this.charEl, color);
      this.app.playerData.color = color;
      this.app.savePlayerData();

      squishCharacter(this.charEl);
    });

    // アクセサリー選択
    document.getElementById('accessory-grid').addEventListener('click', (e) => {
      const btn = e.target.closest('.accessory-btn');
      if (!btn || btn.disabled) return;

      const id = btn.dataset.id;
      this.app.sound.playChange();

      // トグル
      if (!this.app.playerData.accessories) this.app.playerData.accessories = {};
      const isActive = !this.app.playerData.accessories[id];

      // 帽子系は排他
      const headItems = ['ribbon', 'crown', 'flower', 'hat'];
      if (headItems.includes(id) && isActive) {
        headItems.forEach(item => {
          if (item !== id) {
            this.app.playerData.accessories[item] = false;
            toggleAccessory(this.charEl, item, false);
            document.querySelector(`.accessory-btn[data-id="${item}"]`)?.classList.remove('selected');
          }
        });
      }

      this.app.playerData.accessories[id] = isActive;
      toggleAccessory(this.charEl, id, isActive);

      btn.classList.toggle('selected', isActive);
      this.app.savePlayerData();

      squishCharacter(this.charEl);
    });
  }

  isStageCleared(stageId) {
    return this.app.playerData.stages?.[stageId]?.cleared || false;
  }
}
