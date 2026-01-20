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
      stump: false,
      rock: false,
      bush: false
    };
  }

  // preload는 BootScene에서 처리하므로 제거

  create() {
    // 부모 클래스의 create() 호출 (페이드 인)
    super.create();

    const { width, height } = this.cameras.main;

    // 배경 표시
    this.background = this.add.image(width / 2, height / 2, 'path')
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
            x: width / 1.9,
            y: height / 2.7,
            width: 20,
            height: 20,
            debugColor: 0x00ff00,
            debugAlpha: 0,
            callback: (popupScene) => {
              this.onPopupItemClick(popupScene, 'signpost');
            }
          }
        ]
      },
      stump: {
        popupImage: isCollected ? 'stump_after' : 'stump_before',
        popupImageAfter: isCollected ? null : 'stump_after',
        popupSize: { width: 500, height: 500 },
        clickAreas: isCollected ? [] : [
          {
            x: width / 2,
            y: height / 2.3,
            width: 150,
            height: 150,
            debugColor: 0x00ff00,
            debugAlpha: 0,
            callback: (popupScene) => {
              this.onPopupItemClick(popupScene, 'stump');
            }
          }
        ]
      },
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
            width: 25,
            height: 25,
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
        id: 'coin',
        name: '작은 동전',
        image: 'assets/images/items/coin.png'
      }
    };

    const item = itemInfo[type];

    // 아이템 인벤토리에 추가
    if (item.id) {
      window.dispatchEvent(new CustomEvent('addItem', {
        detail: item
      }));
    }

    // before 이미지만 제거 (깜빡임 없이 자연스럽게 after 노출)
    popupScene.removeBeforeImage();
  }

  // 왼쪽 길(외양간)로 이동
  goToLeftPath() {
    console.log('외양간으로 이동');
    // TODO: 다음 씬으로 페이드 전환
    // this.fadeToScene('BarnScene');
  }

  // 오른쪽 길(숲)로 이동
  goToRightPath() {
    console.log('숲으로 이동');
    // TODO: 다음 씬으로 페이드 전환
    // this.fadeToScene('ForestScene');
  }

  // 되돌아가기
  goBack() {
    // 완성된 파베 초콜릿 아이템 체크
    const hasCompletedChocolate = this.checkHasItem('completed_pave_chocolate');

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
