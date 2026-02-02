// src/phaser/scenes/PathScene.js
import BaseScene from './BaseScene';
import { createClickArea } from '../utils/createClickArea';

export default class PathScene extends BaseScene {
  constructor() {
    super({ key: 'PathScene' });
  }

  init() {
    // 상태 초기화
    this.activeArea = null; // 현재 활성화된 클릭 영역

    // 아이템 획득 상태 (씬 재방문 시에도 유지하려면 window나 별도 저장소 사용)
    this.collectedItems = window.pathSceneCollectedItems || {
      signpost: false,
      stump: false,           // strong_woodstick 획득
      woodstickPlaced: false, // stump 위에 나뭇가지 올림
      firewood: false,        // 장작 획득 완료
      rock: false,
      bush: false
    };

    // 힌트 메시지 인덱스 (순환용)
    this.hintIndex = window.pathSceneHintIndex || {
      stump: 0
    };
  }

  // preload는 BootScene에서 처리하므로 제거

  create() {
    // 부모 클래스의 create() 호출 (페이드 인)
    super.create();

    const { width, height } = this.cameras.main;

    // 배경 표시 (나뭇가지 획득 여부에 따라 다른 배경)
    const bgKey = this.collectedItems.stump ? 'path_get_woodstick' : 'path';
    this.background = this.add.image(width / 2, height / 2, bgKey)
      .setOrigin(0.5)
      .setDisplaySize(width, height);

    // 터치 가능한 영역들 생성
    this.createInteractiveAreas();

    // DialogBox 이벤트 리스닝 (힌트용)
    this.handleDialogClick = () => {
      // 힌트 다이얼로그는 자동으로 닫히므로 별도 처리 불필요
    };
    window.addEventListener('dialogClick', this.handleDialogClick);
  }

  createInteractiveAreas() {
    const { width, height } = this.cameras.main;

    // 1. 표지판 영역
    this.signpostArea = createClickArea(this,
      width * 0.5,
      height * 0.35,
      100, 150,
      () => this.showPopup('signpost'),
      0,
    );

    // 2. 나무밑둥 영역
    this.stumpArea = createClickArea(this,
      width * 0.1,
      height * 0.6,
      120, 100,
      () => this.showPopup('stump'),
      0,
    );

    // 3. 돌덩이 영역
    this.rockArea = createClickArea(this,
      width * 0.24,
      height * 0.78,
      210, 130,
      () => this.showPopup('rock'),
      0,
    );

    // 4. 풀숲 영역
    this.bushArea = createClickArea(this,
      width * 0.9,
      height * 0.65,
      140, 250,
      () => this.showPopup('bush'),
      0,
    );

    // 5. 왼쪽 길 영역 (외양간)
    this.leftPathArea = createClickArea(this,
      width * 0.05,
      height * 0.3,
      120, 150,
      () => this.goToLeftPath(),
      0
    );

    // 6. 오른쪽 길 영역 (숲)
    this.rightPathArea = createClickArea(this,
      width * 0.95,
      height * 0.3,
      120, 150,
      () => this.goToRightPath(),
      0
    );

    // 7. 되돌아가기 영역 (아래쪽)
    this.backArea = createClickArea(this,
      width * 0.5,
      height * 1,
      210, 80,
      () => this.goBack(),
      0
    );
  }

  // 팝업 표시
  showPopup(type) {
    const { width, height } = this.cameras.main;

    // 현재 영역 저장 (팝업 닫을 때 다시 활성화하기 위해)
    this.activeArea = type;

    // 모든 클릭 영역 비활성화
    this.disableAllAreas();

    // 이미 아이템을 획득했는지 확인
    const isCollected = this.collectedItems[type];

    // 팝업 설정 (레이어 방식: after를 깔고 before를 위에 올림)
    const popupConfig = {
      signpost: {
        popupImage: isCollected ? 'signpost_after' : 'signpost_before',
        popupImageAfter: isCollected ? null : 'signpost_after',
        popupSize: { width: 500, height: 500 },
        clickAreas: isCollected ? [] : [
          {
            x: width / 1.95,
            y: height / 2.8,
            width: 20,
            height: 20,
            debugColor: 0x00ff00,
            debugAlpha: 0,
            callback: (popupScene) => {
              // 핀셋 아이템 사용 체크
              const hasTweezers = this.checkSelectedItem('tweezers');
              if (hasTweezers) {
                // tweezers 아이템 제거
                this.removeItem('tweezers');
                this.playRightSound();
                this.onPopupItemClick(popupScene, 'signpost');
              } else {
                this.playWrongSound();
                this.showHintDialog('꽉 끼어 있어...');
              }
            }
          }
        ]
      },
      stump: this.getStumpPopupConfig(width, height),
      rock: {
        popupImage: isCollected ? 'rock_after' : 'rock_before',
        popupImageAfter: isCollected ? null : 'rock_after',
        popupSize: { width: 500, height: 500 },
        clickAreas: isCollected ? [] : [
          {
            x: width / 1.67,
            y: height / 1.6,
            width: 45,
            height: 45,
            debugColor: 0x00ff00,
            debugAlpha: 0,
            callback: (popupScene) => {
              this.onPopupItemClick(popupScene, 'rock');
            }
          }
        ]
      },
      bush: {
        popupImage: isCollected ? 'bush_after' : 'bush_before',
        popupImageAfter: isCollected ? null : 'bush_after',
        popupSize: { width: 500, height: 500 },
        clickAreas: isCollected ? [] : [
          {
            x: width / 1.51,
            y: height / 1.32,
            width: 50,
            height: 50,
            debugColor: 0x00ff00,
            debugAlpha: 0,
            callback: (popupScene) => {
              this.onPopupItemClick(popupScene, 'bush');
            }
          }
        ]
      }
    };

    const config = popupConfig[type];

    this.scene.launch('PopupScene', {
      ...config,
      onClose: () => {
        this.enableAllAreas();
        this.activeArea = null;
      }
    });
  }

  // ========== Stump 팝업 설정 (3단계) ==========
  getStumpPopupConfig(width, height) {
    // 3단계: 장작 획득 완료
    if (this.collectedItems.firewood) {
      return {
        popupImage: 'stump_after',
        popupSize: { width: 500, height: 500 },
        clickAreas: []
      };
    }

    // 2단계: 나뭇가지 올려진 상태 → 도끼 사용 → 장작 획득
    if (this.collectedItems.woodstickPlaced) {
      return {
        popupImage: 'stump_after',
        popupSize: { width: 500, height: 500 },
        overlayItems: [{
          key: 'strong_woodstick',
          x: width / 3.1,
          y: height / 2.2,
          scale: 0.4
        }],
        clickAreas: [{
          x: width / 3.2,
          y: height / 2.2,
          width: 200,
          height: 100,
          debugColor: 0xff0000,
          debugAlpha: 0,
          callback: () => this.tryChopWood()
        }]
      };
    }

    // 1단계: 나뭇가지 획득 완료 → 나뭇가지 올리기 가능
    if (this.collectedItems.stump) {
      return {
        popupImage: 'stump_after',
        popupSize: { width: 500, height: 500 },
        clickAreas: [{
          x: width / 3.2,
          y: height / 2.2,
          width: 200,
          height: 100,
          debugColor: 0x00ff00,
          debugAlpha: 0,
          callback: () => this.tryPlaceWoodstick()
        }]
      };
    }

    // 0단계: 나뭇가지 획득 전
    return {
      popupImage: 'stump_before',
      popupImageAfter: 'stump_after',
      popupSize: { width: 500, height: 500 },
      clickAreas: [{
        x: width / 2,
        y: height / 2.3,
        width: 150,
        height: 150,
        debugColor: 0x0000ff,
        debugAlpha: 0,
        callback: (popupScene) => {
          this.onPopupItemClick(popupScene, 'stump');
        }
      }]
    };
  }

  // 나뭇가지 올리기 시도
  tryPlaceWoodstick() {
    if (this.checkSelectedItem('strong_woodstick')) {
      this.collectedItems.woodstickPlaced = true;
      window.pathSceneCollectedItems = this.collectedItems;
      this.removeItem('strong_woodstick');
      this.playRightSound();

      // 팝업 재실행 (overlay 표시)
      this.scene.stop('PopupScene');
      this.showPopup('stump');
    } else {
      this.playWrongSound();
      const hints = [
        '뭔가 올려놓을 수 있을 것 같아...',
        '튼튼한 나뭇가지가 있으면...'
      ];
      this.showRotatingHint('stump', hints);
    }
  }

  // 도끼로 장작 만들기 시도
  tryChopWood() {
    if (this.checkSelectedItem('axe')) {
      this.collectedItems.firewood = true;
      window.pathSceneCollectedItems = this.collectedItems;
      this.removeItem('axe');
      this.playRightSound();

      // 장작 아이템 추가
      window.dispatchEvent(new CustomEvent('addItem', {
        detail: {
          id: 'firewood',
          name: '장작',
          image: 'assets/images/items/firewood.png'
        }
      }));

      // 팝업 재실행 (overlay 제거)
      this.scene.stop('PopupScene');
      this.showPopup('stump');
    } else {
      this.playWrongSound();
      this.showHintDialog('이걸로는 자를 수 없어...');
    }
  }

  // 순환 힌트 메시지 표시
  showRotatingHint(key, hints) {
    const currentIndex = this.hintIndex[key] || 0;
    const message = hints[currentIndex];

    this.hintIndex[key] = (currentIndex + 1) % hints.length;
    window.pathSceneHintIndex = this.hintIndex;

    this.showHintDialog(message);
  }

  // 팝업 내 아이템 클릭 시
  onPopupItemClick(popupScene, type) {
    // 아이템 획득 처리
    this.collectedItems[type] = true;
    // 씬 재방문 시에도 상태 유지
    window.pathSceneCollectedItems = this.collectedItems;

    // 아이템 정보 설정
    const itemInfo = {
      signpost: {
        id: 'yellow_key',
        name: '노란색 열쇠',
        image: 'assets/images/items/yellow_key.png'
      },
      stump: {
        id: 'strong_woodstick',
        name: '튼튼한 나뭇가지',
        image: 'assets/images/items/strong_woodstick.png'
      },
      rock: {
        id: 'paper1',
        name: '종이 조각1',
        image: 'assets/images/items/paper1.png'
      },
      bush: {
        id: 'knight_piece',
        name: '나이트 말',
        image: 'assets/images/items/knight_piece.png'
      }
    };

    const item = itemInfo[type];

    // 아이템 인벤토리에 추가
    if (item.id) {
      window.dispatchEvent(new CustomEvent('addItem', {
        detail: item
      }));
    }

    // 나뭇가지 획득 시 배경 즉시 변경 + 팝업 재실행 (1단계 clickArea 활성화)
    if (type === 'stump') {
      const { width, height } = this.cameras.main;
      this.background.setTexture('path_get_woodstick');
      this.background.setDisplaySize(width, height);

      // 팝업 재실행하여 1단계 clickArea 활성화
      this.scene.stop('PopupScene');
      this.showPopup('stump');
      return;
    }

    // before 이미지만 제거 (깜빡임 없이 자연스럽게 after 노출)
    popupScene.removeBeforeImage();
  }

  // 왼쪽 길(외양간)로 이동
  goToLeftPath() {
    this.fadeToScene('BarnScene');
  }

  // 오른쪽 길(숲)로 이동
  goToRightPath() {
    this.fadeToScene('ForestScene');
  }

  // 되돌아가기
  goBack() {
    // 완성된 파베 초콜릿 아이템 체크
    const hasCompletedChocolate = this.checkHasItem('pave_chocolate');

    if (hasCompletedChocolate) {
      // 아이템이 있으면 이전 씬으로 페이드 전환
      this.fadeToScene('PrologueScene');
    } else {
      // 아이템이 없으면 힌트 다이얼로그 표시
      this.showHintDialog('지금은 돌아갈 수 없어...');
    }
  }

  // 아이템 보유 여부 체크 (React Inventory와 연동)
  checkHasItem(itemId) {
    return window.gameInventory?.some(item => item.id === itemId) || false;
  }

  // 현재 선택된 아이템 체크 (React Inventory와 연동)
  checkSelectedItem(itemId) {
    return window.gameSelectedItem === itemId;
  }

  // 아이템 제거 (React Inventory와 연동)
  removeItem(itemId) {
    window.dispatchEvent(new CustomEvent('removeItem', { detail: { id: itemId } }));
  }

  // 힌트 다이얼로그 (2초 후 자동 닫힘)
  showHintDialog(message) {
    window.dispatchEvent(new CustomEvent('showHintDialog', {
      detail: { message }
    }));
  }

  // 모든 클릭 영역 비활성화
  disableAllAreas() {
    const areas = [
      this.signpostArea,
      this.stumpArea,
      this.rockArea,
      this.bushArea,
      this.leftPathArea,
      this.rightPathArea,
      this.backArea
    ];
    areas.forEach(area => {
      if (area) area.disableInteractive();
    });
  }

  // 모든 클릭 영역 활성화
  enableAllAreas() {
    const areas = [
      this.signpostArea,
      this.stumpArea,
      this.rockArea,
      this.bushArea,
      this.leftPathArea,
      this.rightPathArea,
      this.backArea
    ];
    areas.forEach(area => {
      if (area) area.setInteractive({ useHandCursor: true });
    });
  }

  shutdown() {
    window.removeEventListener('dialogClick', this.handleDialogClick);
  }
}
