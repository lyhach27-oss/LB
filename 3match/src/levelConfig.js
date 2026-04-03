export const levels = {
  zigzag: [
    // { x, y, width, height, angle }
    // Top wall leaning right
    { x: 150, y: 100, width: 300, height: 20, angle: 0.2 },
    // Middle wall leaning left
    { x: 350, y: 220, width: 300, height: 20, angle: -0.2 },
    // Bottom wall leaning right
    { x: 150, y: 340, width: 300, height: 20, angle: 0.2 },
    // Left boundary
    { x: -10, y: 250, width: 20, height: 500, angle: 0 },
    // Right boundary
    { x: 510, y: 250, width: 20, height: 500, angle: 0 }
  ]
};
