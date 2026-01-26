// src/phaser/scenes/CabinOutsideScene.js
import BaseScene from './BaseScene';
import { createClickArea } from '../utils/createClickArea';

export default class CabinOutsideScene extends BaseScene {
  constructor() {
    super({ key: 'CabinOutsideScene' });
  }

  init() {
    // 상태 초기화
    this.activeArea = null;

    // 힌트 메시지 인덱스 (순환용)
    this.hintIndex = window.cabinOutsideHintIndex || {
      door: 0
    };

    // 상태 (씬 재방문 시에도 유지)
    this.sceneState = window.cabinOutsideSceneState || {
      doorUnlocked: false  // 문이 열렸는지
    };
  }

  create() {
    super.create();

    const { width, height } = this.cameras.main;

    // 배경 표시 (문이 열렸으면 cabin_outside_open_door)
    const bgKey = this.sceneState.doorUnlocked ? 'cabin_outside_open_door' : 'cabin_outside';
    this.background = this.add.image(width / 2, height / 2, bgKey)
      .setOrigin(0.5)
      .setDisplaySize(width, height);

    // 터치 가능한 영역들 생성
    this.createInteractiveAreas();

    // DialogBox 이벤트 리스닝
    this.handleDialogClick = () => {};
    window.addEventListener('dialogClick', this.handleDialogClick);
  }

  createInteractiveAreas() {
    const { width, height } = this.cameras.main;

    // 1. 문 영역 (yellow_key 사용 / inside로 들어가기)
    this.doorArea = createClickArea(this,
      width * 0.56,   // TODO: 위치 조정
      height * 0.33,
      450, 50,
      () => this.tryOpenDoor(),
      0  // 디버그용
    );

    // 2. 되돌아가기 영역 (숲으로)
    this.backArea = createClickArea(this,
      width * 0.5,
      height * 1,
      210, 80,
      () => this.goBack(),
      0
    );
  }

  // 문 열기 시도
  tryOpenDoor() {
    // 이미 문이 열려있으면 안으로 들어가기
    if (this.sceneState.doorUnlocked) {
      this.fadeToScene('CabinInsideScene');
      return;
    }

    // yellow_key 아이템 사용 체크
    if (!this.checkSelectedItem('yellow_key')) {
      const hints = [
        '잠겨있어...',
        '들어갈 수 없어...',
        '열쇠가 필요해 보여...'
      ];
      this.showRotatingHint('door', hints);
      return;
    }

    // yellow_key 사용
    this.sceneState.doorUnlocked = true;
    this.saveState();

    // yellow_key 아이템 제거
    this.removeItem('yellow_key');

    // 배경 즉시 변경
    const { width, height } = this.cameras.main;
    this.background.setTexture('cabin_outside_open_door');
    this.background.setDisplaySize(width, height);
  }

  // 숲으로 돌아가기
  goBack() {
    this.fadeToScene('ForestScene');
  }

  // ========== 유틸리티 메서드 ==========
  saveState() {
    window.cabinOutsideSceneState = this.sceneState;
  }

  checkSelectedItem(itemId) {
    return window.gameSelectedItem === itemId;
  }

  removeItem(itemId) {
    window.dispatchEvent(new CustomEvent('removeItem', { detail: { id: itemId } }));
  }

  showHintDialog(message) {
    window.dispatchEvent(new CustomEvent('showHintDialog', { detail: { message } }));
  }

  // 순환 힌트 메시지 표시
  showRotatingHint(key, hints) {
    const currentIndex = this.hintIndex[key] || 0;
    const message = hints[currentIndex];

    // 다음 인덱스로 업데이트 (순환)
    this.hintIndex[key] = (currentIndex + 1) % hints.length;
    window.cabinOutsideHintIndex = this.hintIndex;

    this.showHintDialog(message);
  }

  disableAllAreas() {
    const areas = [this.doorArea, this.backArea];
    areas.forEach(area => {
      if (area) area.disableInteractive();
    });
  }

  enableAllAreas() {
    const areas = [this.doorArea, this.backArea];
    areas.forEach(area => {
      if (area) area.setInteractive({ useHandCursor: true });
    });
  }

  shutdown() {
    window.removeEventListener('dialogClick', this.handleDialogClick);
  }
}
