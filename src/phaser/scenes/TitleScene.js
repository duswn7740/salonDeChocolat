// src/phaser/scenes/TitleScene.js
import BaseScene from './BaseScene';
import { COLORS, TEXT_STYLES, BUTTON_STYLES } from '../styles/gameStyles';

export default class TitleScene extends BaseScene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  // preload는 BootScene에서 처리하므로 제거

  create() {
    // 부모 클래스의 create() 호출 (페이드 인)
    super.create();

    const { width, height } = this.cameras.main;

    // 배경 (임시 - 초콜릿 색)
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.chocolate);

    // 게임 타이틀 이미지 (화면에 맞게 조절)
    this.add.image(width / 2, height / 2, 'game_title')
      .setDisplaySize(width, height);

    // 게임 타이틀
    this.add.text(width / 2, height / 3, '달다쿠 살롱', TEXT_STYLES.title)
      .setOrigin(0.5);

    // 서브 타이틀
    this.add.text(width / 2, height / 3 + 60, '~쿠의 장난~', TEXT_STYLES.subtitle)
      .setOrigin(0.5);

    // 게임 시작 버튼
    const startButton = this.add.rectangle(
      width / 2,
      height / 2 + 100,
      BUTTON_STYLES.width,
      BUTTON_STYLES.height,
      BUTTON_STYLES.normalColor
    );

    
    const startText = this.add.text(
      width / 2,
      height / 2 + 100,
      '게임 시작',
      TEXT_STYLES.button
    ).setOrigin(0.5);

    // 오프닝 크래딧
    this.add.text(width / 2, height / 4, '만든이: 윤연주 \n 멘탈케어: 이세현 \n 배경음: 이세현 \n 효과음: 이세현 \n 그림: xx', TEXT_STYLES.ending)
      .setOrigin(0.5)

    // 버튼 인터랙티브
    startButton.setInteractive({ useHandCursor: true });

    // 호버 효과
    startButton.on('pointerover', () => {
      startButton.setFillStyle(BUTTON_STYLES.hoverColor);
      startText.setScale(1.1);
    });

    startButton.on('pointerout', () => {
      startButton.setFillStyle(BUTTON_STYLES.normalColor);
      startText.setScale(1);
    });

    // 클릭 효과 및 페이드 전환
    startButton.on('pointerdown', () => {
      startButton.setFillStyle(BUTTON_STYLES.clickColor);
      this.fadeToScene('PrologueScene');
    });
  }
}
