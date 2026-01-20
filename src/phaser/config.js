// src/phaser/config.js
import Phaser from 'phaser';
import TitleScene from './scenes/TitleScene';
import PrologueScene from './scenes/PrologueScene';
import PopupScene from './scenes/PopupScene';
import PathScene from './scenes/PathScene';



const config = {
  type: Phaser.AUTO,  // WebGL 또는 Canvas 자동 선택
  width: 720,         // 게임 캔버스 가로
  height: 900,        // 게임 캔버스 세로
  backgroundColor: '#2d2d2d',  // 임시 배경색 (나중에 이미지로 교체)
  pixelArt: false,    // 픽셀 아트 게임이면 true (우리는 false)
  
  // 물리 엔진 (필요하면 사용, 지금은 꺼둠)
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },  // 중력 없음 (포인트 앤 클릭이니까)
      debug: false         // 개발 중엔 true로 하면 충돌 영역 보임
    }
  },
  
  // 씬 목록 (순서대로 실행, 첫 번째가 시작 씬)
  scene: [
    TitleScene,
    PrologueScene,
    PathScene,
    PopupScene,
    // BarnScene,
    // ForestScene,
    // CabinScene,
    // RiversideScene,
    // EndingScene
  ],

  // 모바일 대응
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_HORIZONTALLY
  }
};

export default config;