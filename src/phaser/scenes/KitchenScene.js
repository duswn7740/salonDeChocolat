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

    // 작업대 퍼즐 상태
    const defaultWorktableState = {
      recipeUsed: false,          // 레시피 아이템 사용 여부
      // 저울 퍼즐
      scalePuzzleSolved: false,   // 저울 퍼즐 완료
      chocolateOnScale: false,    // 초콜릿 올림
      weightAdded: false,         // weight 아이템 사용하여 6g 추가 여부
      weightsOnScale: [],         // 저울 위 추들 (처음에는 비어있음)
      weightsOnTable: [3, 5, 8],  // 책상 위 추들 (6g는 weight 아이템 사용 시 추가)
      measuredChocolateCollected: false,  // 계량 초콜릿 획득
      // 비커 퍼즐 (overlay 방식)
      beakerAdded: false,         // beaker 아이템 사용 여부 (7ml 비커 추가)
      creamUsed: false,           // fresh_cream 아이템 사용 여부
      // 퍼즐 상태: fresh_cream(무제한), 5ml, 7ml, 12ml 비커
      beakerState: { b5: 0, b7: 0, b12: 0 },  // 각 비커의 현재 용량 (cream은 무제한이므로 상태 불필요)
      measuredCreamCollected: false  // 계량 우유 획득
    };
    // 기존 상태와 기본값 병합 (새 프로퍼티 누락 방지)
    this.worktableState = { ...defaultWorktableState, ...window.kitchenWorktableState };
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
          debugAlpha: 0.3,
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
        debugAlpha: 0.3,
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
          debugAlpha: 0.3,
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

  // ========== 작업대 팝업 ==========
  showWorktablePopup(fromSubPuzzle = false) {
    const { width, height } = this.cameras.main;

    // 서브 퍼즐에서 돌아온 게 아닐 때만 영역 비활성화
    if (!fromSubPuzzle) {
      this.activeArea = 'worktable';
      this.disableAllAreas();
    }

    // 레시피 사용 전: 레시피 아이템 사용 가능
    if (!this.worktableState.recipeUsed) {
      this.scene.launch('PopupScene', {
        popupImage: 'worktable',
        popupSize: { width: 500, height: 500 },
        clickAreas: [{
          x: width / 2,
          y: height / 2,
          width: 500,
          height: 500,
          debugAlpha: 0.3,
          callback: () => this.tryUseRecipe()
        }],
        onClose: () => {
          this.enableAllAreas();
          this.activeArea = null;
        }
      });
      return;
    }

    // 레시피 사용 후: 좌(저울)/중(레시피)/우(비커) 선택 가능
    this.scene.launch('PopupScene', {
      popupImage: 'worktable_with_recipe',
      popupSize: { width: 500, height: 500 },
      clickAreas: [
        // 좌측: 저울 퍼즐
        {
          x: width / 3.5,
          y: height / 2,
          width: 120,
          height: 200,
          debugAlpha: 0.3,
          callback: () => {
            this.scene.stop('PopupScene');
            this.showScalePuzzlePopup();
          }
        },
        // 중앙: 레시피 다시보기
        {
          x: width / 2,
          y: height / 2,
          width: 120,
          height: 200,
          debugAlpha: 0.3,
          callback: () => this.showRecipeOverlay()
        },
        // 우측: 비커 퍼즐
        {
          x: width / 1.4,
          y: height / 2,
          width: 120,
          height: 200,
          debugAlpha: 0.3,
          callback: () => {
            this.scene.stop('PopupScene');
            this.showBeakerPuzzlePopup();
          }
        }
      ],
      onClose: () => {
        this.enableAllAreas();
        this.activeArea = null;
      }
    });
  }

  // 레시피 아이템 사용 시도
  tryUseRecipe() {
    if (this.checkSelectedItem('recipe')) {
      this.worktableState.recipeUsed = true;
      this.saveWorktableState();
      this.removeItem('recipe');

      // 팝업 재실행 (좌/중/우 선택 화면)
      this.scene.stop('PopupScene');
      this.showWorktablePopup();
    } else {
      this.showHintDialog('레시피가 필요해...');
    }
  }

  // 레시피 팝업 표시 (작업대에서 레시피 다시보기)
  showRecipeOverlay() {
    const { width, height } = this.cameras.main;

    // 현재 작업대 팝업 닫고 레시피 팝업 표시
    this.scene.stop('PopupScene');

    this.scene.launch('PopupScene', {
      popupImage: 'recipe_overlay',
      popupSize: { width: 450, height: 450 },
      // 레시피 이미지 클릭하면 닫기
      clickAreas: [{
        x: width / 2,
        y: height / 2,
        width: 450,
        height: 450,
        debugAlpha: 0,
        callback: () => {
          this.scene.stop('PopupScene');
          this.showWorktablePopup(true);
        }
      }],
      // onClose는 X 버튼용이므로 제거 (배경 클릭으로 닫지 않음)
      onClose: null
    });
  }

  // ========== 저울 퍼즐 ==========
  showScalePuzzlePopup() {
    const { width, height } = this.cameras.main;

    // 계량 초콜릿 이미 획득한 경우 (퍼즐 완료)
    if (this.worktableState.measuredChocolateCollected) {
      this.scene.launch('PopupScene', {
        popupImage: 'scale_balanced',
        popupSize: { width: 500, height: 500 },
        clickAreas: [],
        onClose: () => {
          this.showWorktablePopup(true);
        }
      });
      return;
    }

    // 퍼즐 진행 중
    const overlayItems = this.getScaleOverlayItems();
    const clickAreas = this.getScaleClickAreas();

    this.scene.launch('PopupScene', {
      popupImage: 'scale_balanced',
      popupSize: { width: 500, height: 500 },
      overlayItems,
      clickAreas,
      onClose: () => {
        this.showWorktablePopup(true);
      }
    });
  }

  // 저울 오버레이 아이템 (추들 + 초콜릿)
  getScaleOverlayItems() {
    const { width, height } = this.cameras.main;
    const items = [];

    // 초콜릿과 무게추 아이템 둘 다 사용한 경우에만 무게추 표시
    if (this.worktableState.chocolateOnScale && this.worktableState.weightAdded) {
      // 저울 위 무게추 위치 (화면 위쪽)
      const scaleWeightPositions = {
        3: { x: width / 4, y: height / 2.5 },
        5: { x: width / 3, y: height / 2.5 },
        6: { x: width / 2.5, y: height / 2.5 },
        8: { x: width / 2, y: height / 2.5 }
      };

      // 책상 위 무게추 위치 (화면 아래쪽)
      const tableWeightPositions = {
        3: { x: width / 4, y: height / 1.5 },
        5: { x: width / 3, y: height / 1.5 },
        6: { x: width / 2.5, y: height / 1.5 },
        8: { x: width / 2, y: height / 1.5 }
      };

      // 저울 위 무게추 표시
      this.worktableState.weightsOnScale.forEach((w, idx) => {
        items.push({
          key: `weight_${w}g_overlay`,
          x: scaleWeightPositions[w]?.x || (width / 4 + idx * 50),
          y: scaleWeightPositions[w]?.y || height / 1.5,
          scale: 0.2
        });
      });

      // 책상 위 무게추 표시
      this.worktableState.weightsOnTable.forEach((w, idx) => {
        items.push({
          key: `weight_${w}g_overlay`,
          x: tableWeightPositions[w]?.x || (width / 4 + idx * 50),
          y: tableWeightPositions[w]?.y || height / 2.5,
          scale: 0.2
        });
      });

      // 초콜릿 표시
      items.push({
        key: 'chocolate_on_scale',
        x: width / 1.5,
        y: height / 2
      });
    }

    return items;
  }

  // 저울 클릭 영역 (추 추가, 초콜릿 올리기, 확인)
  getScaleClickAreas() {
    const { width, height } = this.cameras.main;
    const clickAreas = [];

    // 초콜릿과 무게추 아이템 둘 다 사용한 경우에만 무게추 이동 가능
    if (this.worktableState.chocolateOnScale && this.worktableState.weightAdded) {
      // 저울 위 무게추 위치 (클릭하면 책상으로 이동) - 화면 위쪽
      const scaleWeightPositions = {
        3: { x: width / 4, y: height / 2.5 },
        5: { x: width / 3, y: height / 2.5 },
        6: { x: width / 2.5, y: height / 2.5 },
        8: { x: width / 2, y: height / 2.5 }
      };

      // 저울 위 무게추 클릭 영역 (클릭하면 책상으로 이동)
      this.worktableState.weightsOnScale.forEach((w) => {
        const pos = scaleWeightPositions[w];
        if (pos) {
          clickAreas.push({
            x: pos.x,
            y: pos.y,
            width: 60,
            height: 60,
            debugAlpha: 0.3,
            callback: () => this.moveWeightToTable(w)
          });
        }
      });

      // 책상 위 무게추 위치 (클릭하면 저울로 이동) - 화면 아래쪽
      const tableWeightPositions = {
        3: { x: width / 4, y: height / 1.5 },
        5: { x: width / 3, y: height / 1.5 },
        6: { x: width / 2.5, y: height / 1.5 },
        8: { x: width / 2, y: height / 1.5 }
      };

      // 책상 위 무게추 클릭 영역 (클릭하면 저울로 이동)
      this.worktableState.weightsOnTable.forEach((w) => {
        const pos = tableWeightPositions[w];
        if (pos) {
          clickAreas.push({
            x: pos.x,
            y: pos.y,
            width: 60,
            height: 60,
            debugAlpha: 0.3,
            callback: () => this.moveWeightToScale(w)
          });
        }
      });
    }

    // 저울 빈 공간: weight/chocolate 아이템 추가
    clickAreas.push({
      x: width / 2,
      y: height / 2,
      width: 300,
      height: 150,
      debugAlpha: 0.3,
      callback: () => this.onScaleClick()
    });

    // 확인 버튼 (초콜릿과 무게추 둘 다 사용한 경우에만 활성화)
    if (this.worktableState.chocolateOnScale && this.worktableState.weightAdded) {
      clickAreas.push({
        x: width / 2,
        y: height / 1.4,
        width: 100,
        height: 50,
        debugAlpha: 0.3,
        callback: () => this.checkScalePuzzle()
      });
    }

    return clickAreas;
  }

  // 저울 -> 책상으로 무게추 이동
  moveWeightToTable(weight) {
    const index = this.worktableState.weightsOnScale.indexOf(weight);
    if (index > -1) {
      this.worktableState.weightsOnScale.splice(index, 1);
      this.worktableState.weightsOnTable.push(weight);
      this.saveWorktableState();

      this.scene.stop('PopupScene');
      this.showScalePuzzlePopup();
    }
  }

  // 책상 -> 저울로 무게추 이동
  moveWeightToScale(weight) {
    const index = this.worktableState.weightsOnTable.indexOf(weight);
    if (index > -1) {
      this.worktableState.weightsOnTable.splice(index, 1);
      this.worktableState.weightsOnScale.push(weight);
      this.saveWorktableState();

      this.scene.stop('PopupScene');
      this.showScalePuzzlePopup();
    }
  }

  // 저울 클릭 처리 (초콜릿 올리기, weight 아이템으로 6g 추가)
  onScaleClick() {
    // 현재 선택된 아이템 확인
    const selectedItem = window.gameSelectedItem;

    // weight 아이템으로 6g 무게추 추가
    if (!this.worktableState.weightAdded && selectedItem === 'weight') {
      this.worktableState.weightAdded = true;
      this.worktableState.weightsOnTable.push(6);  // 6g 무게추 추가
      this.saveWorktableState();
      this.removeItem('weight');

      this.scene.stop('PopupScene');
      this.showScalePuzzlePopup();
      return;
    }

    // chocolate 아이템 올리기
    if (!this.worktableState.chocolateOnScale && selectedItem === 'chocolate') {
      this.worktableState.chocolateOnScale = true;
      this.saveWorktableState();
      this.removeItem('chocolate');

      this.scene.stop('PopupScene');
      this.showScalePuzzlePopup();
      return;
    }

    // 힌트 표시
    if (!this.worktableState.chocolateOnScale && !this.worktableState.weightAdded) {
      this.showHintDialog('초콜릿과 무게추가 필요해...');
    } else if (!this.worktableState.chocolateOnScale) {
      this.showHintDialog('초콜릿을 올려야 해...');
    } else if (!this.worktableState.weightAdded) {
      this.showHintDialog('무게추가 필요해...');
    }
  }

  // 저울 퍼즐 정답 체크 (17g = 3 + 6 + 8) -> 자동 획득
  checkScalePuzzle() {
    const totalWeight = this.worktableState.weightsOnScale.reduce((sum, w) => sum + w, 0);

    // 정답: 17g (3 + 6 + 8)
    if (totalWeight === 17) {
      this.worktableState.scalePuzzleSolved = true;
      this.worktableState.measuredChocolateCollected = true;
      this.saveWorktableState();

      // 계량된 초콜릿 자동 획득
      this.addItem({
        id: 'measured_chocolate',
        name: '계량된 초콜릿',
        image: 'assets/images/items/measured_chocolate.png'
      });

      this.showHintDialog('17g 계량 성공!');
      this.scene.stop('PopupScene');
      this.showScalePuzzlePopup();
    } else {
      this.showHintDialog(`${totalWeight}g... 안 맞아...`);
    }
  }

  // ========== 비커 퍼즐 (overlay 방식) ==========
  showBeakerPuzzlePopup() {
    const { width, height } = this.cameras.main;

    // 계량 우유 이미 획득한 경우 (생크림, 5ml_0, 7ml_0, 12ml_0 overlay 표시)
    if (this.worktableState.measuredCreamCollected) {
      this.scene.launch('PopupScene', {
        popupImage: 'beaker_puzzle',
        popupSize: { width: 500, height: 500 },
        overlayItems: [
          { key: 'fresh_cream_overlay', x: width / 4, y: height / 2 },
          { key: 'beaker_5ml_0', x: width / 3, y: height / 2 },
          { key: 'beaker_7ml_0', x: width / 2, y: height / 2 },
          { key: 'beaker_12ml_0', x: width / 1.5, y: height / 2 }
        ],
        clickAreas: [],
        onClose: () => {
          this.showWorktablePopup(true);
        }
      });
      return;
    }

    // 아이템 사용 단계: fresh_cream과 beaker 둘 다 필요
    if (!this.worktableState.beakerAdded || !this.worktableState.creamUsed) {
      this.scene.launch('PopupScene', {
        popupImage: 'beaker_puzzle',
        popupSize: { width: 500, height: 500 },
        overlayItems: this.getInitialBeakerOverlays(),
        clickAreas: [{
          x: width / 2,
          y: height / 2,
          width: 300,
          height: 300,
          debugAlpha: 0.3,
          callback: () => this.tryAddBeakerItems()
        }],
        onClose: () => {
          this.showWorktablePopup(true);
        }
      });
      return;
    }

    // 퍼즐 진행 중 (fresh_cream(무제한), 5ml, 7ml, 12ml 비커 모두 표시)

    this.scene.launch('PopupScene', {
      popupImage: 'beaker_puzzle',
      popupSize: { width: 500, height: 500 },
      overlayItems: this.getBeakerOverlayItems(),
      clickAreas: this.getBeakerClickAreas(),
      onClose: () => {
        this.showWorktablePopup(true);
      }
    });
  }

  // 초기 비커 overlay (아이템 사용 전: 5ml, 12ml 비커 + 사용된 아이템 표시)
  getInitialBeakerOverlays() {
    const { width, height } = this.cameras.main;
    const items = [];

    // 기본: 5ml, 12ml 비커 (빈 상태)
    items.push({ key: 'beaker_5ml_0', x: width / 3, y: height / 2 });
    items.push({ key: 'beaker_12ml_0', x: width / 1.5, y: height / 2 });

    // 생크림 사용 시: fresh_cream_overlay 표시
    if (this.worktableState.creamUsed) {
      items.push({ key: 'fresh_cream_overlay', x: width / 4, y: height / 2 });
    }

    // beaker 아이템 사용 시: 7ml 비커 추가
    if (this.worktableState.beakerAdded) {
      items.push({ key: 'beaker_7ml_0', x: width / 2, y: height / 2 });
    }

    return items;
  }

  // 비커 아이템과 생크림 사용 시도
  tryAddBeakerItems() {
    // beaker 아이템으로 7ml 비커 추가
    if (!this.worktableState.beakerAdded && this.checkSelectedItem('beaker')) {
      this.worktableState.beakerAdded = true;
      this.saveWorktableState();
      this.removeItem('beaker');

      this.scene.stop('PopupScene');
      this.showBeakerPuzzlePopup();
      return;
    }

    // fresh_cream 아이템 사용 (퍼즐 시작 시 cream 용기에 12ml)
    if (!this.worktableState.creamUsed && this.checkSelectedItem('fresh_cream')) {
      this.worktableState.creamUsed = true;
      this.saveWorktableState();
      this.removeItem('fresh_cream');

      this.scene.stop('PopupScene');
      this.showBeakerPuzzlePopup();
      return;
    }

    // 힌트 표시
    if (!this.worktableState.beakerAdded && !this.worktableState.creamUsed) {
      this.showHintDialog('비커와 생크림이 필요해...');
    } else if (!this.worktableState.beakerAdded) {
      this.showHintDialog('비커가 필요해...');
    } else {
      this.showHintDialog('생크림이 필요해...');
    }
  }

  // 비커 상태에 따른 overlay 아이템 반환 (fresh_cream(무제한), 5ml, 7ml, 12ml 순서)
  getBeakerOverlayItems() {
    const { width, height } = this.cameras.main;
    const { b5, b7, b12 } = this.worktableState.beakerState;
    const items = [];

    // fresh_cream (무제한) - 항상 표시
    items.push({ key: `fresh_cream_overlay`, x: width / 4, y: height / 2 });

    // 5ml, 7ml, 12ml 비커 순서대로 배치
    items.push({ key: `beaker_5ml_${this.getClosestBeakerValue(b5, [0, 3, 5])}`, x: width / 3, y: height / 2 });
    items.push({ key: `beaker_7ml_${this.getClosestBeakerValue(b7, [0, 2, 3, 5, 7])}`, x: width / 2, y: height / 2 });
    items.push({ key: `beaker_12ml_${this.getClosestBeakerValue(b12, [0, 3, 5, 10, 12])}`, x: width / 1.5, y: height / 2 });

    return items;
  }

  // 가장 가까운 비커 이미지 값 반환
  getClosestBeakerValue(value, available) {
    return available.reduce((prev, curr) =>
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
  }

  // 비커 클릭 영역 (fresh_cream(무제한), 5ml, 7ml, 12ml, 하수구, 측정완료 버튼)
  getBeakerClickAreas() {
    const { width, height } = this.cameras.main;

    const clickAreas = [
      // fresh_cream (무제한 - 클릭하면 비커에 채움)
      {
        x: width / 4,
        y: height / 2,
        width: 80,
        height: 150,
        debugAlpha: 0.3,
        callback: () => this.selectCream()
      },
      // 5ml 비커
      {
        x: width / 3,
        y: height / 2,
        width: 80,
        height: 150,
        debugAlpha: 0.3,
        callback: () => this.selectBeaker('b5')
      },
      // 7ml 비커
      {
        x: width / 2,
        y: height / 2,
        width: 80,
        height: 150,
        debugAlpha: 0.3,
        callback: () => this.selectBeaker('b7')
      },
      // 12ml 비커
      {
        x: width / 1.5,
        y: height / 2,
        width: 80,
        height: 150,
        debugAlpha: 0.3,
        callback: () => this.selectBeaker('b12')
      },
      // 하수구 (선택된 비커의 내용물 버리기)
      {
        x: width / 1.2,
        y: height / 1.8,
        width: 100,
        height: 30,
        debugAlpha: 0.3,
        callback: () => this.drainBeaker()
      },
      // 측정 완료 버튼
      {
        x: width / 2,
        y: height / 1.3,
        width: 120,
        height: 50,
        debugAlpha: 0.3,
        callback: () => this.tryCompleteMeasurement()
      }
    ];

    return clickAreas;
  }

  // 생크림 선택 (무제한이므로 비커를 가득 채움)
  selectCream() {
    if (this.selectedBeaker) {
      // 이미 비커가 선택되어 있으면 -> 생크림으로 옮기려는 것 (불가)
      this.showHintDialog('생크림으로는 옮길 수 없어...');
      this.selectedBeaker = null;
      return;
    }
    // 생크림 선택 -> 다음에 클릭하는 비커를 가득 채움
    this.selectedBeaker = 'cream';
    this.showHintDialog('비커를 선택해서 채워...');
  }

  // 비커 선택 (선택 후 다른 비커 클릭하면 옮기기)
  selectBeaker(beakerKey) {
    if (!this.selectedBeaker) {
      // 첫 번째 선택
      this.selectedBeaker = beakerKey;
      this.showHintDialog('다른 비커나 하수구를 선택...');
    } else if (this.selectedBeaker === 'cream') {
      // 생크림이 선택된 상태 -> 비커를 가득 채움
      this.fillBeakerFromCream(beakerKey);
      this.selectedBeaker = null;
    } else if (this.selectedBeaker === beakerKey) {
      // 같은 비커 다시 클릭 -> 선택 해제
      this.selectedBeaker = null;
    } else {
      // 다른 비커로 옮기기
      this.pourBeaker(this.selectedBeaker, beakerKey);
      this.selectedBeaker = null;
    }
  }

  // 생크림에서 비커로 가득 채우기
  fillBeakerFromCream(beakerKey) {
    const capacities = { b5: 5, b7: 7, b12: 12 };
    const state = this.worktableState.beakerState;
    const capacity = capacities[beakerKey];

    // 비커를 가득 채움
    state[beakerKey] = capacity;
    this.saveWorktableState();

    // 팝업 갱신
    this.scene.stop('PopupScene');
    this.showBeakerPuzzlePopup();
  }

  // 하수구로 내용물 버리기
  drainBeaker() {
    if (!this.selectedBeaker) {
      this.showHintDialog('먼저 비커를 선택해...');
      return;
    }

    const state = this.worktableState.beakerState;
    if (state[this.selectedBeaker] > 0) {
      state[this.selectedBeaker] = 0;
      this.saveWorktableState();
      this.selectedBeaker = null;

      // 팝업 갱신
      this.scene.stop('PopupScene');
      this.showBeakerPuzzlePopup();
    } else {
      this.showHintDialog('비커가 비어있어...');
      this.selectedBeaker = null;
    }
  }

  // 비커 간 물 옮기기 (비커끼리만)
  pourBeaker(from, to) {
    const capacities = { b5: 5, b7: 7, b12: 12 };
    const state = this.worktableState.beakerState;

    const fromAmount = state[from];
    const toAmount = state[to];
    const toCapacity = capacities[to];

    // 옮길 수 있는 양 계산
    const spaceInTo = toCapacity - toAmount;
    const pourAmount = Math.min(fromAmount, spaceInTo);

    if (pourAmount > 0) {
      state[from] -= pourAmount;
      state[to] += pourAmount;
      this.saveWorktableState();

      // 팝업 갱신
      this.scene.stop('PopupScene');
      this.showBeakerPuzzlePopup();
    } else {
      this.showHintDialog('옮길 수 없어...');
    }
  }

  // 측정 완료 버튼 클릭
  tryCompleteMeasurement() {
    const { b5, b7, b12 } = this.worktableState.beakerState;

    // 어느 비커든 3ml면 성공
    if (b5 === 3 || b7 === 3 || b12 === 3) {
      this.worktableState.measuredCreamCollected = true;
      this.saveWorktableState();

      this.addItem({
        id: 'measured_cream',
        name: '계량된 생크림',
        image: 'assets/images/items/measured_cream.png'
      });

      this.showHintDialog('3ml 계량 성공!');
      this.scene.stop('PopupScene');
      this.showBeakerPuzzlePopup();
    } else {
      this.showHintDialog('3ml가 아니야...');
    }
  }

  // 비커 퍼즐 정답 체크 (3ml)
  checkBeakerPuzzleSolved() {
    const { b5, b7, b12 } = this.worktableState.beakerState;
    return b5 === 3 || b7 === 3 || b12 === 3;
  }

  // 작업대 상태 저장
  saveWorktableState() {
    window.kitchenWorktableState = this.worktableState;
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
