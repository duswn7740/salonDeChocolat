// src/phaser/scenes/BarnScene.js
import BaseScene from './BaseScene';
import { createClickArea } from '../utils/createClickArea';

export default class BarnScene extends BaseScene {
  constructor() {
    super({ key: 'BarnScene' });
  }

  init() {
    // 상태 초기화
    this.activeArea = null;

    // 힌트 메시지 인덱스 (순환용)
    this.hintIndex = window.barnSceneHintIndex || {
      cow: 0,
      meal: 0
    };

    // 아이템 획득 상태 (씬 재방문 시에도 유지)
    this.collectedItems = window.barnSceneCollectedItems || {
      // wheat_straw 관련
      rake: false,
      straw: false,
      // cow 관련
      cowFed: false,      // 소에게 straw를 줬는지
      gear: false,        // gear 획득 여부
      // meal 관련
      mealRaked: false,   // 여물통에 rake 사용했는지
      blue_key: false,
      tweezers: false
    };
  }

  create() {
    super.create();

    const { width, height } = this.cameras.main;

    // 배경 표시 (소에게 straw를 줬으면 barn_give_straw)
    const bgKey = this.collectedItems.cowFed ? 'barn_give_straw' : 'barn';
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

    // 1. 소 영역
    this.cowArea = createClickArea(this,
      width * 0.25,
      height * 0.6,
      250, 250,
      () => this.showCowPopup(),
      0 // 디버그용
    );

    // 2. 여물통 영역
    this.mealArea = createClickArea(this,
      width * 0.55, 
      height * 0.75,
      240, 100,
      () => this.showMealPopup(),
      0 // 디버그용
    );

    // 3. 밀짚 영역
    this.wheatStrawArea = createClickArea(this,
      width * 0.9,
      height * 0.5,
      200, 200,
      () => this.showWheatStrawPopup(),
      0  // 디버그용
    );

    // 4. 되돌아가기 영역
    this.backArea = createClickArea(this,
      width * 0.5,
      height * 1,
      210, 80,
      () => this.goBack(),
      0
    );
  }

  // ========== 소 팝업 ==========
  showCowPopup() {
    const { width, height } = this.cameras.main;
    this.activeArea = 'cow';
    this.disableAllAreas();

    let popupImage, clickAreas = [];

    if (this.collectedItems.gear) {
      // gear 획득 완료 -> cow_after
      popupImage = 'cow_after';
    } else if (this.collectedItems.cowFed) {
      // straw 줬지만 gear 미획득 -> cow_get_straw (gear 클릭 가능)
      popupImage = 'cow_get_straw';
      clickAreas = [{
        x: width / 2.4,      // TODO: gear 위치 조정
        y: height / 1.6,
        width: 60,
        height: 60,
        debugAlpha: 0,
        callback: (popupScene) => this.collectGear(popupScene)
      }];
    } else {
      // 아직 straw 안 줬음 -> cow_before
      popupImage = 'cow_before';
      clickAreas = [{
        x: width / 2,      // TODO: 소 클릭 영역 조정
        y: height / 2,
        width: 300,
        height: 300,
        debugAlpha: 0,
        callback: () => this.feedCow()
      }];
    }

    this.scene.launch('PopupScene', {
      popupImage,
      popupSize: { width: 500, height: 500 },
      clickAreas,
      onClose: () => {
        this.enableAllAreas();
        this.activeArea = null;
      }
    });
  }

  feedCow() {
    // straw 아이템 사용 체크
    if (!this.checkSelectedItem('straw')) {
      this.playWrongSound();
      const hints = [
        '가까이 갈 수 없어...',
        '소가 배고파 보여...',
        '뭔가 먹을 걸 줘야 할 것 같아...'
      ];
      this.showRotatingHint('cow', hints);
      return;
    }

    // straw 사용
    this.collectedItems.cowFed = true;
    this.saveState();

    // straw 아이템 제거
    this.removeItem('straw');
    this.playRightSound();

    // 배경 즉시 변경
    const { width, height } = this.cameras.main;
    this.background.setTexture('barn_give_straw');
    this.background.setDisplaySize(width, height);

    // 팝업 닫고 다시 열기 (cow_get_straw로)
    this.scene.stop('PopupScene');
    this.showCowPopup();
  }

  collectGear(popupScene) {
    this.collectedItems.gear = true;
    this.saveState();

    // gear 아이템 추가
    this.addItem({
      id: 'gear',
      name: '톱니바퀴',
      image: 'assets/images/items/gear.png'
    });

    // cow_after로 전환
    popupScene.changePopupImage('cow_after');
    popupScene.removeClickAreas();
  }

  // ========== 여물통 팝업 ==========
  showMealPopup() {
    const { width, height } = this.cameras.main;
    this.activeArea = 'meal';
    this.disableAllAreas();

    let popupImage, clickAreas = [];

    const bothCollected = this.collectedItems.blue_key && this.collectedItems.tweezers;

    if (bothCollected) {
      // 둘 다 획득 -> meal_after
      popupImage = 'meal_after';
    } else if (this.collectedItems.mealRaked) {
      // rake 사용했지만 아이템 미완료
      if (this.collectedItems.blue_key) {
        // blue_key만 획득 -> meal_get_blue_key_first (tweezers 클릭 가능)
        popupImage = 'meal_get_blue_key_first';
        clickAreas = [{
          x: width / 1.65,    // TODO: tweezers 위치 조정
          y: height / 2.15,
          width: 50,
          height: 50,
          debugAlpha: 0,
          callback: (popupScene) => this.collectMealItem(popupScene, 'tweezers')
        }];
      } else if (this.collectedItems.tweezers) {
        // tweezers만 획득 -> meal_get_tweezers_first (blue_key 클릭 가능)
        popupImage = 'meal_get_tweezers_first';
        clickAreas = [{
          x: width / 1.5,    // TODO: blue_key 위치 조정
          y: height / 2.3,
          width: 50,
          height: 50,
          debugAlpha: 0,
          callback: (popupScene) => this.collectMealItem(popupScene, 'blue_key')
        }];
      } else {
        // 둘 다 미획득 -> meal_with_rake (둘 다 클릭 가능)
        popupImage = 'meal_with_rake';
        clickAreas = [
          {
            x: width / 1.5,    // TODO: blue_key 위치 조정
            y: height / 2.3,
            width: 50,
            height: 50,
            debugAlpha: 0,
            callback: (popupScene) => this.collectMealItem(popupScene, 'blue_key')
          },
          {
            x: width / 1.65,    // TODO: tweezers 위치 조정
            y: height / 2.15,
            width: 50,
            height: 50,
            debugAlpha: 0,
            callback: (popupScene) => this.collectMealItem(popupScene, 'tweezers')
          }
        ];
      }
    } else {
      // rake 사용 전 -> meal_before
      popupImage = 'meal_before';
      clickAreas = [{
        x: width / 2,
        y: height / 2,
        width: 150,
        height: 150,
        debugAlpha: 0,
        callback: () => this.useMealRake()
      }];
    }

    this.scene.launch('PopupScene', {
      popupImage,
      popupSize: { width: 500, height: 500 },
      clickAreas,
      onClose: () => {
        this.enableAllAreas();
        this.activeArea = null;
      }
    });
  }

  useMealRake() {
    if (!this.checkSelectedItem('rake')) {
      this.playWrongSound();
      this.showHintDialog('이 아래에 뭔가 있는 거 같아...');
      return;
    }

    this.collectedItems.mealRaked = true;
    this.saveState();

    // rake 아이템 제거
    this.removeItem('rake');
    this.playRightSound();

    // 팝업 닫고 다시 열기 (meal_with_rake로)
    this.scene.stop('PopupScene');
    this.showMealPopup();
  }

  collectMealItem(popupScene, itemType) {
    this.collectedItems[itemType] = true;
    this.saveState();

    const itemInfo = {
      blue_key: { id: 'blue_key', name: '파란색 열쇠', image: 'assets/images/items/blue_key.png' },
      tweezers: { id: 'tweezers', name: '핀셋', image: 'assets/images/items/tweezers.png' }
    };

    this.addItem(itemInfo[itemType]);

    // 둘 다 획득했는지 체크
    const bothCollected = this.collectedItems.blue_key && this.collectedItems.tweezers;

    if (bothCollected) {
      // meal_after로 전환
      popupScene.changePopupImage('meal_after');
      popupScene.removeClickAreas();
    } else {
      // 중간 이미지로 전환
      const nextImage = itemType === 'blue_key' ? 'meal_get_blue_key_first' : 'meal_get_tweezers_first';
      popupScene.changePopupImage(nextImage);

      // 남은 아이템 클릭 영역만 유지하도록 팝업 재실행
      this.scene.stop('PopupScene');
      this.showMealPopup();
    }
  }

  // ========== 밀짚 팝업 ==========
  showWheatStrawPopup() {
    const { width, height } = this.cameras.main;
    this.activeArea = 'wheatStraw';
    this.disableAllAreas();

    const rakeCollected = this.collectedItems.rake;
    const strawCollected = this.collectedItems.straw;

    // rake 획득하면 after, 아니면 before (straw만 획득한 경우는 before 유지)
    const popupImage = rakeCollected ? 'wheat_straw_after' : 'wheat_straw_before';

    const clickAreas = [];

    // rake 미획득 시 클릭 영역 추가
    if (!rakeCollected) {
      clickAreas.push({
        x: width / 2.1,    // TODO: rake 위치 조정
        y: height / 1.7,
        width: 60,
        height: 250,
        debugAlpha: 0,
        callback: (popupScene) => this.collectWheatItem(popupScene, 'rake')
      });
    }

    // straw 미획득 시 클릭 영역 추가
    if (!strawCollected) {
      clickAreas.push({
        x: width / 1.5,    // TODO: straw 위치 조정
        y: height / 1.9,
        width: 160,
        height: 160,
        debugAlpha: 0,
        callback: (popupScene) => this.collectWheatItem(popupScene, 'straw')
      });
    }

    this.scene.launch('PopupScene', {
      popupImage,
      popupSize: { width: 500, height: 500 },
      clickAreas,
      onClose: () => {
        this.enableAllAreas();
        this.activeArea = null;
      }
    });
  }

  collectWheatItem(popupScene, itemType) {
    this.collectedItems[itemType] = true;
    this.saveState();

    const itemInfo = {
      rake: { id: 'rake', name: '갈퀴', image: 'assets/images/items/rake.png' },
      straw: { id: 'straw', name: '밀짚', image: 'assets/images/items/straw.png' }
    };

    this.addItem(itemInfo[itemType]);

    // rake 획득 시 after로 변경
    if (itemType === 'rake') {
      popupScene.changePopupImage('wheat_straw_after');
    }

    // 둘 다 획득했는지 체크
    const bothCollected = this.collectedItems.rake && this.collectedItems.straw;

    if (bothCollected) {
      popupScene.removeClickAreas();
    } else {
      // 팝업 재실행하여 남은 클릭 영역만 표시
      this.scene.stop('PopupScene');
      this.showWheatStrawPopup();
    }
  }

  // ========== 유틸리티 메서드 ==========
  saveState() {
    window.barnSceneCollectedItems = this.collectedItems;
  }

  checkSelectedItem(itemId) {
    return window.gameSelectedItem === itemId;
  }

  checkHasItem(itemId) {
    return window.gameInventory?.some(item => item.id === itemId) || false;
  }

  addItem(item) {
    window.dispatchEvent(new CustomEvent('addItem', { detail: item }));
  }

  removeItem(itemId) {
    window.dispatchEvent(new CustomEvent('removeItem', { detail: { id: itemId } }));
  }

  goBack() {
    this.fadeToScene('PathScene');
  }

  showHintDialog(message) {
    window.dispatchEvent(new CustomEvent('showHintDialog', { detail: { message } }));
  }

  // 순환 힌트 메시지 표시
  showRotatingHint(key, hints) {
    const currentIndex = this.hintIndex[key] || 0;
    const message = hints[currentIndex];

    // 다음 인덱스로 업데이트 (순환)
    this.hintIndex[key] = (currentIndex + 1) % hints.length;
    window.barnSceneHintIndex = this.hintIndex;

    this.showHintDialog(message);
  }

  disableAllAreas() {
    const areas = [this.cowArea, this.mealArea, this.wheatStrawArea, this.backArea];
    areas.forEach(area => {
      if (area) area.disableInteractive();
    });
  }

  enableAllAreas() {
    const areas = [this.cowArea, this.mealArea, this.wheatStrawArea, this.backArea];
    areas.forEach(area => {
      if (area) area.setInteractive({ useHandCursor: true });
    });
  }

  shutdown() {
    window.removeEventListener('dialogClick', this.handleDialogClick);
  }
}
