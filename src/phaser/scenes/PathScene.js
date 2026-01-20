// src/phaser/scenes/PathScene.js
import Phaser from 'phaser';
import { createClickArea } from '../utils/createClickArea';

export default class PathScene extends Phaser.Scene {
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

  preload() {
    // 배경 이미지 로드
    this.load.image('path', 'assets/images/backgrounds/path.png');

    // 팝업 이미지 로드 (나중에 실제 이미지로 교체)
    this.load.image('signpost_before', 'assets/images/popup/signpost_before.png');
    this.load.image('signpost_after', 'assets/images/popup/signpost_after.png');
    this.load.image('stump_before', 'assets/images/popup/stump_before.png');
    this.load.image('stump_after', 'assets/images/popup/stump_after.png');
    this.load.image('rock_before', 'assets/images/popup/rock_before.png');
    this.load.image('rock_after', 'assets/images/popup/rock_after.png');
    this.load.image('bush_before', 'assets/images/popup/bush_before.png');
    this.load.image('bush_after', 'assets/images/popup/bush_after.png');

    // 아이템 이미지 로드
    this.load.image('coin', 'assets/images/items/coin.png')
    this.load.image('paper1', 'assets/images/items/paper1.png')
    this.load.image('strong_woodstick', 'assets/images/items/strong_woodstick.png')
    this.load.image('yellow_key', 'assets/images/items/yellow_key.png')
  }

  create() {
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
      width * 0.5,   // x: 왼쪽 20% 위치
      height * 0.35,  // y: 위에서 30% 위치
      100, 150,      // 너비, 높이
      () => this.showPopup('signpost'),
      0, 
    );

    // 2. 나무밑둥 영역
    this.stumpArea = createClickArea(this,
      width * 0.1,  // x: 오른쪽 75% 위치
      height * 0.6,  // y: 중간
      120, 100,
      () => this.showPopup('stump'),
      0,
    );

    // 3. 돌덩이 영역
    this.rockArea = createClickArea(this,
      width * 0.24,   // x: 왼쪽 30% 위치
      height * 0.78, // y: 아래쪽
      210, 130,
      () => this.showPopup('rock'),
      0,
    );

    // 4. 풀숲 영역
    this.bushArea = createClickArea(this,
      width * 0.9,   // x: 오른쪽 60% 위치
      height * 0.65,  // y: 아래쪽
      140, 250,
      () => this.showPopup('bush'),
      0,
    );

    // 5. 왼쪽 길 영역
    this.leftPathArea = createClickArea(this,
      width * 0.05,  // x: 왼쪽 끝
      height * 0.3, // y
      120, 150,
      () => this.goToLeftPath(),
      0
    );

    // 6. 오른쪽 길 영역
    this.rightPathArea = createClickArea(this,
      width * 0.95,  // x: 오른쪽 끝
      height * 0.3, // y
      120, 150,
      () => this.goToRightPath(),
      0
    );

    // 7. 되돌아가기 영역 (아래쪽)
    this.backArea = createClickArea(this,
      width * 0.5,   // x: 중앙
      height * 1,    // y: 맨 아래
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

    // 팝업 설정 (before/after 이미지 분기)
    const popupConfig = {
      signpost: {
        popupImage: isCollected ? 'signpost_after' : 'signpost_before',
        popupSize: { width: 500, height: 500 },
        // 아이템 미획득 시에만 클릭 영역 표시
        clickAreas: isCollected ? [] : [
          {
            // TODO: 아이템 클릭 영역 위치 조정
            x: width / 1.9,
            y: height / 2.7,
            width: 20,
            height: 20,
            debugColor: 0x00ff00,
            debugAlpha: 0, // 테스트용, 완성 후 0으로
            callback: (popupScene) => {
              this.onPopupItemClick(popupScene, 'signpost');
            }
          }
        ]
      },
      stump: {
        popupImage: isCollected ? 'stump_after' : 'stump_before',
        popupSize: { width: 500, height: 500 },
        clickAreas: isCollected ? [] : [
          {
            // TODO: 아이템 클릭 영역 위치 조정
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
        popupSize: { width: 500, height: 500 },
        clickAreas: isCollected ? [] : [
          {
            // TODO: 아이템 클릭 영역 위치 조정
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
        popupSize: { width: 500, height: 500 },
        clickAreas: isCollected ? [] : [
          {
            // TODO: 아이템 클릭 영역 위치 조정
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
        // TODO: 아이템 정보 입력
        id: 'yellow_key',
        name: '노란색 열쇠',
        image: 'assets/images/items/yellow_key.png'
      },
      stump: {
        // TODO: 아이템 정보 입력
        id: 'strong_woodstick',
        name: '튼튼한 나뭇가지',
        image: 'assets/images/items/strong_woodstick.png'
      },
      rock: {
        // TODO: 아이템 정보 입력
        id: 'paper1',
        name: '종이 조각1',
        image: 'assets/images/items/paper1.png'
      },
      bush: {
        // TODO: 아이템 정보 입력
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

    // 팝업 닫고 after 이미지로 다시 열기
    popupScene.scene.stop('PopupScene');

    // 잠시 후 after 팝업 표시
    this.time.delayedCall(100, () => {
      this.showPopup(type);
    });
  }

  // 왼쪽 길(외양간)로 이동
  goToLeftPath() {
    console.log('외양간으로 이동');
    // TODO: 다음 씬으로 이동
    // this.scene.start('LeftPathScene');
  }

  // 오른쪽 길(숲)로 이동
  goToRightPath() {
    console.log('숲으로 이동');
    // TODO: 다음 씬으로 이동
    // this.scene.start('RightPathScene');
  }

  // 되돌아가기
  goBack() {
    // 완성된 파베 초콜릿 아이템 체크
    // 인벤토리 상태를 확인하기 위해 커스텀 이벤트 사용
    const hasCompletedChocolate = this.checkHasItem('completed_pave_chocolate');

    if (hasCompletedChocolate) {
      // 아이템이 있으면 이전 씬으로 이동
      this.scene.start('PrologueScene');
    } else {
      // 아이템이 없으면 힌트 다이얼로그 표시
      this.showHintDialog('지금은 돌아갈 수 없어...');
    }
  }

  // 아이템 보유 여부 체크 (React Inventory와 연동)
  checkHasItem(itemId) {
    // 동기적으로 체크하기 위해 window에 저장된 인벤토리 상태 확인
    // Inventory 컴포넌트에서 window.gameInventory에 상태를 저장하도록 수정 필요
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
