import './App.css';
import GameCanvas from './components/GameCanvas';
import Inventory from './components/Inventory';
import DialogBox from './components/DialogBox';
import OptionPanel from './components/OptionPanel';

function App() {
  return (
    <div className="container">

      <div className="game-wrapper">
        {/* 대화창 영역 */}
        <DialogBox />

        {/* 게임 캔버스 영역 */}
        <GameCanvas />

        {/* 옵션 패널 (톱니바퀴 버튼) */}
        <OptionPanel />
      </div>

      {/* 인벤토리 영역 */}
      <Inventory />
    </div>
  );
}

export default App;