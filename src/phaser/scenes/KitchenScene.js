// src/phaser/scenes/KitchenScene.js
import BaseScene from './BaseScene';
import { createClickArea } from '../utils/createClickArea';

export default class KitchenScene extends BaseScene {
  constructor() {
    super({ key: 'KitchenScene' });
  }

  init() {
    // 상태 초기화
    this.activeArea = null;

    // 힌트 메시지 인덱스 (순환용)
    this.hintIndex = window.kitchenSceneHintIndex || {
      fridge: 0
    };

    // 아이템 획득 상태 (씬 재방문 시에도 유지)
    this.collectedItems = window.kitchenSceneCollectedItems || {
      // 찬장
      paper3: false,
      // 냉장고
      fridgeUnlocked: false,  // pendant로 잠금 해제
      fresh_cream: false,
      // 식탁
      tablePuzzleSolved: false,
      book: false
    };

    // OX 퍼즐 상태 (3x3)
    // 정답: OOX / XXO / OXO
    // null = 빈칸, 'O', 'X'
    this.oxPuzzle = window.kitchenOxPuzzle || [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ];
  }

  create() {
    super.create();

    const { width, height } = this.cameras.main;

    // 배경 표시
    this.background = this.add.image(width / 2, height / 2, 'kitchen')
      .setOrigin(0.5)
      .setDisplaySize(width, height);

    // 터치 가능한 영역들 생성
    this.createInteractiveAreas();

    // DialogBox 이벤트 리스닝
    this.handleDialogClick = () => {};
    window.addEventListener('dialogClick', this.handleDialogClick);
  }

  createInteractiveAreas() {
    const { width, height } = this.cameras.main;

    // 1. 찬장 영역 (paper3 획득)
    this.sideboardArea = createClickArea(this,
      width * 0.2,    // TODO: 위치 조정
      height * 0.36,
      150, 60,
      () => this.showSideboardPopup(),
      0  // 디버그용
    );

    // 2. 냉장고 영역 (pendant로 잠금해제 + fresh_cream 획득)
    this.fridgeArea = createClickArea(this,
      width * 0.2,    // TODO: 위치 조정
      height * 0.58,
      150, 60,
      () => this.showFridgePopup(),
      0  // 디버그용
    );

    // 3. 식탁 영역 (OX 퍼즐 + book 획득)
    this.tableArea = createClickArea(this,
      width * 0.2,    // TODO: 위치 조정
      height * 0.72,
      150, 60,
      () => this.showTablePopup(),
      0  // 디버그용
    );

    // 4. 작업대 영역 (나중에 구현)
    this.worktableArea = createClickArea(this,
      width * 0.2,    // TODO: 위치 조정
      height * 0.81,
      150, 60,
      () => this.showWorktablePopup(),
      0.3  // 디버그용
    );

    // 5. 되돌아가기 영역 (CabinInsideScene으로)
    this.backArea = createClickArea(this,
      width * 0.5,
      height * 1,
      210, 80,
      () => this.goBack(),
      0
    );
  }

  // ========== 찬장 팝업 (paper3) ==========
  showSideboardPopup() {
    const { width, height } = this.cameras.main;
    this.activeArea = 'sideboard';
    this.disableAllAreas();

    const isCollected = this.collectedItems.paper3;

    this.scene.launch('PopupScene', {
      popupImage: isCollected ? 'sideboard_after' : 'sideboard_before',
      popupSize: { width: 500, height: 500 },
      clickAreas: isCollected ? [] : [{
        x: width / 3.48,       // TODO: paper3 위치 조정
        y: height / 2,
        width: 100,
        height: 100,
        debugAlpha: 0.3,
        callback: (popupScene) => this.collectPaper3(popupScene)
      }],
      onClose: () => {
        this.enableAllAreas();
        this.activeArea = null;
      }
    });
  }

  collectPaper3(popupScene) {
    this.collectedItems.paper3 = true;
    this.saveState();

    this.addItem({
      id: 'paper3',
      name: '종이조각3',
      image: 'assets/images/items/paper3.png'
    });

    popupScene.changePopupImage('sideboard_after');
    popupScene.removeClickAreas();
  }

  // ========== 냉장고 팝업 (pendant -> fresh_cream) ==========
  showFridgePopup() {
    const { width, height } = this.cameras.main;
    this.activeArea = 'fridge';
    this.disableAllAreas();

    // fresh_cream 획득 완료
    if (this.collectedItems.fresh_cream) {
      this.scene.launch('PopupScene', {
        popupImage: 'fridge_opened',
        popupSize: { width: 500, height: 500 },
        clickAreas: [],
        onClose: () => {
          this.enableAllAreas();
          this.activeArea = null;
        }
      });
      return;
    }

    // 잠금 해제됨 -> fresh_cream 획득 가능
    if (this.collectedItems.fridgeUnlocked) {
      this.scene.launch('PopupScene', {
        popupImage: 'fridge_fresh_cream',
        popupSize: { width: 500, height: 500 },
        clickAreas: [{
          x: width / 2.3,       // TODO: fresh_cream 위치 조정
          y: height / 1.6,
          width: 150,
          height: 60,
          debugAlpha: 0,
          callback: (popupScene) => this.collectFresh_cream(popupScene)
        }],
        onClose: () => {
          this.enableAllAreas();
          this.activeArea = null;
        }
      });
      return;
    }

    // 잠긴 냉장고
    this.scene.launch('PopupScene', {
      popupImage: 'fridge_locked',
      popupSize: { width: 500, height: 500 },
      clickAreas: [{
        x: width / 2.5,
        y: height / 2,
        width: 200,
        height: 200,
        debugAlpha: 0,
        callback: () => this.tryUnlockFridge()
      }],
      onClose: () => {
        this.enableAllAreas();
        this.activeArea = null;
      }
    });
  }

  // pendant로 냉장고 잠금 해제 시도
  tryUnlockFridge() {
    if (this.checkSelectedItem('pendant')) {
      this.collectedItems.fridgeUnlocked = true;
      this.saveState();
      this.removeItem('pendant');

      // 팝업 재실행 (fridge_fresh_cream로)
      this.scene.stop('PopupScene');
      this.showFridgePopup();
    } else {
      const hints = [
        '잠겨있어...',
        '맞는 팬던트가 있을거야...'
      ];
      this.showRotatingHint('fridge', hints);
    }
  }

  collectFresh_cream(popupScene) {
    this.collectedItems.fresh_cream = true;
    this.saveState();

    this.addItem({
      id: 'fresh_cream',
      name: '우유',
      image: 'assets/images/items/fresh_cream.png'
    });

    popupScene.changePopupImage('fridge_opened');
    popupScene.removeClickAreas();
  }

  // ========== 식탁 팝업 (OX 퍼즐 -> book) ==========
  showTablePopup() {
    const { width, height } = this.cameras.main;
    this.activeArea = 'table';
    this.disableAllAreas();

    // book 획득 완료 -> table_after + book 없음
    if (this.collectedItems.book) {
      this.scene.launch('PopupScene', {
        popupImage: 'table_after',
        popupSize: { width: 500, height: 500 },
        clickAreas: [],
        onClose: () => {
          this.enableAllAreas();
          this.activeArea = null;
        }
      });
      return;
    }

    // 퍼즐 완료 -> table_after + book_overlay로 book 획득 가능
    if (this.collectedItems.tablePuzzleSolved) {
      this.scene.launch('PopupScene', {
        popupImage: 'table_after',
        popupSize: { width: 500, height: 500 },
        clickAreas: [{
          x: width / 2,       // TODO: book 위치 조정
          y: height / 2,
          width: 100,
          height: 150,
          debugAlpha: 0,
          callback: (popupScene) => this.collectBook(popupScene)
        }],
        overlayItems: [{
          key: 'book_overlay',
          x: width / 2,
          y: height / 2
        }],
        onClose: () => {
          this.enableAllAreas();
          this.activeArea = null;
        }
      });
      return;
    }

    // OX 퍼즐 진행 중
    this.scene.launch('PopupScene', {
      popupImage: 'table_before',
      popupSize: { width: 500, height: 500 },
      clickAreas: this.getOxPuzzleClickAreas(),
      overlayItems: this.getOxPuzzleOverlayItems(),
      onClose: () => {
        this.enableAllAreas();
        this.activeArea = null;
      }
    });
  }

  // OX 퍼즐 오버레이 (현재 O, X 표시)
  getOxPuzzleOverlayItems() {
    const { width, height } = this.cameras.main;
    const items = [];

    // 3x3 그리드 위치
    const cellSize = 80;
    const startX = width / 2 - cellSize;
    const startY = height / 2 - cellSize;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const value = this.oxPuzzle[row][col];
        if (value) {
          items.push({
            key: value === 'O' ? 'ox_o' : 'ox_x',
            x: startX + col * cellSize,
            y: startY + row * cellSize
          });
        }
      }
    }

    return items;
  }

  // OX 퍼즐 클릭 영역 (각 셀 + 확인 버튼)
  getOxPuzzleClickAreas() {
    const { width, height } = this.cameras.main;
    const clickAreas = [];

    // 3x3 그리드 위치
    const cellSize = 80;
    const startX = width / 2 - cellSize;
    const startY = height / 2 - cellSize;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        clickAreas.push({
          x: startX + col * cellSize,
          y: startY + row * cellSize,
          width: 70,
          height: 70,
          debugAlpha: 0.3,
          callback: () => this.onOxCellClick(row, col)
        });
      }
    }

    // 확인 버튼
    clickAreas.push({
      x: width / 2,
      y: height / 2 + 150,
      width: 100,
      height: 40,
      debugAlpha: 0.3,
      callback: () => this.checkOxPuzzle()
    });

    return clickAreas;
  }

  // OX 셀 클릭 (null -> O -> X -> null 순환)
  onOxCellClick(row, col) {
    const current = this.oxPuzzle[row][col];
    if (current === null) {
      this.oxPuzzle[row][col] = 'O';
    } else if (current === 'O') {
      this.oxPuzzle[row][col] = 'X';
    } else {
      this.oxPuzzle[row][col] = null;
    }
    this.saveOxPuzzle();

    // 팝업 갱신
    this.scene.stop('PopupScene');
    this.showTablePopup();
  }

  // OX 퍼즐 정답 체크
  checkOxPuzzle() {
    // 정답: OOX / XXO / OXO
    const answer = [
      ['O', 'O', 'X'],
      ['X', 'X', 'O'],
      ['O', 'X', 'O']
    ];

    let correct = true;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (this.oxPuzzle[row][col] !== answer[row][col]) {
          correct = false;
          break;
        }
      }
      if (!correct) break;
    }

    if (correct) {
      this.collectedItems.tablePuzzleSolved = true;
      this.saveState();

      // 팝업 갱신 (table_after + book)
      this.scene.stop('PopupScene');
      this.showTablePopup();
    } else {
      this.showHintDialog('틀렸어...');
    }
  }

  collectBook(popupScene) {
    this.collectedItems.book = true;
    this.saveState();

    this.addItem({
      id: 'book',
      name: '책',
      image: 'assets/images/items/book.png'
    });

    // book overlay 제거하고 table_after만 표시
    this.scene.stop('PopupScene');
    this.showTablePopup();
  }

  // ========== 작업대 팝업 (나중에 구현) ==========
  showWorktablePopup() {
    this.activeArea = 'worktable';
    this.disableAllAreas();

    this.scene.launch('PopupScene', {
      popupImage: 'worktable',
      popupSize: { width: 500, height: 500 },
      clickAreas: [],
      onClose: () => {
        this.enableAllAreas();
        this.activeArea = null;
      }
    });
  }

  // ========== 유틸리티 메서드 ==========
  saveState() {
    window.kitchenSceneCollectedItems = this.collectedItems;
  }

  saveOxPuzzle() {
    window.kitchenOxPuzzle = this.oxPuzzle;
  }

  checkSelectedItem(itemId) {
    return window.gameSelectedItem === itemId;
  }

  addItem(item) {
    window.dispatchEvent(new CustomEvent('addItem', { detail: item }));
  }

  removeItem(itemId) {
    window.dispatchEvent(new CustomEvent('removeItem', { detail: { id: itemId } }));
  }

  goBack() {
    this.fadeToScene('CabinInsideScene');
  }

  showHintDialog(message) {
    window.dispatchEvent(new CustomEvent('showHintDialog', { detail: { message } }));
  }

  // 순환 힌트 메시지 표시
  showRotatingHint(key, hints) {
    const currentIndex = this.hintIndex[key] || 0;
    const message = hints[currentIndex];

    this.hintIndex[key] = (currentIndex + 1) % hints.length;
    window.kitchenSceneHintIndex = this.hintIndex;

    this.showHintDialog(message);
  }

  disableAllAreas() {
    const areas = [this.sideboardArea, this.fridgeArea, this.tableArea, this.worktableArea, this.backArea];
    areas.forEach(area => {
      if (area) area.disableInteractive();
    });
  }

  enableAllAreas() {
    const areas = [this.sideboardArea, this.fridgeArea, this.tableArea, this.worktableArea, this.backArea];
    areas.forEach(area => {
      if (area) area.setInteractive({ useHandCursor: true });
    });
  }

  shutdown() {
    window.removeEventListener('dialogClick', this.handleDialogClick);
  }
}
