import { useRef, useState, useEffect } from 'react';
import styles from './Inventory.module.css';

function Inventory() {
  const scrollRef = useRef(null);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  // Phaser에서 오는 아이템 이벤트 리스닝
  useEffect(() => {
    // 아이템 추가
    const handleAddItem = (event) => {
      const { id, name, image } = event.detail;
      setItems(prev => [...prev, { id, name, image }]);
    };

    // 아이템 제거
    const handleRemoveItem = (event) => {
      const { id } = event.detail;
      setItems(prev => prev.filter(item => item.id !== id));
      // 선택된 아이템이 제거되면 선택 해제
      if (selectedItem === id) {
        setSelectedItem(null);
      }
    };

    window.addEventListener('addItem', handleAddItem);
    window.addEventListener('removeItem', handleRemoveItem);

    return () => {
      window.removeEventListener('addItem', handleAddItem);
      window.removeEventListener('removeItem', handleRemoveItem);
    };
  }, [selectedItem]);

  // 왼쪽 화살표 클릭
  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -130, behavior: 'smooth' });
    }
  };

  // 오른쪽 화살표 클릭
  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 130, behavior: 'smooth' });
    }
  };

  // 아이템 클릭 (선택/해제)
  const handleItemClick = (itemId) => {
    if (selectedItem === itemId) {
      // 이미 선택된 아이템이면 해제
      setSelectedItem(null);
      window.dispatchEvent(new CustomEvent('itemDeselected', {
        detail: { id: itemId }
      }));
    } else {
      // 새 아이템 선택
      setSelectedItem(itemId);
      window.dispatchEvent(new CustomEvent('itemSelected', {
        detail: { id: itemId }
      }));
    }
  };

  // 최소 4개의 슬롯 보장 (360px 모바일 기준)
  const MIN_SLOTS = 8;
  const emptySlotCount = Math.max(0, MIN_SLOTS - items.length);

  return (
    <div className={styles.inventory}>
      {/* 왼쪽 화살표 */}
      <button className={styles.arrowLeft} onClick={scrollLeft}>
        ◀
      </button>

      {/* 아이템 영역 */}
      <div className={styles.inventoryItems} ref={scrollRef}>
        {/* 아이템 슬롯 */}
        {items.map((item) => (
          <div
            key={item.id}
            className={`${styles.item} ${selectedItem === item.id ? styles.selected : ''}`}
            onClick={() => handleItemClick(item.id)}
          >
            {item.image ? (
              <img src={item.image} alt={item.name} className={styles.itemImage} />
            ) : (
              <span>{item.name}</span>
            )}
          </div>
        ))}
        {/* 빈 슬롯 (최소 5개 보장) */}
        {Array.from({ length: emptySlotCount }).map((_, index) => (
          <div key={`empty-${index}`} className={styles.emptySlot} />
        ))}
      </div>

      {/* 오른쪽 화살표 */}
      <button className={styles.arrowRight} onClick={scrollRight}>
        ▶
      </button>
    </div>
  );
}

export default Inventory;