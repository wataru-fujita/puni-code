// ==========================================================
// ぷにコード - ぷにちゃんキャラクター
// ==========================================================

/**
 * ぷにちゃんのDOM要素を生成する
 * @param {Object} options - 設定
 * @param {string} options.color - ボディカラー (pink/lavender/mint/peach/sky/lemon)
 * @param {string} options.direction - 向き (up/right/down/left)
 * @param {Object} options.accessories - アクセサリー {ribbon, crown, flower, hat, glasses, cheeks}
 * @returns {HTMLElement} ぷにちゃんのDOM要素
 */
export function createCharacter(options = {}) {
  const {
    color = 'pink',
    direction = 'right',
    accessories = {}
  } = options;

  const el = document.createElement('div');
  el.className = 'puni-chan';
  el.setAttribute('data-color', color);
  el.setAttribute('data-dir', direction);
  if (accessories.cheeks) el.classList.add('has-cheeks');

  el.innerHTML = `
    <div class="puni-body">
      <div class="puni-highlight"></div>
      <div class="puni-eyes">
        <div class="puni-eye left">
          <div class="puni-pupil"></div>
          <div class="puni-eye-highlight"></div>
        </div>
        <div class="puni-eye right">
          <div class="puni-pupil"></div>
          <div class="puni-eye-highlight"></div>
        </div>
      </div>
      <div class="puni-mouth">
        <div class="puni-mouth-inner"></div>
      </div>
      <div class="puni-cheek left"></div>
      <div class="puni-cheek right"></div>
      <!-- アクセサリー -->
      <div class="puni-accessory puni-ribbon ${accessories.ribbon ? 'active' : ''}">
        <div class="puni-ribbon-center"></div>
      </div>
      <div class="puni-accessory puni-crown ${accessories.crown ? 'active' : ''}">
        <div class="puni-crown-body"></div>
      </div>
      <div class="puni-accessory puni-flower-acc ${accessories.flower ? 'active' : ''}">🌼</div>
      <div class="puni-accessory puni-hat ${accessories.hat ? 'active' : ''}">
        <div class="puni-hat-top"></div>
        <div class="puni-hat-brim"></div>
      </div>
      <div class="puni-accessory puni-glasses ${accessories.glasses ? 'active' : ''}">
        <div class="puni-glasses-lens"></div>
        <div class="puni-glasses-bridge"></div>
        <div class="puni-glasses-lens"></div>
      </div>
    </div>
  `;

  return el;
}

/**
 * ぷにちゃんにスクイッシュアニメーションを適用
 */
export function squishCharacter(el) {
  const body = el.querySelector('.puni-body');
  if (!body) return;
  body.style.animation = 'none';
  body.offsetHeight; // reflow
  body.style.animation = 'puniSquish 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards';
  setTimeout(() => {
    body.style.animation = '';
  }, 700);
}

/**
 * 移動時のスクイッシュ
 */
export function moveSquish(el) {
  const body = el.querySelector('.puni-body');
  if (!body) return;
  body.style.animation = 'none';
  body.offsetHeight;
  body.style.animation = 'puniMove 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards';
  setTimeout(() => {
    body.style.animation = '';
  }, 600);
}

/**
 * ハッピーバウンス（クリア時）
 */
export function happyBounce(el) {
  const body = el.querySelector('.puni-body');
  if (!body) return;
  el.classList.add('happy');
  body.style.animation = 'none';
  body.offsetHeight;
  body.style.animation = 'puniHappy 1s ease-in-out';
  setTimeout(() => {
    body.style.animation = '';
  }, 1100);
}

/**
 * 向きを変更
 */
export function setDirection(el, dir) {
  el.setAttribute('data-dir', dir);
}

/**
 * 色を変更
 */
export function setColor(el, color) {
  el.setAttribute('data-color', color);
}

/**
 * アクセサリーを切り替え
 */
export function toggleAccessory(el, name, active) {
  const accessoryMap = {
    ribbon: '.puni-ribbon',
    crown: '.puni-crown',
    flower: '.puni-flower-acc',
    hat: '.puni-hat',
    glasses: '.puni-glasses',
    cheeks: null // special
  };

  if (name === 'cheeks') {
    if (active) {
      el.classList.add('has-cheeks');
    } else {
      el.classList.remove('has-cheeks');
    }
    return;
  }

  // 帽子系は排他（ribbon, crown, flower, hat のうち1つだけ）
  const headItems = ['ribbon', 'crown', 'flower', 'hat'];
  if (headItems.includes(name) && active) {
    headItems.forEach(item => {
      if (item !== name) {
        const sel = accessoryMap[item];
        if (sel) {
          const elem = el.querySelector(sel);
          if (elem) elem.classList.remove('active');
        }
      }
    });
  }

  const selector = accessoryMap[name];
  if (selector) {
    const elem = el.querySelector(selector);
    if (elem) {
      if (active) {
        elem.classList.add('active');
      } else {
        elem.classList.remove('active');
      }
    }
  }
}

/**
 * 現在のプレイヤーデータからキャラクターオプションを生成
 */
export function getCharacterOptions(playerData) {
  return {
    color: playerData.color || 'pink',
    direction: 'right',
    accessories: playerData.accessories || {}
  };
}
