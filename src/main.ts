import './style.css';
import { GameEngine } from './engine/core/GameEngine.ts';
import { LevelBuilder } from './engine/world/LevelBuilder.ts';
import { AssetManager } from './engine/graphics/AssetManager.ts';
import { TileStudio } from './editor/TileStudio.ts';

window.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas element #game-canvas not found.');
  }

  // 1. Preload sprites (hero walking, optional idle pose, optional custom tileset)
  try {
    await AssetManager.getInstance().loadHeroSpriteSheet('/sprites/hero.png');
    await AssetManager.getInstance().loadHeroIdleSprite('/sprites/hero-idle.png');
    await AssetManager.getInstance().loadCustomTileset('/sprites/tileset.png');
    console.log('Game assets loaded successfully.');
  } catch (err) {
    console.warn('Using procedural fallbacks for missing assets:', err);
  }

  // 2. Initialize Game Engine with 2.2x pixel-art zoom
  const engine = new GameEngine({
    canvas,
    zoom: 2.2,
  });

  // 3. Build demo world with walls, pillars, player, key, and locked door
  const world = LevelBuilder.buildDemoWorld(engine.input);
  engine.setWorld(world);

  // 4. Start RAF loop
  engine.start();

  // 5. Auto-focus canvas so user can play immediately with WASD
  canvas.focus();

  // 6. Wire DOM HUD elements (FPS counter and Inventory Slot)
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

  // 7. Initialize Tile Studio (MS Paint XP Editor)
  const tileStudioMount = document.getElementById('tile-studio-mount');
  let tileStudio: TileStudio | null = null;
  if (tileStudioMount) {
    tileStudio = new TileStudio({
      container: tileStudioMount,
      initialSize: 32,
    });
  }

  // 8. Tab Navigation Logic (Juego vs Tile Studio)
  const tabGame = document.getElementById('tab-game') as HTMLButtonElement;
  const tabPaint = document.getElementById('tab-paint') as HTMLButtonElement;
  const viewGame = document.getElementById('view-game') as HTMLElement;
  const viewPaint = document.getElementById('view-paint') as HTMLElement;

  const switchTab = (activeTab: 'game' | 'paint'): void => {
    if (activeTab === 'game') {
      tabGame.classList.add('active');
      tabGame.setAttribute('aria-selected', 'true');
      tabPaint.classList.remove('active');
      tabPaint.setAttribute('aria-selected', 'false');

      viewGame.classList.add('active');
      viewPaint.classList.remove('active');

      canvas.focus();
    } else {
      tabPaint.classList.add('active');
      tabPaint.setAttribute('aria-selected', 'true');
      tabGame.classList.remove('active');
      tabGame.setAttribute('aria-selected', 'false');

      viewPaint.classList.add('active');
      viewGame.classList.remove('active');

      if (tileStudio) {
        tileStudio.render();
      }
    }
  };

  tabGame?.addEventListener('click', () => switchTab('game'));
  tabPaint?.addEventListener('click', () => switchTab('paint'));
});

