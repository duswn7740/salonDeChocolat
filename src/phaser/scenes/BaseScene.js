// src/phaser/scenes/BaseScene.js
import Phaser from 'phaser';

/**
 * 모든 게임 씬의 기본 클래스
 * - 자동 페이드 인/아웃 효과
 * - 공통 유틸리티 메서드 제공
 * - 배경음악 및 효과음 관리
 */
export default class BaseScene extends Phaser.Scene {
  constructor(config) {
    super(config);
    this.fadeDuration = 300; // 페이드 시간 (ms)
  }

  // create() 후 자동으로 페이드 인
  create() {
    // 씬 재진입 시 전환 플래그 초기화
    this.isTransitioning = false;

    // 검은 화면에서 시작해서 페이드 인
    this.cameras.main.fadeIn(this.fadeDuration, 0, 0, 0);

    // 배경음악 시작 (이미 재생 중이면 무시)
    this.startBGM();
  }

  /**
   * 배경음악 시작 (전역 관리)
   */
  startBGM() {
    // 이미 재생 중인 BGM이 있으면 무시
    if (this.game.registry.get('bgmPlaying')) return;

    // BGM 재생
    if (this.sound.get('bgm')) {
      // 이미 로드된 사운드가 있으면 재사용
      const bgm = this.sound.get('bgm');
      if (!bgm.isPlaying) {
        bgm.play();
      }
    } else {
      // 새로 생성
      const bgm = this.sound.add('bgm', {
        volume: 0.3,
        loop: true
      });
      bgm.play();
    }
    this.game.registry.set('bgmPlaying', true);
  }

  /**
   * 정답 효과음 재생
   */
  playRightSound() {
    this.sound.play('right', { volume: 0.5 });
  }

  /**
   * 오답 효과음 재생
   */
  playWrongSound() {
    this.sound.play('wrong', { volume: 0.5 });
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
