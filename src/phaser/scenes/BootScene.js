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
    this.load.image('riverside', 'assets/images/backgrounds/riverside.png');
    this.load.image('riverside_open', 'assets/images/backgrounds/riverside_open.png');
    this.load.image('cave', 'assets/images/backgrounds/cave.png');
    this.load.image('cave_with_light', 'assets/images/backgrounds/cave_with_light.png');

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

    // Cabin Inside 배경 및 팝업 이미지
    this.load.image('cabin_inside', 'assets/images/backgrounds/cabin_inside.png');
    this.load.image('kitchen', 'assets/images/backgrounds/kitchen.png');

    // Kitchen 팝업 이미지
    this.load.image('sideboard_before', 'assets/images/popup/sideboard_before.png');
    this.load.image('sideboard_after', 'assets/images/popup/sideboard_after.png');
    this.load.image('fridge_locked', 'assets/images/popup/fridge_locked.png');
    this.load.image('fridge_fresh_cream', 'assets/images/popup/fridge_fresh_cream.png');
    this.load.image('fridge_opened', 'assets/images/popup/fridge_opened.png');
    this.load.image('table_before', 'assets/images/popup/table_before.png');
    this.load.image('table_after', 'assets/images/popup/table_after.png');
    this.load.image('worktable', 'assets/images/popup/worktable.png');
    this.load.image('worktable_with_recipe', 'assets/images/popup/worktable_with_recipe.png');

    // Kitchen 저울 퍼즐 이미지
    this.load.image('scale_balanced', 'assets/images/popup/scale_balanced.png');
    this.load.image('scale_left', 'assets/images/popup/scale_left.png');
    this.load.image('scale_right', 'assets/images/popup/scale_right.png');
    this.load.image('weight_3g_overlay', 'assets/images/popup/weight_3g_overlay.png');
    this.load.image('weight_5g_overlay', 'assets/images/popup/weight_5g_overlay.png');
    this.load.image('weight_6g_overlay', 'assets/images/popup/weight_6g_overlay.png');
    this.load.image('weight_8g_overlay', 'assets/images/popup/weight_8g_overlay.png');
    this.load.image('chocolate_on_scale', 'assets/images/popup/chocolate_on_scale.png');

    // Kitchen 비커 퍼즐 이미지 (overlay 방식)
    this.load.image('beaker_puzzle', 'assets/images/popup/beaker_puzzle.png');
    this.load.image('fresh_cream_overlay', 'assets/images/popup/fresh_cream_overlay.png');
    // 5ml 비커 overlay (0~5)
    this.load.image('beaker_5ml_0', 'assets/images/popup/beaker_5ml_0.png');
    this.load.image('beaker_5ml_1', 'assets/images/popup/beaker_5ml_1.png');
    this.load.image('beaker_5ml_2', 'assets/images/popup/beaker_5ml_2.png');
    this.load.image('beaker_5ml_3', 'assets/images/popup/beaker_5ml_3.png');
    this.load.image('beaker_5ml_4', 'assets/images/popup/beaker_5ml_4.png');
    this.load.image('beaker_5ml_5', 'assets/images/popup/beaker_5ml_5.png');
    // 7ml 비커 overlay (0~7)
    this.load.image('beaker_7ml_0', 'assets/images/popup/beaker_7ml_0.png');
    this.load.image('beaker_7ml_1', 'assets/images/popup/beaker_7ml_1.png');
    this.load.image('beaker_7ml_2', 'assets/images/popup/beaker_7ml_2.png');
    this.load.image('beaker_7ml_3', 'assets/images/popup/beaker_7ml_3.png');
    this.load.image('beaker_7ml_4', 'assets/images/popup/beaker_7ml_4.png');
    this.load.image('beaker_7ml_5', 'assets/images/popup/beaker_7ml_5.png');
    this.load.image('beaker_7ml_6', 'assets/images/popup/beaker_7ml_6.png');
    this.load.image('beaker_7ml_7', 'assets/images/popup/beaker_7ml_7.png');
    // 12ml 비커 overlay (0~12)
    this.load.image('beaker_12ml_0', 'assets/images/popup/beaker_12ml_0.png');
    this.load.image('beaker_12ml_1', 'assets/images/popup/beaker_12ml_1.png');
    this.load.image('beaker_12ml_2', 'assets/images/popup/beaker_12ml_2.png');
    this.load.image('beaker_12ml_3', 'assets/images/popup/beaker_12ml_3.png');
    this.load.image('beaker_12ml_4', 'assets/images/popup/beaker_12ml_4.png');
    this.load.image('beaker_12ml_5', 'assets/images/popup/beaker_12ml_5.png');
    this.load.image('beaker_12ml_6', 'assets/images/popup/beaker_12ml_6.png');
    this.load.image('beaker_12ml_7', 'assets/images/popup/beaker_12ml_7.png');
    this.load.image('beaker_12ml_8', 'assets/images/popup/beaker_12ml_8.png');
    this.load.image('beaker_12ml_9', 'assets/images/popup/beaker_12ml_9.png');
    this.load.image('beaker_12ml_10', 'assets/images/popup/beaker_12ml_10.png');
    this.load.image('beaker_12ml_11', 'assets/images/popup/beaker_12ml_11.png');
    this.load.image('beaker_12ml_12', 'assets/images/popup/beaker_12ml_12.png');

    // Kitchen 오버레이 이미지
    this.load.image('ox_o', 'assets/images/popup/ox_o.png');
    this.load.image('ox_x', 'assets/images/popup/ox_x.png');
    this.load.image('book_overlay', 'assets/images/popup/book_overlay.png');

    // Cabin Inside 팝업 이미지
    this.load.image('drawer_all_closed', 'assets/images/popup/drawer_all_closed.png');
    this.load.image('drawer_1_open', 'assets/images/popup/drawer_1_open.png');
    this.load.image('drawer_2_open', 'assets/images/popup/drawer_2_open.png');
    this.load.image('drawer_3_open', 'assets/images/popup/drawer_3_open.png');
    this.load.image('drawer_12_open', 'assets/images/popup/drawer_12_open.png');
    this.load.image('drawer_13_open', 'assets/images/popup/drawer_13_open.png');
    this.load.image('drawer_23_open', 'assets/images/popup/drawer_23_open.png');
    this.load.image('drawer_all_opened', 'assets/images/popup/drawer_all_opened.png');
    this.load.image('bookshelf_before', 'assets/images/popup/bookshelf_before.png');
    this.load.image('bookshelf_after', 'assets/images/popup/bookshelf_after.png');

    // Riverside 팝업 이미지
    this.load.image('sluice_closed', 'assets/images/popup/sluice_closed.png');
    this.load.image('sluice_opened', 'assets/images/popup/sluice_opened.png');
    this.load.image('box_locked', 'assets/images/popup/box_locked.png');
    this.load.image('box_unlocked', 'assets/images/popup/box_unlocked.png');
    this.load.image('box_opened', 'assets/images/popup/box_opened.png');
    this.load.image('knight_visited', 'assets/images/popup/knight_visited.png');
    this.load.image('knight_movable', 'assets/images/popup/knight_movable.png');
    this.load.image('knight_piece', 'assets/images/popup/knight_piece.png');

    // Cave 팝업 이미지
    this.load.image('bonfire_before', 'assets/images/popup/bonfire_before.png');
    this.load.image('bonfire_with_firewood', 'assets/images/popup/bonfire_with_firewood.png');
    this.load.image('bonfire_after', 'assets/images/popup/bonfire_after.png');
    this.load.image('cave_desk', 'assets/images/popup/cave_desk.png');

    // 그림 퍼즐 오버레이 (paper1~4와 동일)
    this.load.image('paper1_overlay', 'assets/images/popup/paper1_overlay.png');
    this.load.image('paper2_overlay', 'assets/images/popup/paper2_overlay.png');
    this.load.image('paper3_overlay', 'assets/images/popup/paper3_overlay.png');
    this.load.image('paper4_overlay', 'assets/images/popup/paper4_overlay.png');
    this.load.image('recipe_overlay', 'assets/images/popup/recipe_overlay.png');

    // 책 오버레이 이미지 (M-O-C-H-A)
    this.load.image('book1_overlay', 'assets/images/popup/book1_overlay.png');  // M
    this.load.image('book2_overlay', 'assets/images/popup/book2_overlay.png');  // O
    this.load.image('book3_overlay', 'assets/images/popup/book3_overlay.png');  // C
    this.load.image('book4_overlay', 'assets/images/popup/book4_overlay.png');  // H
    this.load.image('book5_overlay', 'assets/images/popup/book5_overlay.png');  // A

    // 서랍 오버레이 아이템 이미지 (서랍 위에 표시)
    this.load.image('weight_overlay', 'assets/images/popup/weight_overlay.png');
    this.load.image('chocolate_overlay', 'assets/images/popup/chocolate_overlay.png');
    this.load.image('match_overlay', 'assets/images/popup/match_overlay.png');
    this.load.image('beaker_overlay', 'assets/images/popup/beaker_overlay.png');

    // 아이템 이미지
    this.load.image('knight_piece', 'assets/images/items/knight_piece.png');
    this.load.image('paper1', 'assets/images/items/paper1.png');
    this.load.image('strong_woodstick', 'assets/images/items/strong_woodstick.png');
    this.load.image('yellow_key', 'assets/images/items/yellow_key.png');
    this.load.image('cherrybonbon', 'assets/images/items/cherrybonbon.png');
    this.load.image('axe', 'assets/images/items/axe.png');
    this.load.image('pendant', 'assets/images/items/pendant.png');
    this.load.image('rake', 'assets/images/items/rake.png');
    this.load.image('straw', 'assets/images/items/straw.png');
    this.load.image('firewood', 'assets/images/items/firewood.png');
    this.load.image('gear', 'assets/images/items/gear.png');
    this.load.image('blue_key', 'assets/images/items/blue_key.png');
    this.load.image('tweezers', 'assets/images/items/tweezers.png');
    this.load.image('weight', 'assets/images/items/weight.png');
    this.load.image('chocolate', 'assets/images/items/chocolate.png');
    this.load.image('match', 'assets/images/items/match.png');
    this.load.image('beaker', 'assets/images/items/beaker.png');
    this.load.image('book', 'assets/images/items/book.png');
    this.load.image('paper2', 'assets/images/items/paper2.png');
    this.load.image('paper3', 'assets/images/items/paper3.png');
    this.load.image('paper4', 'assets/images/items/paper4.png');
    this.load.image('fresh_cream', 'assets/images/items/fresh_cream.png');
    this.load.image('recipe', 'assets/images/items/recipe.png');
    this.load.image('measured_chocolate', 'assets/images/items/measured_chocolate.png');
    this.load.image('measured_cream', 'assets/images/items/measured_cream.png');
    this.load.image('pave_chocolate', 'assets/images/items/pave_chocolate.png');

    // ========== 사운드 프리로드 ==========
    this.load.audio('bgm', 'assets/sounds/qoo.mp3');
    this.load.audio('right', 'assets/sounds/right.mp3');
    this.load.audio('wrong', 'assets/sounds/wrong.mp3');
  }

  create() {
    // 잠시 후 TitleScene으로 이동 (로딩 완료 표시를 잠깐 보여주기 위해)
    this.time.delayedCall(500, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('TitleScene');  // 테스트용 (원래: 'TitleScene')
      });
    });
  }
}
