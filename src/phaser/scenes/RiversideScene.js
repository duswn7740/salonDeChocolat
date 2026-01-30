// src/phaser/scenes/RiversideScene.js
import BaseScene from './BaseScene';
import { createClickArea } from '../utils/createClickArea';

export default class RiversideScene extends BaseScene {
  constructor() {
    super({ key: 'RiversideScene' });
  }

  init() {
    // 상태 초기화
    this.activeArea = null;

    // 힌트 메시지 인덱스 (순환용)
    this.hintIndex = window.riversideSceneHintIndex || {
      sluice: 0,
      box: 0
    };

    // 아이템 획득 상태 (씬 재방문 시에도 유지)
    this.collectedItems = window.riversideSceneCollectedItems || {
      sluiceOpened: false,    // gear로 수문 열기
      boxUnlocked: false,     // coin(knight)으로 상자 잠금 해제
      knightPuzzleSolved: false,  // 나이트 퍼즐 완료
      paper4: false           // paper4 획득
    };

    // 나이트 퍼즐 상태 (5x5 보드)
    // -1 = 미방문, 0+ = 방문 순서
    this.knightBoard = window.riversideKnightBoard || this.createEmptyBoard();
    this.knightPosition = window.riversideKnightPosition || null;  // {row, col}
    this.moveCount = window.riversideMoveCount || 0;
  }

  createEmptyBoard() {
    return [
      [-1, -1, -1, -1, -1],
      [-1, -1, -1, -1, -1],
      [-1, -1, -1, -1, -1],
      [-1, -1, -1, -1, -1],
      [-1, -1, -1, -1, -1]
    ];
  }

  create() {
    super.create();

    const { width, height } = this.cameras.main;

    // 배경 표시 (수문 열림 여부에 따라)
    const bgKey = this.collectedItems.sluiceOpened ? 'riverside_open' : 'riverside';
    this.background = this.add.image(width / 2, height / 2, bgKey)
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

    // 1. 수문/동굴 영역
    // 수문이 열렸으면 바로 동굴로 이동, 아니면 팝업 표시
    this.sluiceArea = createClickArea(this,
      width * 0.4,    // TODO: 위치 조정
      height * 0.3,
      500, 50,
      () => this.onSluiceClick(),
      0.3
    );

    // 2. 상자 영역
    this.boxArea = createClickArea(this,
      width * 0.4,    // TODO: 위치 조정
      height * 0.48,
      500, 50,
      () => this.showBoxPopup(),
      0.3
    );

    // 3. 되돌아가기 영역 (CabinOutsideScene으로)
    this.backArea = createClickArea(this,
      width * 0.5,
      height * 1,
      210, 80,
      () => this.goBack(),
      0
    );
  }

  // ========== 수문 클릭 처리 ==========
  onSluiceClick() {
    // 수문이 열렸으면 바로 동굴로 이동 (팝업 없이)
    if (this.collectedItems.sluiceOpened) {
      this.fadeToScene('CaveScene');
      return;
    }

    // 수문이 닫혀있으면 팝업 표시
    this.showSluicePopup();
  }

  // 수문 팝업 (gear 사용)
  showSluicePopup() {
    const { width, height } = this.cameras.main;
    this.activeArea = 'sluice';
    this.disableAllAreas();

    // 수문 닫힘 -> gear 사용
    this.scene.launch('PopupScene', {
      popupImage: 'sluice_closed',
      popupSize: { width: 500, height: 500 },
      clickAreas: [{
        x: width / 2,
        y: height / 2,
        width: 150,
        height: 150,
        debugAlpha: 0,
        callback: () => this.tryOpenSluice()
      }],
      onClose: () => {
        this.enableAllAreas();
        this.activeArea = null;
      }
    });
  }

  tryOpenSluice() {
    if (this.checkSelectedItem('gear')) {
      this.collectedItems.sluiceOpened = true;
      this.saveState();
      this.removeItem('gear');

      // 배경 변경
      const { width, height } = this.cameras.main;
      this.background.setTexture('riverside_open');
      this.background.setDisplaySize(width, height);

      // 힌트 메시지 표시
      this.showHintDialog('문이 열렸다!');

      // 팝업 닫기
      this.scene.stop('PopupScene');
      this.enableAllAreas();
      this.activeArea = null;
    } else {
      const hints = [
        '수문이 닫혀있어...',
        '톱니바퀴 모양의 뭔가가 필요해...'
      ];
      this.showRotatingHint('sluice', hints);
    }
  }

  // 동굴로 이동
  goToCave() {
    this.scene.stop('PopupScene');
    this.fadeToScene('CaveScene');
  }

  // ========== 상자 팝업 (coin/knight로 잠금해제 -> 나이트 퍼즐) ==========
  showBoxPopup() {
    const { width, height } = this.cameras.main;
    this.activeArea = 'box';
    this.disableAllAreas();

    // paper4 획득 완료
    if (this.collectedItems.paper4) {
      this.scene.launch('PopupScene', {
        popupImage: 'box_opened',
        popupSize: { width: 500, height: 500 },
        clickAreas: [],
        onClose: () => {
          this.enableAllAreas();
          this.activeArea = null;
        }
      });
      return;
    }

    // 나이트 퍼즐 완료 -> paper4 획득 가능
    if (this.collectedItems.knightPuzzleSolved) {
      this.scene.launch('PopupScene', {
        popupImage: 'box_unlocked',
        popupSize: { width: 500, height: 500 },
        clickAreas: [{
          x: width / 2.1,
          y: height / 1.7,
          width: 100,
          height: 100,
          debugAlpha: 0.3,
          callback: (popupScene) => this.collectPaper4(popupScene)
        }],
        onClose: () => {
          this.enableAllAreas();
          this.activeArea = null;
        }
      });
      return;
    }

    // 상자 잠금 해제됨 -> 나이트 퍼즐
    if (this.collectedItems.boxUnlocked) {
      this.showKnightPuzzlePopup();
      return;
    }

    // 상자 잠김
    this.scene.launch('PopupScene', {
      popupImage: 'box_locked',
      popupSize: { width: 500, height: 500 },
      clickAreas: [{
        x: width / 2,
        y: height / 2,
        width: 150,
        height: 120,
        debugAlpha: 0,
        callback: () => this.tryUnlockBox()
      }],
      onClose: () => {
        this.enableAllAreas();
        this.activeArea = null;
      }
    });
  }

  tryUnlockBox() {
    // knight_piece 아이템으로 잠금 해제
    if (this.checkSelectedItem('knight_piece')) {
      this.collectedItems.boxUnlocked = true;
      this.saveState();
      this.removeItem('knight_piece');

      // 시작점 설정 (우측 하단: row=4, col=4)
      this.knightPosition = { row: 4, col: 4 };
      this.knightBoard[4][4] = 0;
      this.moveCount = 1;
      this.saveKnightState();

      // 팝업 갱신 (나이트 퍼즐로)
      this.scene.stop('PopupScene');
      this.showBoxPopup();
    } else {
      const hints = [
        '잠겨있어...',
        '체스말이 필요해...'
      ];
      this.showRotatingHint('box', hints);
    }
  }

  // ========== 나이트 퍼즐 팝업 ==========
  showKnightPuzzlePopup() {
    const { width, height } = this.cameras.main;

    this.scene.launch('PopupScene', {
      popupImage: 'box_locked',
      popupSize: { width: 500, height: 500 },
      clickAreas: this.getKnightPuzzleClickAreas(),
      overlayItems: this.getKnightPuzzleOverlayItems(),
      onClose: () => {
        this.enableAllAreas();
        this.activeArea = null;
      }
    });

    // 버튼 텍스트 표시 (PopupScene 위에)
    this.time.delayedCall(50, () => {
      const popupScene = this.scene.get('PopupScene');
      if (popupScene) {
        // 열기 버튼 텍스트 (가운데 배치)
        popupScene.add.text(width / 2, height / 2 + 180, '', {
          fontSize: '18px',
          color: '#ffffff',
          fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(10);
      }
    });
  }

  // 나이트 퍼즐 오버레이 (방문한 칸 + 이동 가능한 칸 표시)
  getKnightPuzzleOverlayItems() {
    const { width, height } = this.cameras.main;
    const items = [];

    // 5x5 그리드 위치
    const cellSize = 60;
    const startX = width / 2 - cellSize * 2;
    const startY = height / 2 - cellSize * 2;

    // 이동 가능한 칸 계산
    const validMoves = this.getValidKnightMoves();

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const visitOrder = this.knightBoard[row][col];
        const isMovable = validMoves.some(m => m.row === row && m.col === col);

        // 방문한 칸 표시
        if (visitOrder >= 0) {
          items.push({
            key: 'knight_visited',
            x: startX + col * cellSize,
            y: startY + row * cellSize,
            scale: 0.5
          });
        }

        // 이동 가능한 칸 표시 (방문 여부 무관하게 표시)
        if (isMovable) {
          items.push({
            key: 'knight_movable',
            x: startX + col * cellSize,
            y: startY + row * cellSize,
            scale: 0.5
          });
        }
      }
    }

    // 현재 나이트 위치 표시
    if (this.knightPosition) {
      items.push({
        key: 'knight_piece',
        x: startX + this.knightPosition.col * cellSize,
        y: startY + this.knightPosition.row * cellSize,
        scale: 0.5
      });
    }

    return items;
  }

  // 현재 나이트 위치에서 이동 가능한 칸 계산 (방문 여부 무관)
  getValidKnightMoves() {
    if (!this.knightPosition) return [];

    const { row, col } = this.knightPosition;
    const moves = [];

    // L자 이동 패턴: (±2, ±1), (±1, ±2)
    const knightOffsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];

    for (const [dr, dc] of knightOffsets) {
      const newRow = row + dr;
      const newCol = col + dc;

      // 보드 범위 체크만 (방문한 칸에도 movable 표시)
      if (newRow >= 0 && newRow < 5 && newCol >= 0 && newCol < 5) {
        moves.push({ row: newRow, col: newCol });
      }
    }

    return moves;
  }

  // 나이트 퍼즐 클릭 영역 (각 셀 + 리셋 버튼)
  getKnightPuzzleClickAreas() {
    const { width, height } = this.cameras.main;
    const clickAreas = [];

    // 5x5 그리드 위치
    const cellSize = 60;
    const startX = width / 2 - cellSize * 2;
    const startY = height / 2 - cellSize * 2;

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        clickAreas.push({
          x: startX + col * cellSize,
          y: startY + row * cellSize,
          width: 55,
          height: 55,
          debugAlpha: 0.3,
          callback: () => this.onKnightCellClick(row, col)
        });
      }
    }

    // 열기 버튼 (퍼즐 완료 시도) - 가운데 배치
    clickAreas.push({
      x: width / 2,
      y: height / 2 + 180,
      width: 80,
      height: 40,
      debugAlpha: 0.3,
      callback: () => this.tryOpenBox()
    });

    return clickAreas;
  }

  // 나이트 셀 클릭
  onKnightCellClick(row, col) {
    // L자 이동 체크
    if (!this.isValidKnightMove(this.knightPosition.row, this.knightPosition.col, row, col)) {
      this.showHintDialog('나이트는 L자로만 이동할 수 있어!');
      return;
    }

    // 나이트 위치 이동
    this.knightPosition = { row, col };

    // 미방문 칸이면 방문 처리
    if (this.knightBoard[row][col] < 0) {
      this.knightBoard[row][col] = this.moveCount;
      this.moveCount++;
    }

    this.saveKnightState();

    // 팝업 갱신 (25칸 완료되어도 열기 버튼 필수)
    this.scene.stop('PopupScene');
    this.showKnightPuzzlePopup();
  }

  // L자 이동 유효성 체크
  isValidKnightMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    // L자 이동: (2,1) 또는 (1,2)
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
  }

  // 상자 열기 시도 (25칸 완료 체크)
  tryOpenBox() {
    if (this.moveCount === 25) {
      this.collectedItems.knightPuzzleSolved = true;
      this.saveState();

      // 팝업 갱신 (paper4 획득 가능)
      this.scene.stop('PopupScene');
      this.showBoxPopup();
    } else {
      this.showHintDialog(`아직 ${25 - this.moveCount}칸 남았어...`);
    }
  }

  // 나이트 퍼즐 리셋
  resetKnightPuzzle() {
    // 시작점으로 리셋 (우측 하단: row=4, col=4)
    this.knightBoard = this.createEmptyBoard();
    this.knightPosition = { row: 4, col: 4 };
    this.knightBoard[4][4] = 0;
    this.moveCount = 1;
    this.saveKnightState();

    // 팝업 갱신
    this.scene.stop('PopupScene');
    this.showKnightPuzzlePopup();
  }

  collectPaper4(popupScene) {
    // 이미 획득했으면 무시
    if (this.collectedItems.paper4) return;

    this.collectedItems.paper4 = true;
    this.saveState();

    this.addItem({
      id: 'paper4',
      name: '종이조각4',
      image: 'assets/images/items/paper4.png'
    });

    popupScene.changePopupImage('box_opened');
    popupScene.removeClickAreas();
  }

  // ========== 유틸리티 메서드 ==========
  saveState() {
    window.riversideSceneCollectedItems = this.collectedItems;
  }

  saveKnightState() {
    window.riversideKnightBoard = this.knightBoard;
    window.riversideKnightPosition = this.knightPosition;
    window.riversideMoveCount = this.moveCount;
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
    this.fadeToScene('CabinOutsideScene');
  }

  showHintDialog(message) {
    window.dispatchEvent(new CustomEvent('showHintDialog', { detail: { message } }));
  }

  showRotatingHint(key, hints) {
    const currentIndex = this.hintIndex[key] || 0;
    const message = hints[currentIndex];

    this.hintIndex[key] = (currentIndex + 1) % hints.length;
    window.riversideSceneHintIndex = this.hintIndex;

    this.showHintDialog(message);
  }

  disableAllAreas() {
    const areas = [this.sluiceArea, this.boxArea, this.backArea];
    areas.forEach(area => {
      if (area) area.disableInteractive();
    });
  }

  enableAllAreas() {
    const areas = [this.sluiceArea, this.boxArea, this.backArea];
    areas.forEach(area => {
      if (area) area.setInteractive({ useHandCursor: true });
    });
  }

  shutdown() {
    window.removeEventListener('dialogClick', this.handleDialogClick);
  }
}
