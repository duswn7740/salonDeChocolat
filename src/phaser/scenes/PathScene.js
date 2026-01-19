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
  }

  preload() {
    // 배경 이미지 로드
    this.load.image('path', 'assets/images/backgrounds/path.png');

    // 팝업 이미지 로드 (나중에 실제 이미지로 교체)
    // this.load.image('signpost_popup', 'assets/images/popup/signpost.png');
    // this.load.image('stump_popup', 'assets/images/popup/stump.png');
    // this.load.image('rock_popup', 'assets/images/popup/rock.png');
    // this.load.image('bush_popup', 'assets/images/popup/bush.png');
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

    // 1. 표지판 영역 (임시 위치 - 나중에 조정)
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

    // 팝업 설정
    const popupConfig = {
      signpost: {
        // popupImage: 'signpost_popup', // 나중에 이미지 추가
        popupSize: { width: 400, height: 400 },
        clickAreas: [
          {
            x: width / 2,
            y: height / 2,
            width: 150,
            height: 150,
            debugColor: 0x00ff00,
            debugAlpha: 0, // 0으로 바꾸면 안보임
            callback: (popupScene) => {
              this.onPopupItemClick(popupScene, 'signpost');
            }
          }
        ]
      },
      stump: {
        // popupImage: 'stump_popup',
        popupSize: { width: 400, height: 400 },
        clickAreas: [
          {
            x: width / 2,
            y: height / 2,
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
        // popupImage: 'rock_popup',
        popupSize: { width: 400, height: 400 },
        clickAreas: [
          {
            x: width / 2,
            y: height / 2,
            width: 150,
            height: 150,
            debugColor: 0x00ff00,
            debugAlpha: 0,
            callback: (popupScene) => {
              this.onPopupItemClick(popupScene, 'rock');
            }
          }
        ]
      },
      bush: {
        // popupImage: 'bush_popup',
        popupSize: { width: 400, height: 400 },
        clickAreas: [
          {
            x: width / 2,
            y: height / 2,
            width: 150,
            height: 150,
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
    // 여기서 아이템 획득 로직 구현
    // 예: window.dispatchEvent(new CustomEvent('addItem', { detail: { id: 'item_id', name: '아이템명', image: 'path' }}));

    console.log(`${type} 아이템 클릭!`);

    // 팝업 닫기
    popupScene.scene.stop('PopupScene');
    this.enableAllAreas();
    this.activeArea = null;
  }

  // 왼쪽 길로 이동
  goToLeftPath() {
    console.log('왼쪽 길로 이동');
    // TODO: 다음 씬으로 이동
    // this.scene.start('LeftPathScene');
  }

  // 오른쪽 길로 이동
  goToRightPath() {
    console.log('오른쪽 길로 이동');
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
