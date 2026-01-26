// src/phaser/scenes/ForestScene.js
import BaseScene from './BaseScene';
import { createClickArea } from '../utils/createClickArea';

export default class ForestScene extends BaseScene {
  constructor() {
    super({ key: 'ForestScene' });
  }

  init() {
    // 상태 초기화
    this.activeArea = null;

    // 아이템 획득 상태
    this.collectedItems = window.forestSceneCollectedItems || {
      birdhouse: false,  // 새집
      axe: false         // 도끼
    };
  }

  // preload는 BootScene에서 처리

  create() {
    // 부모 클래스의 create() 호출 (페이드 인)
    super.create();

    const { width, height } = this.cameras.main;

    // 배경 표시 (도끼 획득 여부에 따라 다른 배경)
    const bgKey = this.collectedItems.axe ? 'forest_get_axe' : 'forest';
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

    // 1. 새집 영역
    this.birdhouseArea = createClickArea(this,
      width * 0.28,   // TODO: x 위치 조정
      height * 0.48,  // TODO: y 위치 조정
      100, 100,      // TODO: 크기 조정
      () => this.showPopup('birdhouse'),
      0  // 디버그용 alpha (완성 후 0으로)
    );

    // 2. 도끼 영역 (획득 전에만 표시)
    if (!this.collectedItems.axe) {
      this.axeArea = createClickArea(this,
        width * 0.24,   // TODO: x 위치 조정
        height * 0.78,  // TODO: y 위치 조정
        150, 80,       // TODO: 크기 조정
        () => this.collectAxe(),
        0. // 디버그용 alpha (완성 후 0으로)
      );
    }

    // 3. 오두막 가는 길 영역
    this.cabinPathArea = createClickArea(this,
      width * 0.75,   // TODO: x 위치 조정
      height * 0.7,  // TODO: y 위치 조정
      220, 90,      // TODO: 크기 조정
      () => this.goToCabin(),
      0  // 디버그용 alpha (완성 후 0으로)
    );

    // 4. 되돌아가기 영역 (오솔길로)
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

    this.activeArea = type;
    this.disableAllAreas();

    const isCollected = this.collectedItems[type];

    // 팝업 설정
    const popupConfig = {
      birdhouse: {
        popupImage: isCollected ? 'birdhouse_after' : 'birdhouse_before',
        popupImageAfter: isCollected ? null : 'birdhouse_after',
        popupSize: { width: 500, height: 500 },
        clickAreas: isCollected ? [] : [
          {
            // TODO: 아이템 클릭 영역 위치 조정
            x: width / 1.9,
            y: height / 1.75,
            width: 50,
            height: 50,
            debugColor: 0x00ff00,
            debugAlpha: 0,  // 완성 후 0으로
            callback: (popupScene) => {
              this.onPopupItemClick(popupScene, 'birdhouse');
            }
          }
        ]
      }
    };

    const config = popupConfig[type];
    if (!config) return;

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
    this.collectedItems[type] = true;
    window.forestSceneCollectedItems = this.collectedItems;

    // 아이템 정보 설정
    const itemInfo = {
      birdhouse: {
        // TODO: 새집에서 획득하는 아이템 정보 입력
        id: 'pendant',
        name: '팬던트',
        image: 'assets/images/items/pendant.png'
      }
    };

    const item = itemInfo[type];

    if (item?.id) {
      window.dispatchEvent(new CustomEvent('addItem', {
        detail: item
      }));
    }

    popupScene.removeBeforeImage();
  }

  // 도끼 획득
  collectAxe() {
    // 이미 획득했으면 무시
    if (this.collectedItems.axe) return;

    // 아이템 획득 처리
    this.collectedItems.axe = true;
    window.forestSceneCollectedItems = this.collectedItems;

    // 아이템 인벤토리에 추가
    window.dispatchEvent(new CustomEvent('addItem', {
      detail: {
        id: 'axe',
        name: '도끼',
        image: 'assets/images/items/axe.png'
      }
    }));

    // 도끼 클릭 영역 제거
    if (this.axeArea) {
      this.axeArea.destroy();
      this.axeArea = null;
    }

    // 배경 즉시 변경
    const { width, height } = this.cameras.main;
    this.background.setTexture('forest_get_axe');
    this.background.setDisplaySize(width, height);
  }

  // 오두막으로 이동
  goToCabin() {
    this.fadeToScene('CabinOutsideScene');
  }

  // 오솔길로 돌아가기
  goBack() {
    this.fadeToScene('PathScene');
  }

  // 힌트 다이얼로그
  showHintDialog(message) {
    window.dispatchEvent(new CustomEvent('showHintDialog', {
      detail: { message }
    }));
  }

  // 모든 클릭 영역 비활성화
  disableAllAreas() {
    const areas = [
      this.birdhouseArea,
      this.axeArea,
      this.cabinPathArea,
      this.backArea
    ];
    areas.forEach(area => {
      if (area) area.disableInteractive();
    });
  }

  // 모든 클릭 영역 활성화
  enableAllAreas() {
    const areas = [
      this.birdhouseArea,
      this.axeArea,
      this.cabinPathArea,
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
