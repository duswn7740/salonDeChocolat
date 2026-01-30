// src/phaser/scenes/PrologueScene.js
import BaseScene from './BaseScene';
import { COLORS, TEXT_STYLES } from '../styles/gameStyles';

export default class PrologueScene extends BaseScene {
  constructor() {
    super({ key: 'PrologueScene' });
    this.dialogs = [
      '어서오세요!',
      '잘됐다! 조금만 도와주시겠어요?',
      '장난꾸러기 쿠가 초콜릿을 숨겨버렸어요.',
      '살롱이 개최될 수 있게 도와주세요!',
      '이 체리 봉봉을 먹으면 요정의 문으로 들어갈 수 있게 돼요.',
      '요정의 문으로 들어가서 초콜릿을 찾아주세요.',
      '요정의 문은 저쪽에 있어요.'
    ];
  }

  // 씬 시작 시 상태 초기화
  init() {
    this.dialogIndex = 0;
    this.dialogStarted = false;
    this.dialogCompleted = false; // 대화 완료 여부
    this.hasCherryBonbon = false;
    this.cherryBonbonActivated = false;
    this.doorArea = null;
    this.gameCompleted = window.gameCompleted || false;  // 게임 완료 여부
  }

  // preload는 BootScene에서 처리하므로 제거

  create() {
    // 부모 클래스의 create() 호출 (페이드 인)
    super.create();

    const { width, height } = this.cameras.main;

    // 배경 표시
    this.background = this.add.image(width / 2, height / 2, 'salon')
      .setOrigin(0.5)
      .setDisplaySize(width, height);

    // pave_chocolate을 가지고 돌아왔는지 확인
    if (this.checkHasItem('pave_chocolate') && !this.gameCompleted) {
      this.showEndingSequence();
      return;
    }

    // 캐릭터 영역 (클릭 가능한 영역)
    const ownerArea = this.add.rectangle(
      width / 2,
      height / 2,
      300,
      600,
      0xff0000,
      0
    );
    ownerArea.setInteractive({ useHandCursor: true });

    // 캐릭터 클릭 시 대화 시작 (대화 완료 전에만)
    ownerArea.on('pointerdown', () => {
      if (!this.dialogStarted && !this.dialogCompleted) {
        this.startDialog();
      }
    });

    // DialogBox 클릭 이벤트 리스닝 (대화 진행용)
    this.handleDialogClick = () => this.nextDialog();
    window.addEventListener('dialogClick', this.handleDialogClick);

    // 인벤토리 아이템 선택 이벤트 리스닝
    this.handleItemSelected = (event) => {
      const { id } = event.detail;
      if (id === 'cherrybonbon') {
        this.cherryBonbonActivated = true;
      }
    };
    this.handleItemDeselected = (event) => {
      const { id } = event.detail;
      if (id === 'cherrybonbon') {
        this.cherryBonbonActivated = false;
      }
    };
    window.addEventListener('itemSelected', this.handleItemSelected);
    window.addEventListener('itemDeselected', this.handleItemDeselected);
  }

  startDialog() {
    this.dialogStarted = true;
    this.dialogIndex = 0;
    this.showDialog(this.dialogs[0]);
  }

  showDialog(message) {
    window.dispatchEvent(new CustomEvent('showDialog', {
      detail: { message }
    }));
  }

  // 힌트 다이얼로그 (2초 후 자동 닫힘, 클릭해도 dialogClick 안 발생)
  showHintDialog(message) {
    window.dispatchEvent(new CustomEvent('showHintDialog', {
      detail: { message }
    }));
  }

  nextDialog() {
    // 대화 중이 아니면 무시
    if (!this.dialogStarted) return;

    this.dialogIndex++;

    if (this.dialogIndex < this.dialogs.length) {
      // 다음 대화 표시
      this.showDialog(this.dialogs[this.dialogIndex]);
    } else {
      // 대화 종료
      this.dialogStarted = false;

      // 이미 대화 완료했으면 중복 실행 방지
      if (!this.dialogCompleted) {
        this.dialogCompleted = true;
        this.showCherryBonbon();
      }
    }
  }

  showCherryBonbon() {
    const { width, height } = this.cameras.main;

    // DialogBox 닫기
    window.dispatchEvent(new CustomEvent('hideDialog'));

    // 배경을 초콜릿 주는 장면으로 전환
    this.background.setTexture('salon_give_chocolate');

    // 체리봉봉 영역(보이지 않음)
    this.bonbonArea = this.add.rectangle(
      width / 1.4,
      height / 2.83,
      50,
      50,
      0xff0000,
      0
    );
    this.bonbonArea.setInteractive({ useHandCursor: true });

    this.bonbonArea.on('pointerdown', () => {
      this.collectCherryBonbon();
    });

    // 요정의 문 영역도 함께 생성
    this.createFairyDoor();
  }

  collectCherryBonbon() {
    // 이미 획득했으면 무시
    if (this.hasCherryBonbon) return;

    // 아이템 획득
    window.dispatchEvent(new CustomEvent('addItem', {
      detail: {
        id: 'cherrybonbon',
        name: '체리봉봉',
        image: 'assets/images/items/cherrybonbon.png'
      }
    }));

    // 아이템 영역 제거
    if (this.bonbonArea) {
      this.bonbonArea.destroy();
      this.bonbonArea = null;
    }
    this.hasCherryBonbon = true;

    // 배경을 다시 salon으로 전환
    this.background.setTexture('salon');
  }

  createFairyDoor() {
    // 이미 생성되었으면 무시
    if (this.doorArea) return;

    const { width, height } = this.cameras.main;

    // 요정의 문 영역 (this에 저장)
    this.doorArea = this.add.rectangle(
      width / 1.22,
      height / 1.23,
      120,
      200,
      0xff0000,
      0
    );
    this.doorArea.setInteractive({ useHandCursor: true });

    this.doorArea.on('pointerdown', () => {
      this.showElfDoorPopup();
    });
  }

  showElfDoorPopup() {
    const { width, height } = this.cameras.main;

    // 팝업 열 때 PrologueScene 클릭 영역 비활성화
    if (this.doorArea) {
      this.doorArea.disableInteractive();
    }

    this.scene.launch('PopupScene', {
      popupImage: 'elfdoor',
      popupSize: { width: 500, height: 500 },
      clickAreas: [
        // 문 클릭 영역
        {
          x: width / 2,
          y: height / 2,
          width: 200,
          height: 300,
          debugColor: 0xff0000,
          debugAlpha: 0,
          callback: (popupScene) => {
            this.onDoorClickInPopup(popupScene);
          }
        }
      ],
      onClose: () => {
        // 팝업 닫을 때 클릭 영역 다시 활성화
        if (this.doorArea) {
          this.doorArea.setInteractive({ useHandCursor: true });
        }
      }
    });
  }

  onDoorClickInPopup(popupScene) {
    if (this.cherryBonbonActivated) {
      popupScene.scene.stop('PopupScene');

      // 체리봉봉 인벤토리에서 삭제
      window.dispatchEvent(new CustomEvent('removeItem', {
        detail: { id: 'cherrybonbon' }
      }));

      // PathScene으로 페이드 전환
      this.fadeToScene('PathScene');
    } else {
      // 팝업 유지하면서 힌트 dialog 표시 (2초 후 자동 닫힘)
      this.showHintDialog('문이 너무 작아...');
    }
  }

  // ========== 엔딩 시퀀스 ==========
  showEndingSequence() {
    const { width, height } = this.cameras.main;

    // pave_chocolate 제거
    window.dispatchEvent(new CustomEvent('removeItem', {
      detail: { id: 'pave_chocolate' }
    }));

    // 게임 완료 상태 저장
    this.gameCompleted = true;
    window.gameCompleted = true;

    // 감사 메시지 표시
    const thankYouText = this.add.text(
      width / 2,
      height / 3,
      '감사합니다!',
      {
        fontSize: '48px',
        color: '#ffffff',
        fontFamily: 'Arial',
        stroke: '#8B4513',
        strokeThickness: 6
      }
    ).setOrigin(0.5);

    const subText = this.add.text(
      width / 2,
      height / 2.3,
      '파베 초콜릿을 찾아주셔서 고마워요!\n덕분에 살롱을 열 수 있게 되었어요.',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial',
        align: 'center',
        stroke: '#8B4513',
        strokeThickness: 3
      }
    ).setOrigin(0.5);

    // 재시작 버튼
    const restartButton = this.add.text(
      width / 2,
      height / 1.5,
      '다시 시작하기',
      {
        fontSize: '28px',
        color: '#ffffff',
        backgroundColor: '#8B4513',
        padding: { x: 20, y: 10 }
      }
    ).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restartButton.on('pointerdown', () => {
      this.restartGame();
    });
  }

  // 게임 재시작
  restartGame() {
    // 모든 상태 초기화
    window.gameCompleted = false;
    window.pathSceneCollectedItems = null;
    window.caveSceneState = null;
    window.cavePictureOrder = null;
    window.kitchenSceneCollectedItems = null;
    window.kitchenWorktableState = null;
    window.kitchenOxPuzzle = null;
    window.cabinInsideSceneState = null;
    window.cabinInsideBookOrder = null;
    window.cabinOutsideSceneState = null;
    window.riversideSceneState = null;
    window.barnSceneState = null;
    window.forestSceneState = null;
    window.gameInventory = [];
    window.gameSelectedItem = null;

    // TitleScene으로 이동
    this.scene.start('TitleScene');
  }

  // 아이템 보유 여부 확인
  checkHasItem(itemId) {
    return window.gameInventory?.some(item => item.id === itemId) || false;
  }

  shutdown() {
    window.removeEventListener('dialogClick', this.handleDialogClick);
    window.removeEventListener('itemSelected', this.handleItemSelected);
    window.removeEventListener('itemDeselected', this.handleItemDeselected);
  }
}
