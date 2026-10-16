import './style.css';
import { GameEngine } from './engine/core/GameEngine.ts';
import { LevelBuilder } from './engine/world/LevelBuilder.ts';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas element #game-canvas not found.');
  }

  // 1. Initialize Game Engine with 2.2x pixel-art zoom
  const engine = new GameEngine({
    canvas,
    zoom: 2.2,
  });

  // 2. Build demo world with walls, pillars, player, key, and locked door
  const world = LevelBuilder.buildDemoWorld(engine.input);
  engine.setWorld(world);

  // 3. Start RAF loop
  engine.start();

  // 4. Auto-focus canvas so user can play immediately with WASD
  canvas.focus();

  // 5. Wire DOM HUD elements (FPS counter and Inventory Slot)
  const fpsBadge = document.getElementById('fps-badge');
  const slotKey = document.getElementById('slot-key');

  let frameCount = 0;
  let lastFpsUpdate = performance.now();

  const updateHUD = (): void => {
    // Inventory update
    if (slotKey) {
      if (world.player.hasKey('golden_key')) {
        slotKey.className = 'inventory-slot has-key';
        slotKey.innerHTML = '<span class="slot-icon">🗝️</span><span class="slot-label">Llave Dorada</span>';
      } else {
        slotKey.className = 'inventory-slot empty';
        slotKey.innerHTML = '<span class="slot-icon">🗝️</span><span class="slot-label">Sin Llave</span>';
      }
    }

    // FPS update
    frameCount++;
    const now = performance.now();
    if (now - lastFpsUpdate >= 500) {
      const fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
      if (fpsBadge) {
        fpsBadge.textContent = `${fps} FPS`;
      }
      frameCount = 0;
      lastFpsUpdate = now;
    }

    requestAnimationFrame(updateHUD);
  };

  requestAnimationFrame(updateHUD);
});
