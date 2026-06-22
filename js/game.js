// ==========================================================
// ぷにコード - ゲームエンジン
// ==========================================================
import { STAGES, BLOCK_DEFS, DIRECTIONS, turnRight, turnLeft } from './stages.js';
import { createCharacter, setDirection, moveSquish, happyBounce, squishCharacter } from './character.js';

const DARK_HINTS = {
  '1-1': '// ヒント: 「まえにすすむ」を2こ つなげて じっこう しよう！',
  '1-2': '// ヒント: 3回 まえにすすむ プログラムを つくってみよう。',
  '1-3': '// ヒント: ゴールが とおいよ。コマンドを たくさん つなげよう。',
  '1-4': '// ヒント: 「みぎにまわる」で むきを かえてから すすもう。',
  '1-5': '// ヒント: まがりかど が たくさんあるよ。プログラムを デバッグ（しゅうせい）しよう！',
  '2-1': '// ヒント: 左右の まがりかど を よく見て プログラムを つくろう。',
  '2-2': '// ヒント: S字の みち を あるく プログラムをつくろう。',
  '2-3': '// けいこく: かべ に ぶつからないように ルートを かんがえよう！',
  '2-4': '// けいこく: むずかしい めいろ だ！かべ を よくよけよう。',
  '2-5': '// ヒント: 外側を 大きくまわって、まんなかの ゴールを めざそう。',
  '3-1': '// せいり: 4回すすむときは「くりかえし」を つかうと コードが スッキリするよ。',
  '3-2': '// せいり: おなじ うごきを 「くりかえし」に まとめよう。',
  '3-3': '// せいり: おなじ パターンが ないか さがしてみよう！',
  '3-4': '// 設計図: 直進と まがる うごきを ループ（くりかえし）にいれてみよう。',
  '3-5': '// 最終テスト: これまでの ぜんぶを つかって、ゴールを めざそう！'
};

const DARK_BLOCK_DEFS = {
  forward: { id: 'forward', label: 'まえにすすむ', icon: '🐾', cssClass: 'forward' },
  right: { id: 'right', label: 'みぎにまわる', icon: '↻', cssClass: 'turn-right' },
  left: { id: 'left', label: 'ひだりにまわる', icon: '↺', cssClass: 'turn-left' },
  repeat2: { id: 'repeat2', label: '2かいくりかえす', icon: '🔁2', cssClass: 'repeat' },
  repeat3: { id: 'repeat3', label: '3かいくりかえす', icon: '🔁3', cssClass: 'repeat' },
  repeat4: { id: 'repeat4', label: '4かいくりかえす', icon: '🔁4', cssClass: 'repeat' },
};

export class GameEngine {
  constructor(app) {
    this.app = app;
    this.stage = null;
    this.commands = [];
    this.charPos = { x: 0, y: 0 };
    this.charDir = 'right';
    this.isRunning = false;
    this.charEl = null;
    this.gridEl = null;
    this.codeAreaEl = null;
    this.cellSize = 0;
    this.startTime = 0;
    this.timerInterval = null;
    this.elapsedTime = 0;
  }

  // ゲーム画面を表示
  show(stageId) {
    this.stage = STAGES.find(s => s.id === stageId);
    if (!this.stage) return;

    // 既存モーダルを掃除
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());

    this.commands = [];
    this.charPos = { ...this.stage.start };
    this.charDir = this.stage.start.dir;
    this.isRunning = false;
    this.elapsedTime = 0;
    this.startTime = Date.now();
    this.startTimer();

    this.render();
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
      this.updateTimerDisplay();
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerDisplay() {
    const timerEl = this.screenEl ? this.screenEl.querySelector('#timer-value') : null;
    if (timerEl) {
      const mins = Math.floor(this.elapsedTime / 60);
      const secs = this.elapsedTime % 60;
      timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  }

  render() {
    const container = document.getElementById('app');
    const screen = document.createElement('div');
    screen.className = 'screen game-screen';
    screen.id = 'game-screen';

    const bestTime = this.app.playerData.bestTimes ? this.app.playerData.bestTimes[this.stage.id] : null;
    const bestStr = bestTime !== undefined ? `${Math.floor(bestTime / 60)}:${(bestTime % 60).toString().padStart(2, '0')}` : '--:--';

    const isDark = this.app.isDarkMode;
    const hintText = isDark ? (DARK_HINTS[this.stage.id] || '// じゅんび かんりょう。') : this.stage.hint;
    const runBtnLabel = isDark ? '▶ じっこう' : '▶ じっこう';
    const runBtnClass = isDark ? 'btn-stop' : 'btn-accent';
    const undoBtnLabel = isDark ? '⬅ ひとつ もどす' : '⬅ ひとつ けす';
    const resetBtnLabel = isDark ? 'ぜんぶ けす' : '🗑 ぜんぶ けす';
    const codeLabel = isDark ? '💻 プログラム' : '📝 コード';
    const trashLabel = isDark ? '🗑 ここに すてる' : '🗑 ここに ドラッグで けす';

    screen.innerHTML = `
      <div class="header">
        <button class="header-back" id="game-back">◀ <span>もどる</span></button>
        <div class="header-title">${this.stage.name}</div>
        <div class="header-timer">⏱ <span id="timer-value">0:00</span> <span class="best-time">(Best: ${bestStr})</span></div>
      </div>
      <div class="game-content landscape">
        <div class="game-left">
          <div class="grid-container" id="grid-container">
            <div class="grid-map" id="grid-map" style="grid-template-columns:repeat(${this.stage.gridSize},1fr);grid-template-rows:repeat(${this.stage.gridSize},1fr)"></div>
          </div>
          <div class="hint-bubble">${hintText}</div>
          <div class="game-actions">
            <button class="btn ${runBtnClass}" id="btn-run">${runBtnLabel}</button>
            <button class="btn btn-secondary" id="btn-undo">${undoBtnLabel}</button>
            <button class="btn btn-secondary" id="btn-reset">${resetBtnLabel}</button>
          </div>
        </div>
        <div class="game-right">
          <div class="side-content">
            <div class="code-section">
              <div class="code-label">${codeLabel} (最大 ${this.stage.maxBlocks || 10} 行)</div>
              <div class="code-area-container">
                <div class="code-area empty" id="code-area"></div>
              </div>
            </div>
            <div class="block-palette" id="block-palette"></div>
            <div class="trash-drop" id="trash-drop">${trashLabel}</div>
          </div>
        </div>
      </div>
    `;

    // DOM要素の参照を取得（screen内の要素を直接参照）
    this.screenEl = screen;
    this.gridEl = screen.querySelector('.grid-map');
    this.codeAreaEl = screen.querySelector('.code-area');

    // 画面を切り替え
    this.app.switchScreen(screen);

    // グリッド描画（サイズ不要なので先に）
    this.renderGrid();

    // ブロックパレット描画
    this.renderPalette();

    // コマンド初期描画（空行プレースホルダー表示）
    this.renderCommands();

    // ドラッグ＆ドロップの初期化（パレット描画後に実行）
    this.initSortable();

    // イベントリスナー
    screen.querySelector('#game-back').addEventListener('click', () => {
      this.stopTimer();
      this.app.sound.playTap();
      this.app.showStageSelect();
    });

    screen.querySelector('#btn-run').addEventListener('click', () => {
      if (!this.isRunning) {
        this.execute();
      } else {
        this.stopExecution();
      }
    });

    screen.querySelector('#btn-undo').addEventListener('click', () => {
      if (this.isRunning) return;
      try {
        if (this.commands.length > 0) {
          this.commands.pop();
          this.app.sound.playTap();
          this.renderCommands();
          this.resetCharacter(); 
        }
      } catch (e) { console.error(e); this.renderCommands(); this.resetCharacter(); }
    });

    screen.querySelector('#btn-reset').addEventListener('click', () => {
      if (this.isRunning) return;
      try {
        this.commands = [];
        this.app.sound.playTrash();
      } catch (e) { console.error(e); }
      this.renderCommands();
      this.resetCharacter(); 
    });

    // キャラクター配置は画面がレイアウトされた後に実行
    setTimeout(() => {
      this.placeCharacter();
    }, 100);
  }

  // ドラッグ＆ドロップの初期化
  initSortable() {
    const paletteEl = this.screenEl.querySelector('#block-palette');
    const codeAreaEl = this.screenEl.querySelector('#code-area');
    const trashEl = this.screenEl.querySelector('#trash-drop');

    // 通用オプション
    const commonOpts = {
      animation: 150,
      delay: 80,
      delayOnTouchOnly: false,
      touchStartThreshold: 5,
      forceFallback: false,
      fallbackOnBody: false,
      fallbackClass: 'sortable-fallback'
    };

    // パレット（クローン元）
    Sortable.create(paletteEl, {
      ...commonOpts,
      group: {
        name: 'shared',
        pull: 'clone',
        put: false
      },
      sort: false,
      draggable: '.palette-block',
      onMove: (evt) => {
        if (evt.to.id === 'trash-drop') {
          trashEl.classList.add('trash-active');
        } else {
          trashEl.classList.remove('trash-active');
        }
      },
      onEnd: () => {
        trashEl.classList.remove('trash-active');
      }
    });

    // ゴミ箱エリア（ドロップで削除）
    Sortable.create(trashEl, {
      ...commonOpts,
      group: {
        name: 'shared',
        pull: false,
        put: true
      },
      draggable: '.code-block',
      onAdd: (evt) => {
        evt.item.remove(); // 表示上のクローンを消す
        if (evt.from.id === 'code-area') {
          const oldIndex = evt.oldIndex;
          this.commands.splice(oldIndex, 1);
          this.app.sound.playTrash();
          // 非同期で再描画 (Sortableの内部処理完了を待つ)
          setTimeout(() => this.renderCommands(), 0);
        }
      }
    });

    // コーディングエリア（並び替え・受け入れ）
    Sortable.create(codeAreaEl, {
      ...commonOpts,
      group: {
        name: 'shared',
        pull: true,
        put: true
      },
      draggable: '.code-block',
      onMove: (evt) => {
        if (evt.to.id === 'trash-drop') {
          trashEl.classList.add('trash-active');
        } else {
          trashEl.classList.remove('trash-active');
        }
      },
      onEnd: () => {
        trashEl.classList.remove('trash-active');
      },
      onAdd: (evt) => {
        const blockId = evt.item.dataset.id;
        const newIndex = evt.newIndex;

        // 最大ブロック数制限チェック
        if (this.stage.maxBlocks && this.commands.length >= this.stage.maxBlocks) {
          evt.item.remove(); // 追加されたDOMを消す
          this.app.sound.playBump();
          return;
        }

        this.commands.splice(newIndex, 0, blockId);
        this.app.sound.playPop();
        // 非同期で再描画 (Sortableの内部処理完了を待つ)
        setTimeout(() => this.renderCommands(), 0);
      },
      onUpdate: (evt) => {
        const oldIndex = evt.oldIndex;
        const newIndex = evt.newIndex;

        const movedItem = this.commands.splice(oldIndex, 1)[0];
        this.commands.splice(newIndex, 0, movedItem);

        this.app.sound.playPop();
        // 非同期で再描画 (Sortableの内部処理完了を待つ)
        setTimeout(() => this.renderCommands(), 0);
      },
      onRemove: (evt) => {
        const idx = evt.oldIndex;
        if (idx < this.commands.length) {
          this.commands.splice(idx, 1);
          this.app.sound.playRemove();
        }
        // 非同期で再描画 (Sortableの内部処理完了を待つ)
        setTimeout(() => this.renderCommands(), 0);
      }
    });
  }

  renderGrid() {
    this.gridEl.innerHTML = '';
    const { grid, gridSize, goal } = this.stage;

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const cell = document.createElement('div');
        const tile = grid[y][x];
        const isGoal = (x === goal.x && y === goal.y);
        const checkerAlt = (x + y) % 2 === 1;

        if (isGoal) {
          cell.className = 'grid-cell goal';
        } else if (tile === 'W') {
          cell.className = 'grid-cell wall';
          const wallDecos = ['💀', '🪦'];
          const wallDeco = this.app.isDarkMode ? wallDecos[(x + y) % wallDecos.length] : '🌳';
          cell.textContent = wallDeco;
        } else {
          cell.className = `grid-cell ${checkerAlt ? 'walkable-alt' : 'walkable'}`;
          if (tile === 'F') cell.classList.add('deco-flower');
          if (tile === 'T') cell.classList.add('deco-tulip');
        }

        this.gridEl.appendChild(cell);
      }
    }
  }

  placeCharacter(retries = 0) {
    // セルサイズを計算
    const gridContainer = this.screenEl ? this.screenEl.querySelector('.grid-container') : document.getElementById('grid-container');
    if (!gridContainer) return;

    const containerSize = gridContainer.offsetWidth;

    // コンテナのサイズがまだ確定していない場合はリトライ
    if (containerSize <= 0 && retries < 10) {
      setTimeout(() => this.placeCharacter(retries + 1), 50);
      return;
    }

    const gap = 3;
    const padding = 3;
    this.cellSize = (containerSize - padding * 2 - gap * (this.stage.gridSize - 1)) / this.stage.gridSize;

    // 既存のキャラクターを削除
    const existing = this.screenEl ? this.screenEl.querySelector('.grid-character') : null;
    if (existing) existing.remove();

    // キャラクター要素を作成
    const charSize = this.cellSize * 0.75;
    const options = this.app.getCharacterOptions();
    options.direction = this.charDir;

    this.charEl = createCharacter(options);

    const wrapper = document.createElement('div');
    wrapper.className = 'grid-character';
    wrapper.id = 'grid-character';
    wrapper.style.width = charSize + 'px';
    wrapper.style.height = charSize + 'px';
    wrapper.appendChild(this.charEl);

    // 方向矢印インジケータ（3連のシェブロン）を追加
    const arrow = document.createElement('div');
    arrow.className = 'direction-arrow';
    arrow.innerHTML = '<span>➜</span><span>➜</span><span>➜</span>';
    this.updateArrowRotation(arrow, this.charDir);
    wrapper.appendChild(arrow);

    // タッチでぷにぷに
    wrapper.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (this.app.isDarkMode) {
        this.app.sound.playTone(150 + Math.random() * 40, 0.1, 'sawtooth', 0.12);
        this.emitAtChar('abyss', 5);
      } else {
        this.app.sound.playPuni();
        this.emitAtChar('heart', 5);
      }
      squishCharacter(this.charEl);
    });

    gridContainer.appendChild(wrapper);
    this.updateCharPosition(false);
  }

  updateCharPosition(animate = true) {
    const wrapper = this.screenEl ? this.screenEl.querySelector('.grid-character') : null;
    if (!wrapper) return;

    const gap = 3;
    const padding = 3;
    const offset = padding + this.charPos.x * (this.cellSize + gap) + this.cellSize / 2 - wrapper.offsetWidth / 2;
    const offsetY = padding + this.charPos.y * (this.cellSize + gap) + this.cellSize / 2 - wrapper.offsetHeight / 2;

    if (!animate) {
      wrapper.style.transition = 'none';
      wrapper.offsetHeight;
    }

    wrapper.style.left = offset + 'px';
    wrapper.style.top = offsetY + 'px';

    if (!animate) {
      wrapper.offsetHeight;
      wrapper.style.transition = '';
    }

    setDirection(this.charEl, this.charDir);

    // 方向矢印を更新
    const arrow = wrapper.querySelector('.direction-arrow');
    if (arrow) this.updateArrowRotation(arrow, this.charDir);
  }

  emitAtChar(type, count = 10) {
    if (!this.charEl) return;
    const rect = this.charEl.getBoundingClientRect();
    this.app.particles.emit(type, rect.left + rect.width / 2, rect.top + rect.height / 2, count);
  }

  updateArrowRotation(arrow, dir) {
    const rotations = { right: '0deg', down: '90deg', left: '180deg', up: '270deg' };
    arrow.style.transform = `rotate(${rotations[dir] || '0deg'})`;

    // 位置を方向に応じて設定
    arrow.style.top = '';
    arrow.style.bottom = '';
    arrow.style.left = '';
    arrow.style.right = '';
    arrow.style.margin = '';

    if (dir === 'right') {
      arrow.style.right = '-2.0em'; // はみ出し量を増やす
      arrow.style.top = '50%';
      arrow.style.marginTop = '-0.7em';
    } else if (dir === 'left') {
      arrow.style.left = '-2.0em';
      arrow.style.top = '50%';
      arrow.style.marginTop = '-0.7em';
    } else if (dir === 'up') {
      arrow.style.top = '-2.0em';
      arrow.style.left = '50%';
      arrow.style.marginLeft = '-0.7em';
    } else if (dir === 'down') {
      arrow.style.bottom = '-2.0em';
      arrow.style.left = '50%';
      arrow.style.marginLeft = '-0.7em';
    }
  }

  renderPalette() {
    const palette = this.screenEl ? this.screenEl.querySelector('.block-palette') : document.getElementById('block-palette');
    palette.innerHTML = '';

    this.stage.blocks.forEach(blockId => {
      const def = this.app.isDarkMode ? DARK_BLOCK_DEFS[blockId] : BLOCK_DEFS[blockId];
      const btn = document.createElement('div');
      btn.className = `palette-block ${def.cssClass}`;
      btn.dataset.id = blockId;
      btn.innerHTML = `${def.icon} ${def.label}`;

      btn.addEventListener('click', (e) => {
        if (this.isRunning) return;
        if (this.stage.maxBlocks && this.commands.length >= this.stage.maxBlocks) return;
        this.addCommand(blockId, e);
      });
      palette.appendChild(btn);
    });
  }

  addCommand(blockId, event) {
    if (this.stage.maxBlocks && this.commands.length >= this.stage.maxBlocks) {
      this.app.sound.playBump();
      return;
    }
    this.commands.push(blockId);
    this.app.sound.playPop();

    // タップ位置にパーティクル
    if (event) {
      this.app.particles.emit(this.app.isDarkMode ? 'glitch' : 'sparkle', event.clientX, event.clientY, 8);
    }

    this.renderCommands();
  }

  removeLastCommand() {
    if (this.commands.length > 0) {
      this.commands.pop();
      this.app.sound.playRemove();
      this.renderCommands();
    }
  }

  removeCommand(index, event) {
    this.commands.splice(index, 1);
    this.app.sound.playRemove();

    // タップ位置にパーティクル
    if (event) {
      this.app.particles.emit(this.app.isDarkMode ? 'abyss' : 'bubble', event.clientX, event.clientY, 5);
    }

    this.renderCommands();
  }

  resetCommands() {
    this.commands = [];
    this.renderCommands();
    this.resetCharacter();
  }

  renderCommands() {
    this.codeAreaEl.innerHTML = '';
    const max = this.stage.maxBlocks || 10;

    // ループスコープの解析: repeat の次の行は in-loop
    const inLoopSet = new Set();
    for (let i = 0; i < this.commands.length; i++) {
      if (this.commands[i].startsWith('repeat') && i + 1 < this.commands.length) {
        inLoopSet.add(i + 1);
      }
    }

    for (let i = 0; i < max; i++) {
      if (i < this.commands.length) {
        const cmd = this.commands[i];
        const def = this.app.isDarkMode ? DARK_BLOCK_DEFS[cmd] : BLOCK_DEFS[cmd];
        const block = document.createElement('div');

        let extraClass = '';
        if (cmd.startsWith('repeat')) extraClass = ' loop-start';
        if (inLoopSet.has(i)) extraClass = ' in-loop';
        block.className = `code-block ${def.cssClass}${extraClass}`;
        block.dataset.id = cmd;
        block.dataset.index = i;

        const lineNum = document.createElement('span');
        lineNum.className = 'line-num';
        lineNum.textContent = i + 1;

        const content = document.createElement('span');
        content.className = 'block-content';
        content.innerHTML = `${def.icon} ${def.label}`;

        block.appendChild(lineNum);
        block.appendChild(content);
        block.addEventListener('click', (e) => {
          if (this.isRunning) return;
          this.removeCommand(i, e);
        });
        this.codeAreaEl.appendChild(block);
      } else {
        const slot = document.createElement('div');
        slot.className = 'code-slot';
        slot.innerHTML = `<span class="line-num">${i + 1}</span><span class="slot-dot">············</span>`;
        this.codeAreaEl.appendChild(slot);
      }
    }
  }

  resetCharacter() {
    this.charPos = { ...this.stage.start };
    this.charDir = this.stage.start.dir;
    this.updateCharPosition(true);
    if (this.charEl) {
      this.charEl.classList.remove('happy');
    }
  }

  // コマンド実行
  async execute() {
    if (this.commands.length === 0 || this.isRunning) return;

    this.isRunning = true;
    this.updateActionButtons();
    this.resetCharacter();

    try {
      // 少しゆっくり開始
      await this.wait(800);

      const blocks = this.codeAreaEl.querySelectorAll('.code-block');

      let i = 0;
      while (i < this.commands.length && this.isRunning) {
        i = await this.executeCommandBlock(i, blocks);
      }

      // ゴール判定
      if (this.isRunning) {
        if (this.charPos.x === this.stage.goal.x && this.charPos.y === this.stage.goal.y) {
          await this.win();
        } else {
          this.showFailModal();
        }
      }
    } catch (e) {
      console.error('execute() error:', e);
    } finally {
      this.isRunning = false;
      this.updateActionButtons();
    }
  }

  stopExecution() {
    this.isRunning = false;
    this.resetCharacter();
    this.updateActionButtons();
    this.app.sound.playRemove();
  }

  updateActionButtons() {
    const runBtn = this.screenEl ? this.screenEl.querySelector('#btn-run') : null;
    const undoBtn = this.screenEl ? this.screenEl.querySelector('#btn-undo') : null;
    const resetBtn = this.screenEl ? this.screenEl.querySelector('#btn-reset') : null;
    const backBtn = this.screenEl ? this.screenEl.querySelector('#game-back') : null;
    const isDark = this.app.isDarkMode;

    if (runBtn) {
      if (this.isRunning) {
        runBtn.innerHTML = '⏹ ストップ';
        runBtn.className = 'btn btn-secondary btn-stop';
      } else {
        runBtn.innerHTML = '▶ じっこう';
        runBtn.className = isDark ? 'btn btn-stop' : 'btn btn-accent';
      }
    }

    if (undoBtn) undoBtn.disabled = this.isRunning;
    if (resetBtn) resetBtn.disabled = this.isRunning;
    if (backBtn) backBtn.disabled = this.isRunning;
  }

  // idx 番目のコマンド（ループならその内部含む）を実行し、次に実行すべきインデックスを返す
  async executeCommandBlock(idx, blocks) {
    if (!this.isRunning || idx >= this.commands.length) return idx + 1;

    const cmd = this.commands[idx];
    
    // 実行中ハイライト
    blocks[idx]?.classList.add('executing');
    blocks[idx]?.scrollIntoView({ behavior: 'smooth', inline: 'center' });

    if (cmd.startsWith('repeat')) {
      const count = parseInt(cmd.replace('repeat', ''));
      const nextIdx = idx + 1;
      
      // ループ対象のコマンドのスパンを計算
      const childSpan = this.getCommandSpan(nextIdx);
      
      if (nextIdx < this.commands.length) {
        for (let c = 0; c < count; c++) {
          if (!this.isRunning) break;
          
          // ループ対象のコマンドを実行
          await this.executeCommandBlock(nextIdx, blocks);
        }
      }
      
      await this.wait(400); // ループ終了時の少しのウェイト
      blocks[idx]?.classList.remove('executing');
      return nextIdx + childSpan;
    } else {
      const success = await this.performAction(cmd);
      if (!success) {
        this.isRunning = false;
      }
      await this.wait(600);
      blocks[idx]?.classList.remove('executing');
      return idx + 1;
    }
  }

  // あるインデックスのコマンドが占めるスパン（行数）を計算
  getCommandSpan(idx) {
    if (idx >= this.commands.length) return 0;
    const cmd = this.commands[idx];
    if (cmd.startsWith('repeat')) {
      return 1 + this.getCommandSpan(idx + 1);
    }
    return 1;
  }

  async performAction(cmd) {
    if (cmd === 'forward') {
      const success = this.moveForward();
      if (!success) {
        this.app.sound.playBump();
        const wrapper = this.screenEl ? this.screenEl.querySelector('.grid-character') : null;
        if (wrapper) {
          wrapper.classList.add('error-shake', 'bumped-active');
          this.charEl.classList.add('bumped');
        }
        this.emitAtChar(this.app.isDarkMode ? 'abyss' : 'bubble', 8);

        await this.wait(800);
        if (wrapper) {
          wrapper.classList.remove('error-shake', 'bumped-active');
          this.charEl.classList.remove('bumped');
        }
        return true;
      }
      this.app.sound.playMove();
      moveSquish(this.charEl);
      this.updateCharPosition(true);

      const rect = this.charEl.getBoundingClientRect();
      this.app.particles.emitTrail(rect.left + rect.width / 2, rect.top + rect.height / 2, this.app.isDarkMode);
      return true;

    } else if (cmd === 'right' || cmd === 'left') {
      const isRight = cmd === 'right';
      this.charDir = isRight ? turnRight(this.charDir) : turnLeft(this.charDir);
      this.app.sound.playTurn();
      this.updateCharPosition(true);

      const rect = this.charEl.getBoundingClientRect();
      this.app.particles.emit(this.app.isDarkMode ? 'glitch' : 'star', rect.left + rect.width / 2, rect.top + rect.height / 2, 12);
      return true;
    }
    return true;
  }

  moveForward() {
    const dir = DIRECTIONS[this.charDir];
    const nx = this.charPos.x + dir.dx;
    const ny = this.charPos.y + dir.dy;

    // 範囲外チェック
    if (nx < 0 || nx >= this.stage.gridSize || ny < 0 || ny >= this.stage.gridSize) {
      return false;
    }

    // 壁チェック
    if (this.stage.grid[ny][nx] === 'W') {
      return false;
    }

    this.charPos.x = nx;
    this.charPos.y = ny;
    return true;
  }

  async win() {
    this.stopTimer();
    // ハッピーバウンス！
    happyBounce(this.charEl);
    this.app.sound.playClear();

    // パーティクル
    const wrapper = this.screenEl ? this.screenEl.querySelector('.grid-character') : null;
    const rect = wrapper.getBoundingClientRect();
    this.app.particles.celebrate(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
      this.app.isDarkMode
    );

    await this.wait(800);

    // 結果を保存
    const stars = this.calculateStars();
    this.app.saveStageResult(this.stage.id, stars, this.elapsedTime);

    this.showWinModal(stars);
  }

  calculateStars() {
    const cmdCount = this.commands.length;
    if (cmdCount <= this.stage.stars3) return 3;
    if (cmdCount <= this.stage.stars2) return 2;
    return 1;
  }

  showWinModal(stars) {
    const isBest = this.elapsedTime === this.app.playerData.bestTimes[this.stage.id];
    const isDark = this.app.isDarkMode;
    const bestIcon = isBest ? (isDark ? '🔮' : '🎉') : '';
    const stageIndex = STAGES.findIndex(s => s.id === this.stage.id);
    const hasNext = stageIndex < STAGES.length - 1;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';

    const titleText = isDark ? 'プログラム せいこう！' : 'クリア！';
    const starEmoji = isDark ? '💻' : '⭐';
    const starEmptyEmoji = isDark ? '・' : '☆';
    const timeLabel = isDark ? 'タイム: ' : '今回のタイム: ';

    let msg = '';
    if (isDark) {
      msg = stars === 3 ? 'プログラムに エラーなし！<br>かんぺきな プログラミングだ！💻✨' : 'プログラム せいこう！<br>もっと みじかいコードに できるかな？🚀';
    } else {
      msg = stars === 3 ? 'パーフェクト！てんさーい！💖' : 'すごーい！つぎもがんばろう！✨';
    }

    const nextBtnLabel = isDark ? 'つぎのステージへ ▶' : 'つぎへ ▶';
    const nextBtnClass = isDark ? 'btn-stop' : 'btn-primary';
    const retryBtnLabel = isDark ? 'もういちど じっこう' : 'もういちど';
    const backBtnLabel = isDark ? 'ステージを えらぶ' : 'ステージにもどる';

    overlay.innerHTML = `
      <div class="modal-content">
        <div class="modal-title">${titleText}</div>
        <div class="modal-stars">
          ${Array(3).fill(0).map((_, i) => `<span class="modal-star">${i < stars ? starEmoji : starEmptyEmoji}</span>`).join('')}
        </div>
        <div class="modal-result-time">
          ${timeLabel}${Math.floor(this.elapsedTime / 60)}:${(this.elapsedTime % 60).toString().padStart(2, '0')} ${bestIcon}
        </div>
        <div class="modal-message">
          ${msg}
        </div>
        <div class="modal-buttons">
          ${hasNext ? `<button class="btn ${nextBtnClass}" id="modal-next">${nextBtnLabel}</button>` : ''}
          <button class="btn btn-accent btn-small" id="modal-retry">${retryBtnLabel}</button>
          <button class="btn btn-secondary btn-small" id="modal-back">${backBtnLabel}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('active'));

    // イベント
    if (hasNext) {
      document.getElementById('modal-next')?.addEventListener('click', () => {
        this.app.sound.playTap();
        overlay.remove();
        const nextStage = STAGES[stageIndex + 1];
        this.show(nextStage.id);
      });
    }

    document.getElementById('modal-retry')?.addEventListener('click', () => {
      this.app.sound.playTap();
      overlay.remove();
      this.show(this.stage.id);
    });

    document.getElementById('modal-back')?.addEventListener('click', () => {
      this.app.sound.playTap();
      overlay.remove();
      this.app.showStageSelect();
    });
  }

  showFailModal() {
    const isDark = this.app.isDarkMode;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const titleText = isDark ? 'バグ はっせい！ (Error)' : '🤔 おしい！';
    const msgText = isDark 
      ? 'ゴールに たどりつけなかったよ。<br>プログラムの まちがい（バグ）を なおそう！' 
      : 'ゴールにたどりつけなかったよ。<br>もういちどかんがえてみよう！';
    const retryBtnLabel = isDark ? 'プログラムを なおす' : 'もういちど やる';
    const backBtnLabel = isDark ? 'ステージを えらぶ' : 'ステージにもどる';

    overlay.innerHTML = `
      <div class="modal-content modal-fail">
        <div class="modal-title">${titleText}</div>
        <div class="modal-message">${msgText}</div>
        <div class="modal-buttons">
          <button class="btn btn-primary" id="fail-retry">${retryBtnLabel}</button>
          <button class="btn btn-secondary btn-small" id="fail-back">${backBtnLabel}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('active'));

    document.getElementById('fail-retry').addEventListener('click', () => {
      this.app.sound.playTap();
      overlay.remove();
      this.isRunning = false;
      this.updateActionButtons();
      this.resetCommands();
    });

    document.getElementById('fail-back').addEventListener('click', () => {
      this.app.sound.playTap();
      overlay.remove();
      this.app.showStageSelect();
    });
  }

  wait(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}
