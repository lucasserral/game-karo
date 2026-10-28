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

  // 1. Preload assets (hero sprites, custom tileset, and the estate map)
  try {
    await AssetManager.getInstance().loadHeroSpriteSheet('/sprites/hero.png');
    await AssetManager.getInstance().loadHeroIdleSprite('/sprites/hero-idle.png');
    await AssetManager.getInstance().loadCustomTileset('/sprites/tileset.png');
    await AssetManager.getInstance().loadEstateMap('/maps/estate-map.webp');
    await AssetManager.getInstance().loadCollisionMask('/maps/estate-collision.png');
    await AssetManager.getInstance().loadEstateForeground('/maps/estate-foreground.png');
    console.log('Game assets loaded successfully.');
  } catch (err) {
    console.warn('Using procedural fallbacks for missing assets:', err);
  }

  // 2. Initialize Game Engine with 1.85x pixel-art zoom for the grand 1600x1066 estate
  const engine = new GameEngine({
    canvas,
    zoom: 1.85,
  });

  // 3. Build the estate world matching map-expectation.jpeg
  const world = LevelBuilder.buildEstateWorld(engine.input);
  engine.setWorld(world);

  // 4. Start RAF loop
  engine.start();

  // 5. Auto-focus canvas so user can play immediately with WASD
  canvas.focus();

  // Alternar visualización de la máscara de colisión (tecla M o botón)
  const btnToggleMask = document.getElementById('btn-toggle-mask');
  const toggleMask = (): void => {
    world.showCollisionDebug = !world.showCollisionDebug;
    if (btnToggleMask) {
      if (world.showCollisionDebug) {
        btnToggleMask.style.background = '#ef4444';
        btnToggleMask.style.borderColor = '#fca5a5';
        btnToggleMask.style.color = '#ffffff';
      } else {
        btnToggleMask.style.background = '#0f172a';
        btnToggleMask.style.borderColor = '#38bdf8';
        btnToggleMask.style.color = '#38bdf8';
      }
    }
  };

  // Alternar visualización de bordes rojos y nombres de objetos (tecla B o botón)
  const btnToggleBorders = document.getElementById('btn-toggle-borders');
  const toggleBorders = (): void => {
    world.showEntityDebug = !world.showEntityDebug;
    if (btnToggleBorders) {
      if (world.showEntityDebug) {
        btnToggleBorders.style.background = 'rgba(239, 68, 68, 0.25)';
        btnToggleBorders.style.borderColor = '#ef4444';
        btnToggleBorders.style.color = '#f87171';
      } else {
        btnToggleBorders.style.background = '#0f172a';
        btnToggleBorders.style.borderColor = '#64748b';
        btnToggleBorders.style.color = '#94a3b8';
      }
    }
  };

  btnToggleMask?.addEventListener('click', toggleMask);
  btnToggleBorders?.addEventListener('click', toggleBorders);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') {
      toggleMask();
    } else if (e.key === 'b' || e.key === 'B') {
      toggleBorders();
    }
  });

  // 6. Wire DOM HUD elements (FPS counter and Dynamic Inventory)
  const fpsBadge = document.getElementById('fps-badge');
  const inventoryDisplay = document.getElementById('inventory-display');

  let frameCount = 0;
  let lastFpsUpdate = performance.now();

  const keyLabels: Record<string, { label: string; icon: string }> = {
    golden_key: { label: 'Llave Dorada', icon: '🗝️' },
    iron_key: { label: 'Llave de Hierro', icon: '🗝️' },
    crystal_key: { label: 'Llave de Cristal', icon: '💎' },
  };

  const updateHUD = (): void => {
    // Inventory update
    if (inventoryDisplay) {
      const keys = Array.from(world.player.inventoryKeys);
      if (keys.length === 0) {
        inventoryDisplay.innerHTML = `
          <div class="inventory-slot empty" id="slot-key" title="Ranura de Llave">
            <span class="slot-icon">🗝️</span>
            <span class="slot-label">Sin Llaves</span>
          </div>
        `;
      } else {
        inventoryDisplay.innerHTML = keys
          .map((k) => {
            const info = keyLabels[k] || { label: k, icon: '🗝️' };
            return `
            <div class="inventory-slot has-key" title="${info.label}">
              <span class="slot-icon">${info.icon}</span>
              <span class="slot-label">${info.label}</span>
            </div>
          `;
          })
          .join('');
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
