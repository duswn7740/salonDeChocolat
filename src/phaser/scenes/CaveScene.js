// src/phaser/scenes/CaveScene.js
import BaseScene from './BaseScene';
import { createClickArea } from '../utils/createClickArea';

export default class CaveScene extends BaseScene {
  constructor() {
    super({ key: 'CaveScene' });
  }

  init() {
    // 상태 초기화
    this.activeArea = null;

    // 힌트 메시지 인덱스 (순환용)
    this.hintIndex = window.caveSceneHintIndex || {
      bonfire: 0,
      desk: 0
    };

    // 아이템 획득/사용 상태 (씬 재방문 시에도 유지)
    this.sceneState = window.caveSceneState || {
      firewoodPlaced: false,   // 모닥불에 장작 놓음
      bonfireLit: false,       // 모닥불 점화 (match 사용)
      placedPapers: [],        // 올린 종이 순서 (예: [2, 4, 1, 3] = 좌상, 좌하, 우상, 우하)
      picturePuzzleSolved: false,  // 그림 퍼즐 완료
      recipeCollected: false,  // 레시피 획득
      // 냄비 상태
      chocolateAdded: false,   // measured_chocolate 넣음
      creamAdded: false,       // measured_cream 넣음
      paveChocolateCollected: false  // pave_chocolate 획득
    };

    // 그림 퍼즐 상태 (2x2 = 4칸)
    // 정답: [1, 3, 2, 4] (좌상:1, 좌하:3, 우상:2, 우하:4)
    // placedPapers 배열이 pictureOrder가 됨
    this.pictureOrder = window.cavePictureOrder || [...this.sceneState.placedPapers];
    this.selectedPictureIndex = null;
  }

  create() {
    super.create();

    const { width, height } = this.cameras.main;

    // 배경 표시 (모닥불 켜짐 여부에 따라)
    const bgKey = this.sceneState.bonfireLit ? 'cave_with_light' : 'cave';
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

    // 1. 모닥불 영역
    this.bonfireArea = createClickArea(this,
      width * 0.3,    // TODO: 위치 조정
      height * 0.27,
      350, 50,
      () => this.showBonfirePopup(),
      0
    );

    // 2. 책상 영역
    this.deskArea = createClickArea(this,
      width * 0.15,    // TODO: 위치 조정
      height * 0.47,
      100, 50,
      () => this.showDeskPopup(),
      0.3
    );

    // 3. 되돌아가기 영역 (RiversideScene으로)
    this.backArea = createClickArea(this,
      width * 0.5,
      height * 1,
      210, 80,
      () => this.goBack(),
      0
    );
  }

  // ========== 모닥불 팝업 ==========
  showBonfirePopup() {
    const { width, height } = this.cameras.main;
    this.activeArea = 'bonfire';
    this.disableAllAreas();

    let popupImage;
    let clickAreas = [];
    let overlayItems = [];

    // 3단계: 모닥불 켜짐 -> 냄비 사용 가능
    if (this.sceneState.bonfireLit) {
      popupImage = 'bonfire_after';

      // 냄비 오버레이 및 클릭 영역 추가
      const potResult = this.getPotOverlayAndClickAreas();
      overlayItems = potResult.overlayItems;
      clickAreas = potResult.clickAreas;
    }
    // 2단계: 장작 놓음 -> match 사용 가능
    else if (this.sceneState.firewoodPlaced) {
      popupImage = 'bonfire_with_firewood';
      clickAreas = [{
        x: width / 2,
        y: height / 2,
        width: 200,
        height: 200,
        debugAlpha: 0.3,
        callback: () => this.tryLightBonfire()
      }];
    }
    // 1단계: 빈 모닥불 -> firewood 사용 가능
    else {
      popupImage = 'bonfire_before';
      clickAreas = [{
        x: width / 2,
        y: height / 2,
        width: 200,
        height: 200,
        debugAlpha: 0.3,
        callback: () => this.tryPlaceFirewood()
      }];
    }

    this.scene.launch('PopupScene', {
      popupImage,
      popupSize: { width: 500, height: 500 },
      overlayItems,
      clickAreas,
      onClose: () => {
        this.enableAllAreas();
        this.activeArea = null;
      }
    });
  }

  // 냄비 클릭 영역 반환 (bonfire_after 이미지에 냄비가 이미 그려져 있음)
  getPotOverlayAndClickAreas() {
    const { width, height } = this.cameras.main;
    const overlayItems = [];
    const clickAreas = [];

    // pave_chocolate 획득 완료 -> 클릭 영역 없음
    if (this.sceneState.paveChocolateCollected) {
      return { overlayItems, clickAreas };
    }

    // 냄비 클릭 영역 (재료 추가 또는 pave_chocolate 획득)
    clickAreas.push({
      x: width / 2,
      y: height / 2,
      width: 150,
      height: 150,
      debugAlpha: 0.3,
      callback: () => this.tryAddIngredient()
    });

    return { overlayItems, clickAreas };
  }

  // firewood 놓기 시도
  tryPlaceFirewood() {
    if (this.checkSelectedItem('firewood')) {
      this.sceneState.firewoodPlaced = true;
      this.saveState();
      this.removeItem('firewood');

      // 팝업 재실행
      this.scene.stop('PopupScene');
      this.showBonfirePopup();
    } else {
      const hints = [
        '불을 피울 수 없어...',
        '장작이 필요해...'
      ];
      this.showRotatingHint('bonfire', hints);
    }
  }

  // 모닥불 점화 시도 (match 사용)
  tryLightBonfire() {
    if (this.checkSelectedItem('match')) {
      this.sceneState.bonfireLit = true;
      this.saveState();
      this.removeItem('match');

      // 배경 변경
      const { width, height } = this.cameras.main;
      this.background.setTexture('cave_with_light');
      this.background.setDisplaySize(width, height);

      // 힌트 메시지
      this.showHintDialog('불이 켜졌다!');

      // 팝업 재실행 (bonfire_after 표시)
      this.scene.stop('PopupScene');
      this.showBonfirePopup();
    } else {
      this.showHintDialog('불을 붙일 수 없어...');
    }
  }

  // 재료 추가 시도 (measured_chocolate 또는 measured_cream)
  tryAddIngredient() {
    // measured_chocolate 사용
    if (!this.sceneState.chocolateAdded && this.checkSelectedItem('measured_chocolate')) {
      this.sceneState.chocolateAdded = true;
      this.saveState();
      this.removeItem('measured_chocolate');

      // 둘 다 넣었으면 pave_chocolate 획득
      if (this.sceneState.creamAdded) {
        this.collectPaveChocolate();
      } else {
        this.showHintDialog('초콜릿을 넣었다!');
        this.scene.stop('PopupScene');
        this.showBonfirePopup();
      }
      return;
    }

    // measured_cream 사용
    if (!this.sceneState.creamAdded && this.checkSelectedItem('measured_cream')) {
      this.sceneState.creamAdded = true;
      this.saveState();
      this.removeItem('measured_cream');

      // 둘 다 넣었으면 pave_chocolate 획득
      if (this.sceneState.chocolateAdded) {
        this.collectPaveChocolate();
      } else {
        this.showHintDialog('생크림을 넣었다!');
        this.scene.stop('PopupScene');
        this.showBonfirePopup();
      }
      return;
    }

    // 힌트 표시
    this.showHintDialog('레시피가 필요해...');
  }

  // pave_chocolate 획득
  collectPaveChocolate() {
    this.sceneState.paveChocolateCollected = true;
    this.saveState();

    this.addItem({
      id: 'pave_chocolate',
      name: '파베 초콜릿',
      image: 'assets/images/items/pave_chocolate.png'
    });

    this.showHintDialog('파베 초콜릿을 획득했다!');

    // 팝업 재실행
    this.scene.stop('PopupScene');
    this.showBonfirePopup();
  }

  // ========== 책상 팝업 (그림 퍼즐) ==========
  showDeskPopup() {
    // 모닥불이 켜지지 않았으면 접근 불가
    if (!this.sceneState.bonfireLit) {
      this.showHintDialog('너무 어두워서 보이지 않아...');
      return;
    }

    const { width, height } = this.cameras.main;
    this.activeArea = 'desk';
    this.disableAllAreas();

    // 퍼즐 완료
    if (this.sceneState.picturePuzzleSolved) {
      // 레시피 획득 완료 -> 오버레이 없이 cave_desk만 표시
      if (this.sceneState.recipeCollected) {
        this.scene.launch('PopupScene', {
          popupImage: 'cave_desk',
          popupSize: { width: 500, height: 500 },
          overlayItems: [],
          clickAreas: [],
          onClose: () => {
            this.enableAllAreas();
            this.activeArea = null;
          }
        });
        return;
      }

      // 레시피 미획득 -> 정렬된 그림 + 레시피 오버레이 표시
      const overlayItems = this.getPictureOverlayItems(true);
      overlayItems.push({
        key: 'recipe_overlay',
        x: width / 2,
        y: height / 2
      });

      this.scene.launch('PopupScene', {
        popupImage: 'cave_desk',
        popupSize: { width: 500, height: 500 },
        overlayItems,
        clickAreas: [{
          x: width / 2,
          y: height / 2,
          width: 150,
          height: 150,
          debugAlpha: 0.3,
          callback: () => this.collectRecipe()
        }],
        onClose: () => {
          this.enableAllAreas();
          this.activeArea = null;
        }
      });
      return;
    }

    // 4개 모두 올렸으면 퍼즐 진행
    if (this.sceneState.placedPapers.length === 4) {
      this.scene.launch('PopupScene', {
        popupImage: 'cave_desk',
        popupSize: { width: 500, height: 500 },
        overlayItems: this.getPictureOverlayItems(false),
        clickAreas: this.getPictureClickAreas(),
        onClose: () => {
          this.enableAllAreas();
          this.activeArea = null;
          this.selectedPictureIndex = null;
        }
      });
      return;
    }

    // 아직 4개 다 안 올림 -> 종이 올리기 (클릭하면 아무 종이나 올림)
    this.scene.launch('PopupScene', {
      popupImage: 'cave_desk',
      popupSize: { width: 500, height: 500 },
      overlayItems: this.getPlacedPapersOverlay(),
      clickAreas: [{
        x: width / 2,
        y: height / 2,
        width: 400,
        height: 300,
        debugAlpha: 0.3,
        callback: () => this.tryPlaceAnyPaper()
      }],
      onClose: () => {
        this.enableAllAreas();
        this.activeArea = null;
      }
    });
  }

  // 이미 올려진 종이 오버레이 (순서대로 좌상, 좌하, 우상, 우하)
  getPlacedPapersOverlay() {
    const { width, height } = this.cameras.main;
    const items = [];

    const pieceWidth = 200;
    const pieceHeight = 150;
    const startX = width / 2 - pieceWidth / 2;
    const startY = height / 2 - pieceHeight / 2;

    // 배치 순서: 좌상(0) -> 좌하(1) -> 우상(2) -> 우하(3)
    const positions = [
      { x: startX, y: startY },                              // 0: 좌상
      { x: startX, y: startY + pieceHeight },                // 1: 좌하
      { x: startX + pieceWidth, y: startY },                 // 2: 우상
      { x: startX + pieceWidth, y: startY + pieceHeight }    // 3: 우하
    ];

    // 올린 순서대로 위치에 배치
    this.sceneState.placedPapers.forEach((paperNum, index) => {
      items.push({
        key: `paper${paperNum}_overlay`,
        x: positions[index].x,
        y: positions[index].y
      });
    });

    return items;
  }

  // 아무 종이나 올리기 시도 (선택된 종이 확인)
  tryPlaceAnyPaper() {
    // paper1~4 중 선택된 것 찾기
    for (let i = 1; i <= 4; i++) {
      const paperId = `paper${i}`;
      if (this.checkSelectedItem(paperId)) {
        // 이미 올린 종이인지 체크
        if (this.sceneState.placedPapers.includes(i)) {
          this.showHintDialog('이미 올린 종이야...');
          return;
        }

        // 종이 올리기
        this.sceneState.placedPapers.push(i);
        this.pictureOrder = [...this.sceneState.placedPapers];
        this.saveState();
        this.savePictureOrder();
        this.removeItem(paperId);

        // 팝업 재실행
        this.scene.stop('PopupScene');
        this.showDeskPopup();
        return;
      }
    }

    // 종이를 선택하지 않음
    const hints = [
      '종이 조각이 필요해...',
      '여기서 레시피를 확인할 수 있어!'
    ];
    this.showRotatingHint('desk', hints);
  }

  // 그림 퍼즐 오버레이 아이템
  getPictureOverlayItems(isSolved) {
    const { width, height } = this.cameras.main;
    const items = [];

    // 2x2 그리드 위치 (200x150 px 크기)
    const pieceWidth = 200;
    const pieceHeight = 150;
    const startX = width / 2 - pieceWidth / 2;
    const startY = height / 2 - pieceHeight / 2;

    // 배치 순서: 좌상(0) -> 좌하(1) -> 우상(2) -> 우하(3)
    const positions = [
      { x: startX, y: startY },                              // 0: 좌상
      { x: startX, y: startY + pieceHeight },                // 1: 좌하
      { x: startX + pieceWidth, y: startY },                 // 2: 우상
      { x: startX + pieceWidth, y: startY + pieceHeight }    // 3: 우하
    ];

    const order = isSolved ? [1, 3, 2, 4] : this.pictureOrder;

    order.forEach((pieceNum, index) => {
      if (pieceNum) {
        items.push({
          key: `paper${pieceNum}_overlay`,
          x: positions[index].x,
          y: positions[index].y
        });
      }
    });

    return items;
  }

  // 그림 퍼즐 클릭 영역
  getPictureClickAreas() {
    const { width, height } = this.cameras.main;
    const clickAreas = [];

    const pieceWidth = 200;
    const pieceHeight = 150;
    const startX = width / 2 - pieceWidth / 2;
    const startY = height / 2 - pieceHeight / 2;

    // 배치 순서: 좌상(0) -> 좌하(1) -> 우상(2) -> 우하(3)
    const positions = [
      { x: startX, y: startY },                              // 0: 좌상
      { x: startX, y: startY + pieceHeight },                // 1: 좌하
      { x: startX + pieceWidth, y: startY },                 // 2: 우상
      { x: startX + pieceWidth, y: startY + pieceHeight }    // 3: 우하
    ];

    this.pictureOrder.forEach((pieceNum, index) => {
      if (pieceNum) {
        clickAreas.push({
          x: positions[index].x,
          y: positions[index].y,
          width: pieceWidth - 10,
          height: pieceHeight - 10,
          debugAlpha: 0.3,
          callback: () => this.onPictureClick(index)
        });
      }
    });

    return clickAreas;
  }

  // 그림 조각 클릭 처리
  onPictureClick(index) {
    if (this.selectedPictureIndex === null) {
      // 첫 번째 조각 선택
      this.selectedPictureIndex = index;
    } else if (this.selectedPictureIndex === index) {
      // 같은 조각 다시 클릭 -> 선택 해제
      this.selectedPictureIndex = null;
    } else {
      // 두 번째 조각 선택 -> 자리 바꾸기
      const temp = this.pictureOrder[this.selectedPictureIndex];
      this.pictureOrder[this.selectedPictureIndex] = this.pictureOrder[index];
      this.pictureOrder[index] = temp;
      this.selectedPictureIndex = null;
      this.savePictureOrder();

      // 정답 체크
      if (this.checkPicturePuzzleSolved()) {
        this.sceneState.picturePuzzleSolved = true;
        this.saveState();
        this.showHintDialog('퍼즐이 완성됐다!');
      }
    }

    // 팝업 갱신
    this.scene.stop('PopupScene');
    this.showDeskPopup();
  }

  // 퍼즐 정답 체크
  checkPicturePuzzleSolved() {
    const answer = [1, 3, 2, 4];  // 좌상:1, 좌하:3, 우상:2, 우하:4
    return this.pictureOrder.length === 4 &&
      this.pictureOrder.every((val, idx) => val === answer[idx]);
  }

  // 레시피 아이템 획득
  collectRecipe() {
    if (this.sceneState.recipeCollected) return;

    this.sceneState.recipeCollected = true;
    this.saveState();

    // 레시피 아이템 추가
    this.addItem({
      id: 'recipe',
      name: '레시피',
      image: 'assets/images/items/recipe.png'
    });

    this.showHintDialog('레시피를 획득했다!');

    // 팝업 재실행 (오버레이 없이 cave_desk만 표시)
    this.scene.stop('PopupScene');
    this.showDeskPopup();
  }

  // ========== 유틸리티 메서드 ==========
  saveState() {
    window.caveSceneState = this.sceneState;
  }

  savePictureOrder() {
    window.cavePictureOrder = this.pictureOrder;
  }

  checkSelectedItem(itemId) {
    return window.gameSelectedItem === itemId;
  }

  checkHasItem(itemId) {
    return window.gameInventory?.some(item => item.id === itemId) || false;
  }

  removeItem(itemId) {
    window.dispatchEvent(new CustomEvent('removeItem', { detail: { id: itemId } }));
  }

  addItem(item) {
    window.dispatchEvent(new CustomEvent('addItem', { detail: item }));
  }

  goBack() {
    this.fadeToScene('RiversideScene');
  }

  showHintDialog(message) {
    window.dispatchEvent(new CustomEvent('showHintDialog', { detail: { message } }));
  }

  showRotatingHint(key, hints) {
    const currentIndex = this.hintIndex[key] || 0;
    const message = hints[currentIndex];

    this.hintIndex[key] = (currentIndex + 1) % hints.length;
    window.caveSceneHintIndex = this.hintIndex;

    this.showHintDialog(message);
  }

  disableAllAreas() {
    const areas = [this.bonfireArea, this.deskArea, this.backArea];
    areas.forEach(area => {
      if (area) area.disableInteractive();
    });
  }

  enableAllAreas() {
    const areas = [this.bonfireArea, this.deskArea, this.backArea];
    areas.forEach(area => {
      if (area) area.setInteractive({ useHandCursor: true });
    });
  }

  shutdown() {
    window.removeEventListener('dialogClick', this.handleDialogClick);
  }
}
