export const GameState = {
  config: {
    rows: 10,
    cols: 12,
    cellSize: 50, // will be calculate dynamically based on screen width
    cellGap: 5,
    colors: ['red', 'blue', 'green', 'yellow', 'purple'],
    startMoves: 10,
    objectiveTarget: 8,
    objectiveColor: 'red'
  },
  currentMoves: 0,
  currentObjectiveCount: 0,
  isInputLocked: false,
  board: [], // 2D array [row][col] storing block data

  init() {
    this.currentMoves = this.config.startMoves;
    this.currentObjectiveCount = 0;
    this.isInputLocked = false;
  },

  updateHUD() {
    const moveEl = document.getElementById('moves-count');
    const objEl = document.getElementById('objective-count');
    if (moveEl) moveEl.innerText = this.currentMoves;
    if (objEl) objEl.innerText = Math.max(0, this.config.objectiveTarget - this.currentObjectiveCount);

    this.updateDangerZone();
  },

  updateDangerZone() {
    const rocks = document.getElementById('danger-rocks');
    if (!rocks) return;

    // Calculate danger percentage (0 to 1) based on used moves
    const totalMoves = this.config.startMoves;
    const movesUsed = totalMoves - this.currentMoves;
    const dangerPercent = Math.min(1, movesUsed / totalMoves);

    // Max translation distance (e.g., 60px down)
    const maxTranslateY = 60;
    const currentTranslateY = dangerPercent * maxTranslateY;

    rocks.style.transform = `translateY(${currentTranslateY}px)`;
  },

  checkWinLossEndCard() {
    if (this.currentObjectiveCount >= this.config.objectiveTarget) {
      this.showEndCard(true);
      return true;
    } else if (this.currentMoves <= 0) {
      this.showEndCard(false);
      return true;
    }
    return false;
  },

  showEndCard(isWin) {
    this.isInputLocked = true;
    const endCard = document.getElementById('end-card');
    const title = document.getElementById('end-card-title');
    const charEl = document.getElementById('danger-character');

    if (charEl) {
      if (isWin) {
        charEl.classList.add('character-saved');
      } else {
        charEl.classList.add('character-crushed');
      }
    }

    if (endCard && title) {
      setTimeout(() => {
        endCard.classList.remove('hidden');
        title.innerText = isWin ? 'GREAT JOB!' : 'OH NO!';
      }, 500); // Wait a bit for character animations to play out
    }
  }
};
