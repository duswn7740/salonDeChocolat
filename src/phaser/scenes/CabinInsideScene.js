// src/phaser/scenes/CabinInsideScene.js
import BaseScene from './BaseScene';
import { createClickArea } from '../utils/createClickArea';

export default class CabinInsideScene extends BaseScene {
  constructor() {
    super({ key: 'CabinInsideScene' });
  }

  init() {
    // 상태 초기화
    this.activeArea = null;

    // 힌트 메시지 인덱스 (순환용)
    this.hintIndex = window.cabinInsideHintIndex || {
      drawer: 0
    };

    // 상태 (씬 재방문 시에도 유지)
    this.sceneState = window.cabinInsideSceneState || {
      // 서랍 상태
      drawer1Unlocked: false, // 윗칸 잠금 해제 여부 (blue_key 사용)
      drawer1Open: false,  // 윗칸 열림 상태
      drawer2Open: false,  // 중간칸
      drawer3Open: false,  // 아랫칸
      // 서랍 아이템 획득 상태
      weight: false,       // 무게추 (1번 서랍)
      chocolate: false,    // 초콜릿 (1번 서랍)
      match: false,        // 성냥 (2번 서랍)
      beaker: false,       // 비커 (2번 서랍)
      // 책장 퍼즐 상태
      bookAdded: false,    // book 아이템으로 book4 추가했는지
      bookPuzzleSolved: false,  // 퍼즐 완료 여부
      paper2: false        // paper2 획득 여부
    };

    // 책장 퍼즐 상태 (현재 책 배열)
    // 정답: [1, 2, 3, 4, 5] (M-O-C-H-A)
    // 초기 상태: book4 없이 [3, 1, 5, 2] -> book4 추가 후 [3, 1, 5, 2, 4]
    this.bookOrder = window.cabinInsideBookOrder ||
      (this.sceneState.bookAdded ? [3, 1, 5, 2, 4] : [3, 1, 5, 2]);

    // 퍼즐용 선택된 책 인덱스
    this.selectedBookIndex = null;
  }

  create() {
    super.create();

    const { width, height } = this.cameras.main;

    // 배경 표시
    this.background = this.add.image(width / 2, height / 2, 'cabin_inside')
      .setOrigin(0.5)
      .setDisplaySize(width, height);

    // 터치 가능한 영역들 생성
    this.createInteractiveAreas();

    // DialogBox 이벤트 리스닝
    this.handleDialogClick = () => {};
    window.addEventListener('dialogClick', this.handleDialogClick);
  }

  createInteractiveAreas() {
    const { width, height } = this.cameras.main;

    // 1. 서랍 영역
    this.drawerArea = createClickArea(this,
      width * 0.22,    // TODO: 위치 조정
      height * 0.33,
      200, 60,
      () => this.showDrawerPopup(),
      0  // 디버그용
    );

    // 2. 책장 영역
    this.bookshelfArea = createClickArea(this,
      width * 0.22,    // TODO: 위치 조정
      height * 0.45,
      200, 60,
      () => this.showBookshelfPopup(),
      0  // 디버그용
    );

    // 3. 부엌으로 이동
    this.kitchenArea = createClickArea(this,
      width * 0.3,   // TODO: 위치 조정
      height * 0.59,
      250, 60,
      () => this.goToKitchen(),
      0, 0x00ff00  // 디버그용
    );

    // 4. 되돌아가기 영역 (외부로)
    this.backArea = createClickArea(this,
      width * 0.5,
      height * 1,
      210, 80,
      () => this.goBack(),
      0
    );
  }

  // ========== 서랍 팝업 ==========
  showDrawerPopup() {
    const { width, height } = this.cameras.main;
    this.activeArea = 'drawer';
    this.disableAllAreas();

    // 현재 서랍 상태에 따른 이미지 결정
    const popupImage = this.getDrawerImageKey();

    // 클릭 영역 설정
    const clickAreas = this.getDrawerClickAreas();

    // 오버레이 아이템 이미지 설정
    const overlayItems = this.getDrawerOverlayItems();

    this.scene.launch('PopupScene', {
      popupImage,
      popupSize: { width: 500, height: 500 },
      clickAreas,
      overlayItems,  // 아이템 오버레이 추가
      onClose: () => {
        this.enableAllAreas();
        this.activeArea = null;
      }
    });
  }

  // 서랍 위에 표시할 아이템 오버레이
  getDrawerOverlayItems() {
    const { width, height } = this.cameras.main;
    const items = [];

    // 1번 서랍이 열려있을 때 아이템 표시
    if (this.sceneState.drawer1Open) {
      if (!this.sceneState.weight) {
        items.push({
          key: 'weight_overlay',
          x: width / 2.5,     // TODO: 무게추 위치 조정
          y: height / 2.5
        });
      }
      if (!this.sceneState.chocolate) {
        items.push({
          key: 'chocolate_overlay',
          x: width / 1.7,     // TODO: 초콜릿 위치 조정
          y: height / 2.5
        });
      }
    }

    // 2번 서랍이 열려있을 때 아이템 표시
    if (this.sceneState.drawer2Open) {
      if (!this.sceneState.match) {
        items.push({
          key: 'match_overlay',
          x: width / 2.5,     // TODO: 성냥 위치 조정
          y: height / 2
        });
      }
      if (!this.sceneState.beaker) {
        items.push({
          key: 'beaker_overlay',
          x: width / 1.7,     // TODO: 비커 위치 조정
          y: height / 2
        });
      }
    }

    return items;
  }

  // 서랍 상태에 따른 이미지 키 반환
  getDrawerImageKey() {
    const { drawer1Open, drawer2Open, drawer3Open } = this.sceneState;

    if (drawer1Open && drawer2Open && drawer3Open) {
      return 'drawer_all_opened';
    } else if (drawer1Open && drawer2Open) {
      return 'drawer_12_open';
    } else if (drawer1Open && drawer3Open) {
      return 'drawer_13_open';
    } else if (drawer2Open && drawer3Open) {
      return 'drawer_23_open';
    } else if (drawer1Open) {
      return 'drawer_1_open';
    } else if (drawer2Open) {
      return 'drawer_2_open';
    } else if (drawer3Open) {
      return 'drawer_3_open';
    } else {
      return 'drawer_all_closed';
    }
  }

  // 서랍 클릭 영역 생성
  getDrawerClickAreas() {
    const { width, height } = this.cameras.main;
    const clickAreas = [];

    // 1번 서랍 (윗칸) - 토글 방식 + 아이템 클릭
    // 서랍 자체 클릭 영역 (열기/닫기 토글)
    clickAreas.push({
      x: width / 2,       // TODO: 위치 조정
      y: height / 2.3,
      width: 300,
      height: 80,
      debugAlpha: 0,
      callback: () => this.toggleDrawer1()
    });

    // 1번 서랍이 열려있으면 아이템 클릭 영역 추가
    if (this.sceneState.drawer1Open) {
      if (!this.sceneState.weight) {
        clickAreas.push({
          x: width / 2.5,     // TODO: 무게추 위치 조정
          y: height / 2.4,    // 서랍보다 살짝 위
          width: 150,
          height: 150,
          debugAlpha: 0,
          callback: (popupScene) => this.collectDrawerItem(popupScene, 'weight')
        });
      }
      if (!this.sceneState.chocolate) {
        clickAreas.push({
          x: width / 1.7,     // TODO: 초콜릿 위치 조정
          y: height / 2.6,
          width: 150,
          height: 150,
          debugAlpha: 0,
          callback: (popupScene) => this.collectDrawerItem(popupScene, 'chocolate')
        });
      }
    }

    // 2번 서랍 (중간칸) - 토글 방식 + 아이템 클릭
    clickAreas.push({
      x: width / 2,       // TODO: 위치 조정
      y: height / 2,
      width: 300,
      height: 80,
      debugAlpha: 0,
      callback: (popupScene) => this.toggleDrawer(popupScene, 2)
    });

    // 2번 서랍이 열려있으면 아이템 클릭 영역 추가
    if (this.sceneState.drawer2Open) {
      if (!this.sceneState.match) {
        clickAreas.push({
          x: width / 2.5,     // TODO: 성냥 위치 조정
          y: height / 1.85,
          width: 100,
          height: 100,
          debugAlpha: 0,
          callback: (popupScene) => this.collectDrawerItem(popupScene, 'match')
        });
      }
      if (!this.sceneState.beaker) {
        clickAreas.push({
          x: width / 1.7,     // TODO: 비커 위치 조정
          y: height / 2.1,
          width: 100,
          height: 100,
          debugAlpha: 0,
          callback: (popupScene) => this.collectDrawerItem(popupScene, 'beaker')
        });
      }
    }

    // 3번 서랍 (아랫칸) - 토글 방식, 아이템 없음
    clickAreas.push({
      x: width / 2,       // TODO: 위치 조정
      y: height / 1.6,
      width: 300,
      height: 80,
      debugAlpha: 0,
      callback: (popupScene) => this.toggleDrawer(popupScene, 3)
    });

    return clickAreas;
  }

  // 1번 서랍 토글 (blue_key 필요 - 처음 열 때만)
  toggleDrawer1() {
    // 이미 열려있으면 닫기
    if (this.sceneState.drawer1Open) {
      this.sceneState.drawer1Open = false;
      this.saveState();
      this.scene.stop('PopupScene');
      this.showDrawerPopup();
      return;
    }

    // 처음 열 때 blue_key 필요 (한번 열면 그 다음부터는 자유롭게 열림)
    // drawer1Unlocked로 잠금 해제 상태 추적
    if (!this.sceneState.drawer1Unlocked) {
      if (!this.checkSelectedItem('blue_key')) {
        const hints = [
          '잠겨있어...',
          '열쇠가 필요해 보여...',
          '뭔가로 열 수 있을 것 같아...'
        ];
        this.showRotatingHint('drawer', hints);
        return;
      }

      // blue_key 사용하여 잠금 해제
      this.sceneState.drawer1Unlocked = true;
      this.removeItem('blue_key');
    }

    // 서랍 열기
    this.sceneState.drawer1Open = true;
    this.saveState();

    this.scene.stop('PopupScene');
    this.showDrawerPopup();
  }

  // 2, 3번 서랍 토글
  toggleDrawer(popupScene, drawerNum) {
    if (drawerNum === 2) {
      this.sceneState.drawer2Open = !this.sceneState.drawer2Open;
    } else if (drawerNum === 3) {
      this.sceneState.drawer3Open = !this.sceneState.drawer3Open;
    }
    this.saveState();

    // 팝업 닫고 다시 열기
    this.scene.stop('PopupScene');
    this.showDrawerPopup();
  }

  // 서랍 아이템 획득
  collectDrawerItem(popupScene, itemType) {
    this.sceneState[itemType] = true;
    this.saveState();

    const itemInfo = {
      weight: { id: 'weight', name: '무게추', image: 'assets/images/items/weight.png' },
      chocolate: { id: 'chocolate', name: '초콜릿', image: 'assets/images/items/chocolate.png' },
      match: { id: 'match', name: '성냥', image: 'assets/images/items/match.png' },
      beaker: { id: 'beaker', name: '비커', image: 'assets/images/items/beaker.png' }
    };

    this.addItem(itemInfo[itemType]);

    // 팝업 갱신
    this.scene.stop('PopupScene');
    this.showDrawerPopup();
  }

  // ========== 책장 팝업 ==========
  showBookshelfPopup() {
    const { width, height } = this.cameras.main;
    this.activeArea = 'bookshelf';
    this.disableAllAreas();

    // paper2 획득 후 -> bookshelf_before (정렬된 책 오버레이, 클릭 영역 없음)
    if (this.sceneState.paper2) {
      this.scene.launch('PopupScene', {
        popupImage: 'bookshelf_before',
        popupSize: { width: 500, height: 500 },
        clickAreas: [],
        overlayItems: this.getBookshelfOverlayItems(true),  // 정렬된 상태
        onClose: () => {
          this.enableAllAreas();
          this.activeArea = null;
        }
      });
      return;
    }

    // 퍼즐 완료 -> bookshelf_after (paper2 클릭 가능)
    if (this.sceneState.bookPuzzleSolved) {
      this.scene.launch('PopupScene', {
        popupImage: 'bookshelf_after',
        popupSize: { width: 500, height: 500 },
        clickAreas: [{
          x: width / 2,       // TODO: paper2 위치 조정
          y: height / 1.7,
          width: 100,
          height: 100,
          debugAlpha: 0,
          callback: () => this.collectPaper2()
        }],
        overlayItems: this.getBookshelfOverlayItems(true),  // 정렬된 책 표시
        onClose: () => {
          this.enableAllAreas();
          this.activeArea = null;
        }
      });
      return;
    }

    // book4 미추가 상태 -> book 아이템 사용 필요
    if (!this.sceneState.bookAdded) {
      // book 없이 클릭 -> 힌트 또는 book 사용
      this.scene.launch('PopupScene', {
        popupImage: 'bookshelf_before',
        popupSize: { width: 500, height: 500 },
        clickAreas: [{
          x: width / 2,
          y: height / 2,
          width: 400,
          height: 300,
          debugAlpha: 0,
          callback: () => this.tryAddBook()
        }],
        overlayItems: this.getBookshelfOverlayItems(false),  // 4권만 표시
        onClose: () => {
          this.enableAllAreas();
          this.activeArea = null;
        }
      });
      return;
    }

    // 퍼즐 진행 중 -> 책 클릭하여 자리바꾸기
    this.scene.launch('PopupScene', {
      popupImage: 'bookshelf_before',
      popupSize: { width: 500, height: 500 },
      clickAreas: this.getBookClickAreas(),
      overlayItems: this.getBookshelfOverlayItems(false),
      onClose: () => {
        this.enableAllAreas();
        this.activeArea = null;
        this.selectedBookIndex = null;  // 선택 해제
      }
    });
  }

  // 책장 위에 표시할 책 오버레이
  getBookshelfOverlayItems(isSolved) {
    const { width, height } = this.cameras.main;
    const items = [];

    // 책 위치 (5개 슬롯)
    const bookPositions = [
      { x: width / 2 - 120, y: height / 2 },   // 슬롯 0
      { x: width / 2 - 60, y: height / 2 },    // 슬롯 1
      { x: width / 2, y: height / 2 },          // 슬롯 2
      { x: width / 2 + 60, y: height / 2 },    // 슬롯 3
      { x: width / 2 + 120, y: height / 2 }    // 슬롯 4
    ];

    const order = isSolved ? [1, 2, 3, 4, 5] : this.bookOrder;

    order.forEach((bookNum, index) => {
      if (bookNum) {  // bookNum이 있을 때만 표시
        items.push({
          key: `book${bookNum}_overlay`,
          x: bookPositions[index].x,
          y: bookPositions[index].y
        });
      }
    });

    return items;
  }

  // 책 클릭 영역 생성 (퍼즐용)
  getBookClickAreas() {
    const { width, height } = this.cameras.main;
    const clickAreas = [];

    // 책 위치 (5개 슬롯)
    const bookPositions = [
      { x: width / 2 - 120, y: height / 2 },
      { x: width / 2 - 60, y: height / 2 },
      { x: width / 2, y: height / 2 },
      { x: width / 2 + 60, y: height / 2 },
      { x: width / 2 + 120, y: height / 2 }
    ];

    this.bookOrder.forEach((bookNum, index) => {
      if (bookNum) {
        clickAreas.push({
          x: bookPositions[index].x,
          y: bookPositions[index].y,
          width: 50,
          height: 150,
          debugAlpha: 0,
          highlight: this.selectedBookIndex === index,  // 선택된 책 하이라이트
          callback: () => this.onBookClick(index)
        });
      }
    });

    return clickAreas;
  }

  // 책 클릭 처리
  onBookClick(index) {
    if (this.selectedBookIndex === null) {
      // 첫 번째 책 선택
      this.selectedBookIndex = index;
    } else if (this.selectedBookIndex === index) {
      // 같은 책 다시 클릭 -> 선택 해제
      this.selectedBookIndex = null;
    } else {
      // 두 번째 책 선택 -> 자리 바꾸기
      const temp = this.bookOrder[this.selectedBookIndex];
      this.bookOrder[this.selectedBookIndex] = this.bookOrder[index];
      this.bookOrder[index] = temp;
      this.selectedBookIndex = null;
      this.saveBookOrder();

      // 정답 체크
      if (this.checkBookPuzzleSolved()) {
        this.sceneState.bookPuzzleSolved = true;
        this.saveState();
      }
    }

    // 팝업 갱신
    this.scene.stop('PopupScene');
    this.showBookshelfPopup();
  }

  // 퍼즐 정답 체크
  checkBookPuzzleSolved() {
    const answer = [1, 2, 3, 4, 5];
    return this.bookOrder.length === 5 &&
      this.bookOrder.every((val, idx) => val === answer[idx]);
  }

  // paper2 획득
  collectPaper2() {
    this.sceneState.paper2 = true;
    this.saveState();

    this.addItem({
      id: 'paper2',
      name: '종이조각2',
      image: 'assets/images/items/paper2.png'
    });

    // 정렬된 책장으로 전환
    this.scene.stop('PopupScene');
    this.showBookshelfPopup();
  }

  // 책 순서 저장
  saveBookOrder() {
    window.cabinInsideBookOrder = this.bookOrder;
  }

  // book 아이템으로 book4 추가 시도
  tryAddBook() {
    if (this.checkSelectedItem('book')) {
      // book 사용하여 book4 추가
      this.sceneState.bookAdded = true;
      this.bookOrder = [3, 1, 5, 2, 4];  // book4 추가
      this.saveState();
      this.saveBookOrder();
      this.removeItem('book');

      // 팝업 재실행 (퍼즐 모드로)
      this.scene.stop('PopupScene');
      this.showBookshelfPopup();
    } else {
      this.showHintDialog('책 한 권이 모자라...');
    }
  }

  // ========== 씬 이동 ==========
  goToKitchen() {
    this.fadeToScene('KitchenScene');
  }

  goBack() {
    this.fadeToScene('CabinOutsideScene');
  }

  // ========== 유틸리티 메서드 ==========
  saveState() {
    window.cabinInsideSceneState = this.sceneState;
  }

  checkSelectedItem(itemId) {
    return window.gameSelectedItem === itemId;
  }

  addItem(item) {
    window.dispatchEvent(new CustomEvent('addItem', { detail: item }));
  }

  removeItem(itemId) {
    window.dispatchEvent(new CustomEvent('removeItem', { detail: { id: itemId } }));
  }

  showHintDialog(message) {
    window.dispatchEvent(new CustomEvent('showHintDialog', { detail: { message } }));
  }

  // 순환 힌트 메시지 표시
  showRotatingHint(key, hints) {
    const currentIndex = this.hintIndex[key] || 0;
    const message = hints[currentIndex];

    // 다음 인덱스로 업데이트 (순환)
    this.hintIndex[key] = (currentIndex + 1) % hints.length;
    window.cabinInsideHintIndex = this.hintIndex;

    this.showHintDialog(message);
  }

  disableAllAreas() {
    const areas = [this.drawerArea, this.bookshelfArea, this.kitchenArea, this.backArea];
    areas.forEach(area => {
      if (area) area.disableInteractive();
    });
  }

  enableAllAreas() {
    const areas = [this.drawerArea, this.bookshelfArea, this.kitchenArea, this.backArea];
    areas.forEach(area => {
      if (area) area.setInteractive({ useHandCursor: true });
    });
  }

  shutdown() {
    window.removeEventListener('dialogClick', this.handleDialogClick);
  }
}
