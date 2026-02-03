import { useState, useEffect } from 'react';
import styles from './OptionPanel.module.css';
import { CREDITS_FULL, TERMS_OF_SERVICE, PRIVACY_POLICY } from '../phaser/styles/gameStyles';

function OptionPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [bgmOn, setBgmOn] = useState(true);
  const [sfxOn, setSfxOn] = useState(true);
  const [subPanel, setSubPanel] = useState(null); // 'credits' | 'terms' | 'privacy'

  // 사운드 설정 초기화
  useEffect(() => {
    window.soundSettings = { bgm: true, sfx: true };
  }, []);

  // BGM 토글
  const toggleBgm = () => {
    const newValue = !bgmOn;
    setBgmOn(newValue);
    window.soundSettings.bgm = newValue;

    // Phaser에 이벤트 전달
    window.dispatchEvent(new CustomEvent('bgmToggle', {
      detail: { enabled: newValue }
    }));
  };

  // 효과음 토글
  const toggleSfx = () => {
    const newValue = !sfxOn;
    setSfxOn(newValue);
    window.soundSettings.sfx = newValue;
  };

  // 옵션 패널 열기/닫기
  const togglePanel = () => {
    setIsOpen(!isOpen);
    setSubPanel(null); // 서브 패널 닫기
  };

  // 서브 패널 열기
  const openSubPanel = (type) => {
    setSubPanel(type);
  };

  // 서브 패널 닫기
  const closeSubPanel = () => {
    setSubPanel(null);
  };

  return (
    <>
      {/* 톱니바퀴 버튼 */}
      <button className={styles.gearButton} onClick={togglePanel}>
        ⚙️
      </button>

      {/* 옵션 패널 */}
      {isOpen && (
        <div className={styles.overlay} onClick={togglePanel}>
          <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
            {/* 헤더 */}
            <div className={styles.header}>
              <span>설정</span>
              <button className={styles.closeButton} onClick={togglePanel}>✕</button>
            </div>

            {/* 사운드 설정 */}
            <div className={styles.section}>
              <div className={styles.settingRow}>
                <span>BGM</span>
                <div className={styles.toggle} onClick={toggleBgm}>
                  <span className={!bgmOn ? styles.active : ''}>OFF</span>
                  <span className={bgmOn ? styles.active : ''}>ON</span>
                </div>
              </div>
              <div className={styles.settingRow}>
                <span>효과음</span>
                <div className={styles.toggle} onClick={toggleSfx}>
                  <span className={!sfxOn ? styles.active : ''}>OFF</span>
                  <span className={sfxOn ? styles.active : ''}>ON</span>
                </div>
              </div>
            </div>

            {/* 구분선 */}
            <div className={styles.divider}></div>

            {/* 링크 버튼들 */}
            <div className={styles.section}>
              <button className={styles.linkButton} onClick={() => openSubPanel('credits')}>
                만든 사람들
              </button>
              <button className={styles.linkButton} onClick={() => openSubPanel('terms')}>
                이용약관
              </button>
              <button className={styles.linkButton} onClick={() => openSubPanel('privacy')}>
                개인정보처리방침
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 서브 패널 (만든 사람들, 이용약관, 개인정보처리방침) */}
      {subPanel && (
        <div className={styles.overlay} onClick={closeSubPanel}>
          <div className={styles.subPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
              <span>
                {subPanel === 'credits' && '만든 사람들'}
                {subPanel === 'terms' && '이용약관'}
                {subPanel === 'privacy' && '개인정보처리방침'}
              </span>
              <button className={styles.closeButton} onClick={closeSubPanel}>✕</button>
            </div>
            <div className={styles.scrollContent}>
              {subPanel === 'credits' && <pre>{CREDITS_FULL}</pre>}
              {subPanel === 'terms' && <pre>{TERMS_OF_SERVICE}</pre>}
              {subPanel === 'privacy' && <pre>{PRIVACY_POLICY}</pre>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default OptionPanel;
