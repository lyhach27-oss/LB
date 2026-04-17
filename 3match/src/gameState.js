import { AppConfig } from './configManager.js';

export const GameState = {
  get config() { return AppConfig.board; },
  isInputLocked: false,
  board: [], // 2D array [row][col] storing block data

  init() {
    this.isInputLocked = false;
  },

  updateHUD() {
    // HUD and moves update logic removed to keep only Physics Drain Defense condition
  }
};
