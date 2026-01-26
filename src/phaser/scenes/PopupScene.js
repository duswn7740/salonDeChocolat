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
      overlayItems = [], // 오버레이 아이템들 (서랍 아이템 등)
      onClose          // 닫을 때 콜백
    } = this.popupData;

    // 반투명 배경 (오버레이) - depth 0
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setInteractive();  // 뒤 클릭 방지
    overlay.setDepth(0);

    // after 이미지가 있으면 먼저 깔기 (아래 레이어) - depth 1
    if (popupImageAfter) {
      this.afterImage = this.add.image(width / 2, height / 2, popupImageAfter)
        .setOrigin(0.5)
        .setDisplaySize(popupSize.width, popupSize.height)
        .setDepth(1);
    }

    // before 이미지 (위 레이어) - depth 2
    this.beforeImage = this.add.image(width / 2, height / 2, popupImage)
      .setOrigin(0.5)
      .setDisplaySize(popupSize.width, popupSize.height)
      .setDepth(2);

    // 오버레이 아이템 이미지들 - depth 2.5 (팝업 위, 클릭영역 아래)
    this.overlayItemObjects = [];
    overlayItems.forEach(item => {
      const itemImage = this.add.image(item.x, item.y, item.key)
        .setOrigin(0.5)
        .setDepth(2.5);
      if (item.scale) {
        itemImage.setScale(item.scale);
      }
      this.overlayItemObjects.push(itemImage);
    });

    // 클릭 영역들 생성 - depth 3
    this.clickAreaObjects = [];
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
      clickArea.setDepth(3);
      this.clickAreaObjects.push(clickArea);

      // 활성화 하이라이트 (있으면)
      if (area.highlight) {
        this.add.rectangle(
          area.x,
          area.y,
          area.width,
          area.height,
          0xffff00,
          0.3
        ).setDepth(3);
      }
    });

    // X 버튼 (닫기) - depth 10 (항상 최상위)
    this.closeButton = this.add.circle(
      width / 2 + (popupSize.width / 2) - 20,
      height / 2 - (popupSize.height / 2) + 20,
      20,
      0xd2691e
    );
    this.closeButton.setDepth(10);
    this.closeButton.setInteractive({ useHandCursor: true });
    this.closeButton.on('pointerdown', () => {
      if (onClose) onClose();
      this.scene.stop('PopupScene');
    });

    this.closeButtonText = this.add.text(
      width / 2 + (popupSize.width / 2) - 20,
      height / 2 - (popupSize.height / 2) + 20,
      '✕',
      { fontSize: '24px', color: '#ffffff' }
    ).setOrigin(0.5).setDepth(10);
  }

  // before 이미지 및 클릭 영역 제거 (아이템 획득 시 호출)
  removeBeforeImage() {
    if (this.beforeImage) {
      this.beforeImage.destroy();
      this.beforeImage = null;
    }
    // 클릭 영역들도 함께 제거
    this.removeClickAreas();
  }

  // 팝업 이미지 변경 (상태 전환 시 사용)
  changePopupImage(newImageKey) {
    const { width, height } = this.cameras.main;
    const popupSize = this.popupData.popupSize || { width: 500, height: 500 };

    // 기존 before 이미지 제거
    if (this.beforeImage) {
      this.beforeImage.destroy();
    }

    // 새 이미지로 교체 - depth 2 유지
    this.beforeImage = this.add.image(width / 2, height / 2, newImageKey)
      .setOrigin(0.5)
      .setDisplaySize(popupSize.width, popupSize.height)
      .setDepth(2);
  }

  // 클릭 영역만 제거
  removeClickAreas() {
    if (this.clickAreaObjects) {
      this.clickAreaObjects.forEach(area => {
        if (area) area.destroy();
      });
      this.clickAreaObjects = [];
    }
  }
}
