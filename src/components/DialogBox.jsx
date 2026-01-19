import { useState, useEffect, useRef } from 'react';
import styles from './DialogBox.module.css';

function DialogBox() {
  const [dialog, setDialog] = useState({
    visible: false,
    message: '',
    isHint: false  // 힌트 다이얼로그 여부
  });
  const timerRef = useRef(null);

  // Phaser에서 오는 이벤트 리스닝
  useEffect(() => {
    // 일반 다이얼로그
    const handleShowDialog = (event) => {
      const { message } = event.detail;
      // 기존 타이머 정리
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setDialog({ message, visible: true, isHint: false });
    };

    // 힌트 다이얼로그 (2초 후 자동 닫힘)
    const handleShowHintDialog = (event) => {
      const { message } = event.detail;
      // 기존 타이머 정리
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setDialog({ message, visible: true, isHint: true });

      // 2초 후 자동 닫힘
      timerRef.current = setTimeout(() => {
        setDialog({ message: '', visible: false, isHint: false });
        timerRef.current = null;
      }, 2000);
    };

    const handleHideDialog = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setDialog({ message: '', visible: false, isHint: false });
    };

    window.addEventListener('showDialog', handleShowDialog);
    window.addEventListener('showHintDialog', handleShowHintDialog);
    window.addEventListener('hideDialog', handleHideDialog);

    return () => {
      window.removeEventListener('showDialog', handleShowDialog);
      window.removeEventListener('showHintDialog', handleShowHintDialog);
      window.removeEventListener('hideDialog', handleHideDialog);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // 클릭 시 phaser에 알림 (힌트가 아닐 때만)
  const handleClick = () => {
    if (!dialog.isHint) {
      window.dispatchEvent(new CustomEvent('dialogClick'));
    }
  };

  if (!dialog.visible) return null;

  return (
    <div className={styles.dialogOverlay} onClick={handleClick}>
      <div className={styles.dialogBox}>
        <p className={styles.message}>{dialog.message}</p>
      </div>
    </div>
  );
}

export default DialogBox;