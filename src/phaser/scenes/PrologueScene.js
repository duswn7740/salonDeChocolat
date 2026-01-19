// src/phaser/scenes/PrologueScene.js
import Phaser from 'phaser';
import { COLORS, TEXT_STYLES } from '../styles/gameStyles';

export default class PrologueScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PrologueScene' });
    this.dialogIndex = 0;
    this.dialogStarted = false;
    this.hasCherryBonbon = false;
    this.cherryBonbonActivated = false;
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

  preload() {
    // 배경 이미지 로드
    this.load.image('salon', 'images/backgrounds/salon.png');
    this.load.image('salon_give', 'images/backgrounds/salon_give_chocolate.png');
    
    // 아이템 이미지 로드
    this.load.image('cherrybonbon', 'images/items/cherrybonbon.png');

    // 팝업 이미지 로드
    this.load.image('elfdoor', 'images/popup/elfdoor.png');
  
  }

  create() {
    const { width, height } = this.cameras.main;

    // 배경 표시
    this.background = this.add.image(width / 2, height / 2, 'salon')
      .setOrigin(0.5)
      .setDisplaySize(width, height);

    // 캐릭터 영역 (클릭 가능한 영역)
    const ownerArea = this.add.rectangle(
      width / 2,
      height / 2,
      300,
      600,
      0xff0000,
      0
    );
    ownerArea.setInteractive({ useHandCursor:true})

    
    // 캐릭터 클릭 시 대화 시작
    ownerArea.on('pointerdown', () => {
      if (!this.dialogStarted) {
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
    this.dialogIndex=0;
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
      this.showCherryBonbon();
    }
  }

  showCherryBonbon() {
    const { width, height } = this.cameras.main;

    // DialogBox 닫기
    window.dispatchEvent(new CustomEvent('hideDialog'));

    // 배경을 초콜릿 주는 장면으로 전환
    this.background.setTexture('salon_give');

    // 체리봉봉 영역(보이지 않음)
    const bonbonArea = this.add.rectangle(
      width / 1.4,
      height / 2.83,
      50,
      50,
      0xff0000,
      0
    );
    bonbonArea.setInteractive({ useHandCursor:true });

    bonbonArea.on('pointerdown', ()=>{
      this.collectCherryBonbon(bonbonArea);
    })

    // 요정의 문 영역도 함께 생성
    this.createFairyDoor();
  }

  collectCherryBonbon(bonbon) {
    // 아이템 획득
    window.dispatchEvent(new CustomEvent('addItem', {
      detail: {
        id: 'cherrybonbon',
        name: '체리봉봉',
        image: 'images/items/cherrybonbon.png'
      }
    }));

    // 아이템 제거
    bonbon.destroy();
    this.hasCherryBonbon = true;

    // 배경을 다시salon 으로 전환
    this.background.setTexture('salon');
  }

  createFairyDoor() {
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
      this.showElfDoorPopup()
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
          debugAlpha: 0,  // 0으로 바꾸면 안보임
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

    // PathScene으로 이동
    this.scene.start('PathScene');
  } else {
    // 팝업 유지하면서 힌트 dialog 표시 (2초 후 자동 닫힘)
    this.showHintDialog('문이 너무 작아...');
  }
}

  shutdown() {
    window.removeEventListener('dialogClick', this.handleDialogClick);
    window.removeEventListener('itemSelected', this.handleItemSelected);
    window.removeEventListener('itemDeselected', this.handleItemDeselected);
  }
}