// src/phaser/scenes/PathScene.js
import Phaser from 'phaser';

export default class PathScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PathScene' });
  }

  preload() {
    // 배경 이미지 로드
    this.load.image('path', 'assets/images/backgrounds/path.png');
  }

  create() {
    const { width, height } = this.cameras.main;

    // 배경 표시
    this.background = this.add.image(width / 2, height / 2, 'path')
      .setOrigin(0.5)
      .setDisplaySize(width, height);

    
  }
}
