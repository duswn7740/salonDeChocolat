import Phaser from 'phaser';

export default class PopupScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PopupScene' });
  }

  init(data) {
    // 전달받은 데이터 저장
    this.popupData = data;
  }

  create() {
    const { width, height } = this.cameras.main;
    const {
      popupImage,      // 팝업 배경 이미지 키
      popupSize = { width: 500, height: 500 },  // 팝업 크기
      clickAreas = [],  // 클릭 영역들
      onClose          // 닫을 때 콜백
    } = this.popupData;

    // 반투명 배경 (오버레이)
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setInteractive();  // 뒤 클릭 방지

    // 팝업 배경 이미지
    const popupBg = this.add.image(width / 2, height / 2, popupImage)
      .setOrigin(0.5)
      .setDisplaySize(popupSize.width, popupSize.height);

    // 클릭 영역들 생성
    clickAreas.forEach(area => {
      const clickArea = this.add.rectangle(
        area.x,
        area.y,
        area.width,
        area.height,
        area.debugColor || 0xff0000,  // 디버그용 색상
        area.debugAlpha || 0  // 투명도 (디버그 시 0.3)
      );
      clickArea.setInteractive({ useHandCursor: true });
      
      clickArea.on('pointerdown', () => {
        if (area.callback) {
          area.callback(this);  // 콜백에 scene 전달
        }
      });

      // 활성화 하이라이트 (있으면)
      if (area.highlight) {
        const highlight = this.add.rectangle(
          area.x,
          area.y,
          area.width,
          area.height,
          0xffff00,
          0.3
        );
      }
    });

    // X 버튼 (닫기)
    const closeButton = this.add.circle(
      width / 2 + (popupSize.width / 2) - 20, 
      height / 2 - (popupSize.height / 2) + 20, 
      20, 
      0xd2691e
    );
    closeButton.setInteractive({ useHandCursor: true });
    closeButton.on('pointerdown', () => {
      if (onClose) onClose();
      this.scene.stop('PopupScene');
    });

    const closeText = this.add.text(
      width / 2 + (popupSize.width / 2) - 20,
      height / 2 - (popupSize.height / 2) + 20,
      '✕',
      { fontSize: '24px', color: '#ffffff' }
    ).setOrigin(0.5);
  }
}