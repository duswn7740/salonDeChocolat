// src/phaser/scenes/BootScene.js
import Phaser from 'phaser';

/**
 * 게임 시작 시 모든 에셋을 미리 로드하는 씬
 * 로딩 완료 후 TitleScene으로 이동
 */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const { width, height } = this.cameras.main;

    // 로딩 배경
    this.add.rectangle(width / 2, height / 2, width, height, 0x8b4513);

    // 로딩 텍스트
    const loadingText = this.add.text(width / 2, height / 2 - 50, '로딩 중...', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    // 로딩 바 배경
    const barBg = this.add.rectangle(width / 2, height / 2 + 20, 400, 30, 0x3d2314);

    // 로딩 바
    const barFill = this.add.rectangle(width / 2 - 195, height / 2 + 20, 0, 24, 0xffcc00);
    barFill.setOrigin(0, 0.5);

    // 퍼센트 텍스트
    const percentText = this.add.text(width / 2, height / 2 + 70, '0%', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    // 로딩 진행률 업데이트
    this.load.on('progress', (value) => {
      barFill.width = 390 * value;
      percentText.setText(`${Math.floor(value * 100)}%`);
    });

    // 로딩 완료
    this.load.on('complete', () => {
      loadingText.setText('완료!');
    });

    // ========== 모든 이미지 프리로드 ==========

    // 배경 이미지
    this.load.image('game_title', 'assets/images/backgrounds/game_title.png');
    this.load.image('salon', 'assets/images/backgrounds/salon.png');
    this.load.image('salon_give_chocolate', 'assets/images/backgrounds/salon_give_chocolate.png');
    this.load.image('path', 'assets/images/backgrounds/path.png');
    this.load.image('path_get_woodstick', 'assets/images/backgrounds/path_get_woodstick.png');
    this.load.image('barn', 'assets/images/backgrounds/barn.png');
    this.load.image('barn_give_straw', 'assets/images/backgrounds/barn_give_straw.png');
    this.load.image('forest', 'assets/images/backgrounds/forest.png');
    this.load.image('forest_get_axe', 'assets/images/backgrounds/forest_get_axe.png');
    this.load.image('cabin_outside', 'assets/images/backgrounds/cabin_outside.png');
    this.load.image('cabin_outside_open_door', 'assets/images/backgrounds/cabin_outside_open_door.png');

    // 팝업 이미지
    this.load.image('signpost_before', 'assets/images/popup/signpost_before.png');
    this.load.image('signpost_after', 'assets/images/popup/signpost_after.png');
    this.load.image('stump_before', 'assets/images/popup/stump_before.png');
    this.load.image('stump_after', 'assets/images/popup/stump_after.png');
    this.load.image('rock_before', 'assets/images/popup/rock_before.png');
    this.load.image('rock_after', 'assets/images/popup/rock_after.png');
    this.load.image('bush_before', 'assets/images/popup/bush_before.png');
    this.load.image('bush_after', 'assets/images/popup/bush_after.png');
    this.load.image('elfdoor', 'assets/images/popup/elfdoor.png');
    this.load.image('birdhouse_before', 'assets/images/popup/birdhouse_before.png');
    this.load.image('birdhouse_after', 'assets/images/popup/birdhouse_after.png');

    // Barn 팝업 이미지
    this.load.image('cow_before', 'assets/images/popup/cow_before.png');
    this.load.image('cow_get_straw', 'assets/images/popup/cow_get_straw.png');
    this.load.image('cow_after', 'assets/images/popup/cow_after.png');
    this.load.image('meal_before', 'assets/images/popup/meal_before.png');
    this.load.image('meal_with_rake', 'assets/images/popup/meal_with_rake.png');
    this.load.image('meal_get_blue_key_first', 'assets/images/popup/meal_get_blue_key_first.png');
    this.load.image('meal_get_tweezers_first', 'assets/images/popup/meal_get_tweezers_first.png');
    this.load.image('meal_after', 'assets/images/popup/meal_after.png');
    this.load.image('wheat_straw_before', 'assets/images/popup/wheat_straw_before.png');
    this.load.image('wheat_straw_after', 'assets/images/popup/wheat_straw_after.png');

    // 아이템 이미지
    this.load.image('coin', 'assets/images/items/coin.png');
    this.load.image('paper1', 'assets/images/items/paper1.png');
    this.load.image('strong_woodstick', 'assets/images/items/strong_woodstick.png');
    this.load.image('yellow_key', 'assets/images/items/yellow_key.png');
    this.load.image('cherrybonbon', 'assets/images/items/cherrybonbon.png');
    this.load.image('axe', 'assets/images/items/axe.png');
    this.load.image('pendant', 'assets/images/items/pendant.png');
    this.load.image('rake', 'assets/images/items/rake.png');
    this.load.image('straw', 'assets/images/items/straw.png');
    this.load.image('gear', 'assets/images/items/gear.png');
    this.load.image('blue_key', 'assets/images/items/blue_key.png');
    this.load.image('tweezers', 'assets/images/items/tweezers.png');
  }

  create() {
    // 잠시 후 TitleScene으로 이동 (로딩 완료 표시를 잠깐 보여주기 위해)
    this.time.delayedCall(500, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('CabinOutsideScene');  // 테스트용 (원래: 'TitleScene')
      });
    });
  }
}
