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

    // 아이템 획득 상태
    this.collectedItems = window.barnSceneCollectedItems || {
      // TODO: 아이템 영역 추가
      // example: false,
    };
  }

  // preload는 BootScene에서 처리

  create() {
    // 부모 클래스의 create() 호출 (페이드 인)
    super.create();

    const { width, height } = this.cameras.main;

    // 배경 표시
    this.background = this.add.image(width / 2, height / 2, 'barn')
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

    // TODO: 클릭 영역 추가
    // 예시:
    // this.exampleArea = createClickArea(this,
    //   width * 0.5,
    //   height * 0.5,
    //   100, 100,
    //   () => this.showPopup('example'),
    //   0.3  // 디버그용 alpha (완성 후 0으로)
    // );

    // 되돌아가기 영역 (오솔길로)
    this.backArea = createClickArea(this,
      width * 0.5,  // x: 오른쪽
      height * 1,  // y: 중간
      210, 80,
      () => this.goBack(),
      0  // 디버그용 alpha
    );
  }

  // 팝업 표시
  showPopup(type) {
    const { width, height } = this.cameras.main;

    this.activeArea = type;
    this.disableAllAreas();

    const isCollected = this.collectedItems[type];

    // TODO: 팝업 설정 추가
    const popupConfig = {
      // example: {
      //   popupImage: isCollected ? 'example_after' : 'example_before',
      //   popupImageAfter: isCollected ? null : 'example_after',
      //   popupSize: { width: 500, height: 500 },
      //   clickAreas: isCollected ? [] : [
      //     {
      //       x: width / 2,
      //       y: height / 2,
      //       width: 50,
      //       height: 50,
      //       debugColor: 0x00ff00,
      //       debugAlpha: 0.3,
      //       callback: (popupScene) => {
      //         this.onPopupItemClick(popupScene, 'example');
      //       }
      //     }
      //   ]
      // }
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
    window.barnSceneCollectedItems = this.collectedItems;

    // TODO: 아이템 정보 설정
    const itemInfo = {
      // example: {
      //   id: 'item_id',
      //   name: '아이템 이름',
      //   image: 'assets/images/items/아이템.png'
      // }
    };

    const item = itemInfo[type];

    if (item?.id) {
      window.dispatchEvent(new CustomEvent('addItem', {
        detail: item
      }));
    }

    popupScene.removeBeforeImage();
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
      this.backArea,
      // TODO: 추가 영역들
    ];
    areas.forEach(area => {
      if (area) area.disableInteractive();
    });
  }

  // 모든 클릭 영역 활성화
  enableAllAreas() {
    const areas = [
      this.backArea,
      // TODO: 추가 영역들
    ];
    areas.forEach(area => {
      if (area) area.setInteractive({ useHandCursor: true });
    });
  }

  shutdown() {
    window.removeEventListener('dialogClick', this.handleDialogClick);
  }
}
