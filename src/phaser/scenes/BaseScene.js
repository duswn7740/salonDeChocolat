// src/phaser/scenes/BaseScene.js
import Phaser from 'phaser';

/**
 * 모든 게임 씬의 기본 클래스
 * - 자동 페이드 인/아웃 효과
 * - 공통 유틸리티 메서드 제공
 */
export default class BaseScene extends Phaser.Scene {
  constructor(config) {
    super(config);
    this.fadeDuration = 300; // 페이드 시간 (ms)
  }

  // create() 후 자동으로 페이드 인
  create() {
    // 검은 화면에서 시작해서 페이드 인
    this.cameras.main.fadeIn(this.fadeDuration, 0, 0, 0);
  }

  /**
   * 페이드 아웃 후 다음 씬으로 이동
   * @param {string} sceneKey - 이동할 씬의 키
   * @param {object} data - 다음 씬에 전달할 데이터 (선택)
   */
  fadeToScene(sceneKey, data = {}) {
    // 이미 페이드 중이면 무시 (중복 클릭 방지)
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    // 페이드 아웃
    this.cameras.main.fadeOut(this.fadeDuration, 0, 0, 0);

    // 페이드 아웃 완료 후 씬 전환
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(sceneKey, data);
    });
  }

  /**
   * 페이드 시간 설정
   * @param {number} duration - 페이드 시간 (ms)
   */
  setFadeDuration(duration) {
    this.fadeDuration = duration;
  }
}
