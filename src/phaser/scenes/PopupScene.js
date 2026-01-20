import Phaser from 'phaser';
import { createClickArea } from '../utils/createClickArea';

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
      popupImage,      // 팝업 배경 이미지 키 (before 또는 after)
      popupImageAfter, // after 이미지 키 (선택적)
      popupSize = { width: 500, height: 500 },  // 팝업 크기
      clickAreas = [],  // 클릭 영역들
      onClose          // 닫을 때 콜백
    } = this.popupData;

    // 반투명 배경 (오버레이)
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setInteractive();  // 뒤 클릭 방지

    // after 이미지가 있으면 먼저 깔기 (아래 레이어)
    if (popupImageAfter) {
      this.afterImage = this.add.image(width / 2, height / 2, popupImageAfter)
        .setOrigin(0.5)
        .setDisplaySize(popupSize.width, popupSize.height);
    }

    // before 이미지 (위 레이어) - 아이템 획득 시 이 이미지만 제거
    this.beforeImage = this.add.image(width / 2, height / 2, popupImage)
      .setOrigin(0.5)
      .setDisplaySize(popupSize.width, popupSize.height);

    // 클릭 영역들 생성 (createClickArea 유틸리티 사용)
    clickAreas.forEach(area => {
      const clickArea = createClickArea(
        this,
        area.x,
        area.y,
        area.width,
        area.height,
        () => {
          if (area.callback) {
            area.callback(this);  // 콜백에 scene 전달
          }
        },
        area.debugAlpha || 0,
        area.debugColor || 0xff0000
      );

      // 활성화 하이라이트 (있으면)
      if (area.highlight) {
        this.add.rectangle(
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

    this.add.text(
      width / 2 + (popupSize.width / 2) - 20,
      height / 2 - (popupSize.height / 2) + 20,
      '✕',
      { fontSize: '24px', color: '#ffffff' }
    ).setOrigin(0.5);
  }

  // before 이미지 제거 (아이템 획득 시 호출)
  removeBeforeImage() {
    if (this.beforeImage) {
      this.beforeImage.destroy();
      this.beforeImage = null;
    }
  }
}
