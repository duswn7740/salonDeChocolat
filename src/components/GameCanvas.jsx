// src/components/GameCanvas.jsx
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import config from '../phaser/config';

function GameCanvas() {
  const gameRef = useRef(null);  // HTML div 참조
  const gameInstanceRef = useRef(null);  // Phaser 게임 인스턴스 참조

  useEffect(() => {
    // Phaser 게임 인스턴스 생성
    if (!gameInstanceRef.current && gameRef.current) {
      const gameConfig = {
        ...config,  // config.js의 설정 가져오기
        parent: gameRef.current  // React div에 연결
      };
      
      gameInstanceRef.current = new Phaser.Game(gameConfig);
      console.log('🎮 Phaser 게임 시작!');
    }

    // 컴포넌트 언마운트 시 게임 정리
    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
        console.log('🎮 Phaser 게임 종료!');
      }
    };
  }, []);

  return (
    <div
      ref={gameRef}
      id="game-container"
      style={{
        width: '100%',
        maxWidth: '720px',
        aspectRatio: '720 / 900',
        margin: '0 auto',
        backgroundColor: '#000'  // 로딩 중 배경
      }}
    />
  );
}

export default GameCanvas;