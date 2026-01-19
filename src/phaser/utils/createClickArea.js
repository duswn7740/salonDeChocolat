// src/phaser/utils/createClickArea.js

/**
 * 클릭 가능한 영역 생성 헬퍼 함수
 * @param {Phaser.Scene} scene - Phaser 씬 인스턴스
 * @param {number} x - x 좌표
 * @param {number} y - y 좌표
 * @param {number} w - 너비
 * @param {number} h - 높이
 * @param {Function} callback - 클릭 시 실행할 콜백
 * @param {number} alpha - 투명도 (0=투명, 0.5=반투명, 1=불투명) - 기본값 0
 * @param {number} color - 색상 (0xff0000=빨강, 0x00ff00=초록 등) - 기본값 빨강
 * @returns {Phaser.GameObjects.Rectangle}
 *
 * 색상 참고:
 * 0xff0000 - 빨강
 * 0x00ff00 - 초록
 * 0x0000ff - 파랑
 * 0xffff00 - 노랑
 * 0xff00ff - 보라
 * 0x00ffff - 청록
 * 0xffa500 - 주황
 */
export function createClickArea(scene, x, y, w, h, callback, alpha = 0, color = 0xff0000) {
  const area = scene.add.rectangle(x, y, w, h, color, alpha);
  area.setInteractive({ useHandCursor: true });
  area.on('pointerdown', callback);
  return area;
}
