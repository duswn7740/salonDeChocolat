import { createContext, useState, useContext, useEffect } from 'react';



// Context 생성
const GameContext = createContext();

// Provider 컴포넌트
export const GameProvider = ({ children }) => {
  // 1. 인벤토리 상태
  const [inventory, setInventory] = useState([]);

  // 2. 게임 진행 상태
  const [gameState, setGameState] = useState({
    currentScene: 'PrologueScene',  // 현재 씬
    completedPuzzles: [],            // 완료한 퍼즐들
    collectedItems: []               // 획득한 아이템 ID들
  });

  // 3. Phaser에서 발생하는 아이템 획득 이벤트 리스닝
  useEffect(() => {
    const handleAddItem = (event) => {
      const item = event.detail; // { id: 'branch', name: '나뭇가지' }
      
      // 중복 체크 (같은 아이템 2번 안 들어가게)
      if (!inventory.find(i => i.id === item.id)) {
        setInventory(prev => [...prev, item]);
        setGameState(prev => ({
          ...prev,
          collectedItems: [...prev.collectedItems, item.id]
        }));
        
        console.log('✅ 아이템 획득:', item.name);
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('addItem', handleAddItem);

    // 컴포넌트 언마운트 시 정리
    return () => {
      window.removeEventListener('addItem', handleAddItem);
    };
  }, [inventory]);

  // 4. 아이템 제거 (사용 시)
  const removeItem = (itemId) => {
    setInventory(prev => prev.filter(item => item.id !== itemId));
    console.log('❌ 아이템 사용:', itemId);
  };

  // 5. 아이템 보유 확인
  const hasItem = (itemId) => {
    return inventory.some(item => item.id === itemId);
  };

  // 6. 퍼즐 완료 표시
  const completePuzzle = (puzzleId) => {
    if (!gameState.completedPuzzles.includes(puzzleId)) {
      setGameState(prev => ({
        ...prev,
        completedPuzzles: [...prev.completedPuzzles, puzzleId]
      }));
      console.log('🎉 퍼즐 완료:', puzzleId);
    }
  };

  // 7. 씬 변경
  const setCurrentScene = (sceneName) => {
    setGameState(prev => ({
      ...prev,
      currentScene: sceneName
    }));
    console.log('🎬 씬 전환:', sceneName);
  };

  // Context에 제공할 값들
  const value = {
    inventory,
    gameState,
    addItem: (item) => {
      // 직접 호출용 (주로 Phaser 이벤트가 처리하지만, 필요시 사용)
      window.dispatchEvent(new CustomEvent('addItem', { detail: item }));
    },
    removeItem,
    hasItem,
    completePuzzle,
    setCurrentScene
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

// 8. 커스텀 훅 (다른 컴포넌트에서 쉽게 사용)
export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame은 GameProvider 안에서만 사용 가능합니다!');
  }
  return context;
};