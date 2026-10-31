import './style.css';
import { GameEngine } from './engine/core/GameEngine.ts';
import { LevelBuilder } from './engine/world/LevelBuilder.ts';
import { AssetManager } from './engine/graphics/AssetManager.ts';
import { TileStudio } from './editor/TileStudio.ts';
import { MapInspector } from './editor/MapInspector.ts';
import { MinigameManager } from './engine/minigames/MinigameManager.ts';
import { PhotoPuzzleMinigame } from './engine/minigames/photoPuzzle/PhotoPuzzleMinigame.ts';
import { FishingMinigame } from './engine/minigames/fishing/FishingMinigame.ts';
import { QuizMinigame } from './engine/minigames/quiz/QuizMinigame.ts';
import { MemoryMinigame } from './engine/minigames/memory/MemoryMinigame.ts';

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
  const defaultSidebar = document.getElementById('sidebar-default-content');
  const minigameContainer = document.getElementById('sidebar-minigame-container');

  // Initialize Minigame System
  const minigameManager = MinigameManager.getInstance();
  if (defaultSidebar && minigameContainer) {
    minigameManager.setContainers(defaultSidebar, minigameContainer);
  }
  minigameManager.registerMinigame(new PhotoPuzzleMinigame('/game1/assets/photo.png'));
  minigameManager.registerMinigame(new FishingMinigame());
  minigameManager.registerMinigame(new QuizMinigame());
  minigameManager.registerMinigame(new MemoryMinigame());

  let frameCount = 0;
  let lastFpsUpdate = performance.now();

  const keyLabels: Record<string, { label: string; icon: string }> = {
    golden_key: { label: 'Llave Dorada', icon: '🗝️' },
    iron_key: { label: 'Llave de Hierro', icon: '🗝️' },
    crystal_key: { label: 'Llave de Cristal', icon: '💎' },
    key_1: { label: 'Llave del Retrato (key_1)', icon: '🗝️' },
    key_2: { label: 'Llave Marina (key_2)', icon: '🗝️' },
    key_3: { label: 'Llave del Corazón (key_3)', icon: '🗝️' },
    key_4: { label: 'Llave de las Cartas (key_4)', icon: '🗝️' },
  };

  const updateHUD = (): void => {
    // Inventory update
    if (inventoryDisplay) {
      const keys = Array.from(world.player.inventoryKeys);
      const fragmentCount = world.player.photoFragments.size;
      const fishCount = world.player.fishCaughtCount;
      const bottleCount = world.player.bottlesFoundCount;

      const keysHTML = keys
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

      let fragmentsHTML = '';
      if (fragmentCount > 0) {
        fragmentsHTML = `
          <div class="inventory-slot has-fragments" title="Pedacitos de foto coleccionados: ${fragmentCount} de 4">
            <span class="slot-icon">🧩</span>
            <span class="slot-label">Fotos: ${fragmentCount}/4</span>
          </div>
        `;
      }

      let fishingHTML = '';
      if (fishCount > 0) {
        fishingHTML += `
          <div class="inventory-slot has-fish" title="Peces capturados en el muelle: ${fishCount}">
            <span class="slot-icon">🐟</span>
            <span class="slot-label">Peces: ${fishCount}</span>
          </div>
        `;
      }
      if (bottleCount > 0) {
        fishingHTML += `
          <div class="inventory-slot has-bottle" title="Botellas con mensaje pescadas: ${bottleCount}">
            <span class="slot-icon">📜</span>
            <span class="slot-label">Botellas: ${bottleCount}</span>
          </div>
        `;
      }

      if (keys.length === 0 && fragmentCount === 0 && fishCount === 0 && bottleCount === 0) {
        inventoryDisplay.innerHTML = `
          <div class="inventory-slot empty" id="slot-key" title="Ranura de Llave">
            <span class="slot-icon">🗝️</span>
            <span class="slot-label">Sin Llaves ni Ítems</span>
          </div>
        `;
      } else {
        inventoryDisplay.innerHTML = `${keysHTML}${fragmentsHTML}${fishingHTML}`;
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

  // 8. Initialize Map Inspector (Global Map & Entity Inspector)
  const mapInspectorMount = document.getElementById('map-inspector-mount');
  let mapInspector: MapInspector | null = null;
  if (mapInspectorMount) {
    mapInspector = new MapInspector({
      container: mapInspectorMount,
      world,
    });
  }

  // 9. Tab Navigation Logic (Juego vs Mapa Completo vs Tile Studio)
  const tabGame = document.getElementById('tab-game') as HTMLButtonElement;
  const tabMap = document.getElementById('tab-map') as HTMLButtonElement;
  const tabPaint = document.getElementById('tab-paint') as HTMLButtonElement;
  const viewGame = document.getElementById('view-game') as HTMLElement;
  const viewMap = document.getElementById('view-map') as HTMLElement;
  const viewPaint = document.getElementById('view-paint') as HTMLElement;

  const tabs: Record<'game' | 'map' | 'paint', { tab: HTMLButtonElement; view: HTMLElement }> = {
    game: { tab: tabGame, view: viewGame },
    map: { tab: tabMap, view: viewMap },
    paint: { tab: tabPaint, view: viewPaint },
  };

  const switchTab = (activeTab: 'game' | 'map' | 'paint'): void => {
    (['game', 'map', 'paint'] as const).forEach((t) => {
      const isActive = t === activeTab;
      tabs[t].tab?.classList.toggle('active', isActive);
      tabs[t].tab?.setAttribute('aria-selected', String(isActive));
      tabs[t].view?.classList.toggle('active', isActive);
    });

    if (activeTab === 'game') {
      canvas.focus();
    } else if (activeTab === 'map') {
      if (mapInspector) {
        requestAnimationFrame(() => {
          mapInspector?.setWorld(world);
          mapInspector?.fitToView();
          mapInspector?.render();
        });
      }
    } else if (activeTab === 'paint') {
      if (tileStudio) {
        tileStudio.render();
      }
    }
  };

  tabGame?.addEventListener('click', () => switchTab('game'));
  tabMap?.addEventListener('click', () => switchTab('map'));
  tabPaint?.addEventListener('click', () => switchTab('paint'));
});
