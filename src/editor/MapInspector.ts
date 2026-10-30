import { GameObject } from '../engine/core/GameObject.ts';
import type { World } from '../engine/world/World.ts';

export interface MapInspectorOptions {
  container: HTMLElement;
  world: World;
}

export interface EntityInfo {
  entity: GameObject;
  label: string;
  icon: string;
  category: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'rectangle' | 'oval';
}

export function getEntityInfo(entity: GameObject): EntityInfo {
  const className = entity.constructor.name;
  let label = className;
  let icon = '📦';
  let category = 'General';

  if (className === 'Player') {
    label = 'Jugador (Player)';
    icon = '🧙';
    category = 'Personaje';
  } else if (className === 'WaterFountain') {
    label = 'Fuente de Agua';
    icon = '⛲';
    category = 'Monumentos';
  } else if (className === 'Fireplace') {
    label = 'Chimenea';
    icon = '🔥';
    category = 'Interiores';
  } else if (className === 'Footbridge') {
    label = 'Puente de Madera';
    icon = '🌉';
    category = 'Estructuras';
  } else if (className === 'Door') {
    const d = entity as any;
    label = `Puerta: ${d.doorName || 'Cerrada'}`;
    icon = '🚪';
    category = 'Puertas & Cerraduras';
  } else if (className === 'KeyItem') {
    const k = entity as any;
    label = `Llave: ${k.keyName || k.keyId}`;
    icon = '🗝️';
    category = 'Coleccionables';
  } else if (className === 'KitchenStove') {
    label = 'Fogón de Cocina';
    icon = '🍳';
    category = 'Interiores';
  } else if (className === 'BedEntity') {
    const b = entity as any;
    label = `Cama: ${b.bedName || 'Dormitorio'}`;
    icon = '🛏️';
    category = 'Mobiliario';
  } else if (className === 'BookshelfEntity') {
    const bk = entity as any;
    label = `Librería: ${bk.bookTitle || 'Estudio'}`;
    icon = '📚';
    category = 'Mobiliario';
  } else if (className === 'TreasureChest') {
    const c = entity as any;
    label = `Cofre [${c.isOpen ? 'Abierto' : 'Cerrado'}]`;
    icon = '💎';
    category = 'Tesoros';
  } else if (className === 'PicnicTable') {
    label = 'Mesa de Picnic';
    icon = '🧺';
    category = 'Mobiliario';
  } else if (className === 'GardenBench') {
    label = 'Banco de Jardín';
    icon = '🪑';
    category = 'Mobiliario';
  } else if (className === 'BeachShore') {
    label = 'Costa / Playa';
    icon = '🏖️';
    category = 'Ambiente';
  } else if (className === 'TreeEntity') {
    label = 'Árbol (Tronco)';
    icon = '🌲';
    category = 'Vegetación';
  } else if (className === 'StaticObstacle') {
    label = 'Obstáculo Sólido';
    icon = '🧱';
    category = 'Colisiones';
  } else if (className === 'PhotoTable') {
    label = 'Mesa de Nota (Minijuego)';
    icon = '📝';
    category = 'Minijuegos';
  } else if (className === 'PhotoFragmentItem') {
    const frag = entity as any;
    label = `Pedacito de Foto #${frag.fragmentIndex}`;
    icon = '🧩';
    category = 'Minijuegos';
  } else if (className === 'FishingRodEntity') {
    label = 'Caña de Pescar (Muelle)';
    icon = '🎣';
    category = 'Minijuegos';
  }

  return {
    entity,
    label,
    icon,
    category,
    x: Math.round(entity.position.x),
    y: Math.round(entity.position.y),
    width: Math.round(entity.size.x),
    height: Math.round(entity.size.y),
    shape: entity.colliderShape ?? 'rectangle',
  };
}

type HandleType = 'body' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w';

export class MapInspector {
  private container: HTMLElement;
  private world: World;

  // Canvas
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;

  // Transform (Camera / Pan & Zoom)
  private panX = 0;
  private panY = 0;
  private scale = 0.55;
  private isPanning = false;
  private panStartX = 0;
  private panStartY = 0;

  // Direct Manipulation / Gizmo Dragging
  private activeHandle: HandleType | null = null;
  private isManipulating = false;
  private dragOrigin = { x: 0, y: 0 };
  private initialEntityState = { x: 0, y: 0, w: 0, h: 0 };

  // Mouse cursor in map coordinates
  private mouseMapX = 0;
  private mouseMapY = 0;
  private isMouseInside = false;

  // Selected & Hovered Entities
  private selectedEntity: GameObject | null = null;
  private hoveredEntity: GameObject | null = null;
  private hoveredHandle: HandleType | null = null;

  // Layer Toggles
  private showBackground = true;
  private showEntities = true;
  private showBorders = true;
  private showLabels = true;
  private showCollisionMask = false;
  private showForeground = true;
  private showGrid = true;
  private snapToGrid = false;

  // Filter query in sidebar
  private searchQuery = '';

  // DOM Elements
  private statusCoordsEl!: HTMLElement;
  private zoomBadgeEl!: HTMLElement;
  private entityListContainer!: HTMLElement;
  private propertyEditorContainer!: HTMLElement;
  private toastEl!: HTMLElement;
  private exportModalEl!: HTMLElement;

  constructor(options: MapInspectorOptions) {
    this.container = options.container;
    this.world = options.world;
    this.buildUI();
    this.attachEvents();

    requestAnimationFrame(() => {
      this.fitToView();
      this.render();
      this.updateEntityList();
    });
  }

  public setWorld(world: World): void {
    this.world = world;
    this.updateEntityList();
    this.render();
  }

  private buildUI(): void {
    this.container.innerHTML = `
      <div class="map-inspector-layout">
        <!-- Main Map View Area -->
        <div class="map-viewport-wrapper">
          <!-- Toolbar Header -->
          <div class="map-inspector-toolbar">
            <div class="toolbar-left">
              <span class="toolbar-title">🗺️ Inspector & Editor de Objetos</span>
              <span class="badge badge-tech" id="map-res-badge">...</span>
              <span class="badge badge-status" id="map-zoom-badge">100%</span>
            </div>

            <div class="toolbar-center">
              <span class="coord-indicator" id="map-coord-display">
                <span class="coord-label">Cursor:</span> <strong>X: 0</strong>, <strong>Y: 0</strong>
              </span>
            </div>

            <div class="toolbar-actions">
              <button class="inspector-btn" id="btn-export-level" style="background: rgba(16, 185, 129, 0.2); border-color: #10b981; color: #6ee7b7;" title="Generar código de todos los objetos para LevelBuilder.ts">
                ✨ Exportar LevelBuilder
              </button>
              <button class="inspector-btn" id="btn-fit-map" title="Ajustar todo el mapa a la pantalla">
                🔍 Ajustar Todo
              </button>
              <button class="inspector-btn" id="btn-reset-zoom" title="Zoom al 100%">
                1:1 (100%)
              </button>
            </div>
          </div>

          <!-- Interactive Canvas Container -->
          <div class="map-canvas-container" id="map-canvas-container">
            <canvas id="map-inspector-canvas"></canvas>
            <div class="inspector-toast" id="inspector-toast"></div>
          </div>

          <!-- Bottom Layer Toggles Bar -->
          <div class="map-inspector-footer">
            <div class="toggle-group">
              <label class="toggle-chip active" id="toggle-bg">
                <input type="checkbox" checked /> 🗺️ Fondo
              </label>
              <label class="toggle-chip active" id="toggle-entities">
                <input type="checkbox" checked /> 📦 Sprites
              </label>
              <label class="toggle-chip active" id="toggle-borders">
                <input type="checkbox" checked /> 🔴 Bordes & Nombres
              </label>
              <label class="toggle-chip" id="toggle-mask">
                <input type="checkbox" /> 🧱 Máscara de Colisión
              </label>
              <label class="toggle-chip active" id="toggle-fg">
                <input type="checkbox" checked /> 🌳 Capa Superior (Dosel)
              </label>
              <label class="toggle-chip active" id="toggle-grid">
                <input type="checkbox" checked /> 📐 Cuadrícula 32px
              </label>
              <label class="toggle-chip" id="toggle-snap">
                <input type="checkbox" /> 🧲 Ajustar a Rejilla (Snap 16px)
              </label>
            </div>

            <div class="hint-text">
              🖱️ <strong>Clic en objeto:</strong> Seleccionar • <strong>Arrastrar cuerpo:</strong> Mover • <strong>Arrastrar bordes/esquinas:</strong> Redimensionar
            </div>
          </div>
        </div>

        <!-- Sidebar: Entity Property Editor & Entity Explorer -->
        <aside class="map-inspector-sidebar">
          <!-- Property Editor for Selected Entity -->
          <div class="property-editor-panel" id="property-editor-panel">
            <!-- Rendered dynamically when entity is selected or not -->
          </div>

          <!-- Entity Explorer Section -->
          <div class="sidebar-header">
            <h3>📦 Lista de Objetos</h3>
            <span class="entity-count-badge" id="entity-count-badge">0 objetos</span>
          </div>

          <div class="sidebar-search">
            <input 
              type="text" 
              id="inspector-search-input" 
              placeholder="Buscar objeto por nombre o tipo..." 
              autocomplete="off"
            />
          </div>

          <!-- Scrollable Entity List -->
          <div class="entity-list-scroll" id="inspector-entity-list">
            <!-- Rendered dynamically -->
          </div>
        </aside>
      </div>

      <!-- Export LevelBuilder Modal -->
      <div class="export-modal-backdrop" id="export-modal-backdrop" style="display: none;">
        <div class="export-modal">
          <div class="modal-header">
            <h3>✨ Código para LevelBuilder.ts</h3>
            <button class="modal-close-btn" id="modal-close-btn">✕</button>
          </div>
          <div class="modal-body">
            <p style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 12px;">
              Copia este bloque de código y reemplázalo en la sección <code>// 4. Objetos interactivos vivos y animados</code> dentro de <code>src/engine/world/LevelBuilder.ts</code>:
            </p>
            <textarea id="export-code-textarea" readonly rows="16"></textarea>
          </div>
          <div class="modal-footer">
            <button class="inspector-btn" id="modal-btn-copy" style="background: #10b981; color: #ffffff; border-color: #34d399; font-weight: 700;">
              📋 Copiar al Portapapeles
            </button>
            <button class="inspector-btn" id="modal-btn-done">Cerrar</button>
          </div>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#map-inspector-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.statusCoordsEl = this.container.querySelector('#map-coord-display') as HTMLElement;
    this.zoomBadgeEl = this.container.querySelector('#map-zoom-badge') as HTMLElement;
    this.entityListContainer = this.container.querySelector('#inspector-entity-list') as HTMLElement;
    this.propertyEditorContainer = this.container.querySelector('#property-editor-panel') as HTMLElement;
    this.toastEl = this.container.querySelector('#inspector-toast') as HTMLElement;
    this.exportModalEl = this.container.querySelector('#export-modal-backdrop') as HTMLElement;

    this.updateMapResolutionBadge();
    this.renderPropertyEditor();
    this.resizeCanvas();
  }

  private updateMapResolutionBadge(): void {
    const resBadge = this.container.querySelector('#map-res-badge');
    if (resBadge) {
      resBadge.textContent = `${this.world.tileMap.worldWidth} × ${this.world.tileMap.worldHeight} px`;
    }
  }

  private resizeCanvas(): void {
    const wrapper = this.container.querySelector('#map-canvas-container');
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const w = Math.max(400, Math.floor(rect.width));
    const h = Math.max(300, Math.floor(rect.height || 620));

    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  private attachEvents(): void {
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.render();
    });

    // --- MOUSE DOWN: Selection, Handle Grabbing, or Panning ---
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseCanvasX = e.clientX - rect.left;
      const mouseCanvasY = e.clientY - rect.top;
      const mapX = Math.round((mouseCanvasX - this.panX) / this.scale);
      const mapY = Math.round((mouseCanvasY - this.panY) / this.scale);

      // 1. Check if clicking on an interactive handle of the selected entity
      if (this.selectedEntity) {
        const handle = this.getHandleAt(mapX, mapY, this.selectedEntity);
        if (handle) {
          this.activeHandle = handle;
          this.isManipulating = true;
          this.dragOrigin = { x: mapX, y: mapY };
          this.initialEntityState = {
            x: this.selectedEntity.position.x,
            y: this.selectedEntity.position.y,
            w: this.selectedEntity.size.x,
            h: this.selectedEntity.size.y,
          };
          return;
        }
      }

      // 2. Check if clicking on any entity to select it
      const clickedEntity = this.findEntityAt(mapX, mapY);
      if (clickedEntity) {
        this.selectEntity(clickedEntity);
        this.activeHandle = 'body';
        this.isManipulating = true;
        this.dragOrigin = { x: mapX, y: mapY };
        this.initialEntityState = {
          x: clickedEntity.position.x,
          y: clickedEntity.position.y,
          w: clickedEntity.size.x,
          h: clickedEntity.size.y,
        };
        this.render();
        return;
      }

      // 3. Otherwise, click on background: start panning the canvas
      this.isPanning = true;
      this.panStartX = e.clientX - this.panX;
      this.panStartY = e.clientY - this.panY;
      this.canvas.style.cursor = 'grabbing';
    });

    // --- MOUSE MOVE: Panning or Manipulating Object ---
    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseCanvasX = e.clientX - rect.left;
      const mouseCanvasY = e.clientY - rect.top;
      const mapX = Math.round((mouseCanvasX - this.panX) / this.scale);
      const mapY = Math.round((mouseCanvasY - this.panY) / this.scale);

      this.mouseMapX = mapX;
      this.mouseMapY = mapY;
      this.updateCoordIndicator();

      // Case A: Panning the map view
      if (this.isPanning) {
        this.panX = e.clientX - this.panStartX;
        this.panY = e.clientY - this.panStartY;
        this.render();
        return;
      }

      // Case B: Manipulating (moving/resizing) the selected entity
      if (this.isManipulating && this.selectedEntity && this.activeHandle) {
        let deltaX = mapX - this.dragOrigin.x;
        let deltaY = mapY - this.dragOrigin.y;

        if (this.snapToGrid) {
          deltaX = Math.round(deltaX / 16) * 16;
          deltaY = Math.round(deltaY / 16) * 16;
        }

        const s = this.initialEntityState;
        const e = this.selectedEntity;

        switch (this.activeHandle) {
          case 'body':
            e.position.x = s.x + deltaX;
            e.position.y = s.y + deltaY;
            break;
          case 'se':
            e.size.x = Math.max(16, s.w + deltaX);
            e.size.y = Math.max(16, s.h + deltaY);
            break;
          case 'sw':
            e.position.x = s.x + deltaX;
            e.size.x = Math.max(16, s.w - deltaX);
            e.size.y = Math.max(16, s.h + deltaY);
            break;
          case 'ne':
            e.position.y = s.y + deltaY;
            e.size.x = Math.max(16, s.w + deltaX);
            e.size.y = Math.max(16, s.h - deltaY);
            break;
          case 'nw':
            e.position.x = s.x + deltaX;
            e.position.y = s.y + deltaY;
            e.size.x = Math.max(16, s.w - deltaX);
            e.size.y = Math.max(16, s.h - deltaY);
            break;
          case 'e':
            e.size.x = Math.max(16, s.w + deltaX);
            break;
          case 'w':
            e.position.x = s.x + deltaX;
            e.size.x = Math.max(16, s.w - deltaX);
            break;
          case 's':
            e.size.y = Math.max(16, s.h + deltaY);
            break;
          case 'n':
            e.position.y = s.y + deltaY;
            e.size.y = Math.max(16, s.h - deltaY);
            break;
        }

        // Live update input values in property editor
        this.syncPropertyInputs();
        this.render();
        return;
      }

      // Case C: Hovering around to update cursor styles
      if (this.selectedEntity) {
        const handle = this.getHandleAt(mapX, mapY, this.selectedEntity);
        this.hoveredHandle = handle;
        if (handle) {
          this.setCursorForHandle(handle);
          this.render();
          return;
        }
      }

      const entityUnderCursor = this.findEntityAt(mapX, mapY);
      this.hoveredEntity = entityUnderCursor;
      if (entityUnderCursor) {
        this.canvas.style.cursor = 'pointer';
      } else {
        this.canvas.style.cursor = 'crosshair';
      }
      this.render();
    });

    // --- MOUSE UP: Finish interaction ---
    window.addEventListener('mouseup', () => {
      if (this.isPanning) {
        this.isPanning = false;
        this.canvas.style.cursor = 'crosshair';
      }
      if (this.isManipulating) {
        this.isManipulating = false;
        this.activeHandle = null;
        this.updateEntityList(); // refresh sidebar list with new positions
      }
    });

    this.canvas.addEventListener('mouseenter', () => {
      this.isMouseInside = true;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.isMouseInside = false;
      this.hoveredEntity = null;
      this.render();
    });

    // Zoom via wheel centered at mouse
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const newScale = Math.max(0.15, Math.min(3.5, this.scale * zoomFactor));

      this.panX = mouseX - (mouseX - this.panX) * (newScale / this.scale);
      this.panY = mouseY - (mouseY - this.panY) * (newScale / this.scale);
      this.scale = newScale;

      this.updateZoomBadge();
      this.render();
    }, { passive: false });

    // Toolbar Buttons
    this.container.querySelector('#btn-fit-map')?.addEventListener('click', () => {
      this.fitToView();
      this.render();
    });

    this.container.querySelector('#btn-reset-zoom')?.addEventListener('click', () => {
      this.scale = 1.0;
      this.centerOn(this.world.tileMap.worldWidth / 2, this.world.tileMap.worldHeight / 2);
      this.updateZoomBadge();
      this.render();
    });

    // Export LevelBuilder Button
    this.container.querySelector('#btn-export-level')?.addEventListener('click', () => {
      this.openExportModal();
    });

    // Modal Close buttons
    this.container.querySelector('#modal-close-btn')?.addEventListener('click', () => {
      this.exportModalEl.style.display = 'none';
    });
    this.container.querySelector('#modal-btn-done')?.addEventListener('click', () => {
      this.exportModalEl.style.display = 'none';
    });

    // Modal Copy button
    this.container.querySelector('#modal-btn-copy')?.addEventListener('click', () => {
      const textarea = this.container.querySelector('#export-code-textarea') as HTMLTextAreaElement;
      if (textarea) {
        this.copyToClipboard(textarea.value, '✨ ¡Código completo copiado! Pégalo en LevelBuilder.ts');
      }
    });

    // Layer Toggles
    this.bindToggle('#toggle-bg', (active) => { this.showBackground = active; });
    this.bindToggle('#toggle-entities', (active) => { this.showEntities = active; });
    this.bindToggle('#toggle-borders', (active) => { this.showBorders = active; this.showLabels = active; });
    this.bindToggle('#toggle-mask', (active) => { this.showCollisionMask = active; });
    this.bindToggle('#toggle-fg', (active) => { this.showForeground = active; });
    this.bindToggle('#toggle-grid', (active) => { this.showGrid = active; });
    this.bindToggle('#toggle-snap', (active) => { this.snapToGrid = active; });

    // Search filter input
    const searchInput = this.container.querySelector('#inspector-search-input') as HTMLInputElement;
    searchInput?.addEventListener('input', () => {
      this.searchQuery = searchInput.value.toLowerCase().trim();
      this.updateEntityList();
    });
  }

  private setCursorForHandle(handle: HandleType): void {
    switch (handle) {
      case 'nw':
      case 'se':
        this.canvas.style.cursor = 'nwse-resize';
        break;
      case 'ne':
      case 'sw':
        this.canvas.style.cursor = 'nesw-resize';
        break;
      case 'n':
      case 's':
        this.canvas.style.cursor = 'ns-resize';
        break;
      case 'e':
      case 'w':
        this.canvas.style.cursor = 'ew-resize';
        break;
      case 'body':
        this.canvas.style.cursor = 'move';
        break;
      default:
        this.canvas.style.cursor = 'crosshair';
    }
  }

  private getHandleAt(mapX: number, mapY: number, entity: GameObject): HandleType | null {
    const x = entity.position.x;
    const y = entity.position.y;
    const w = entity.size.x;
    const h = entity.size.y;
    const hitRadius = Math.max(6, 9 / this.scale);

    const isNear = (hx: number, hy: number) => {
      return Math.abs(mapX - hx) <= hitRadius && Math.abs(mapY - hy) <= hitRadius;
    };

    // 4 Corners
    if (isNear(x, y)) return 'nw';
    if (isNear(x + w, y)) return 'ne';
    if (isNear(x + w, y + h)) return 'se';
    if (isNear(x, y + h)) return 'sw';

    // 4 Mid-edges
    if (isNear(x + w / 2, y)) return 'n';
    if (isNear(x + w / 2, y + h)) return 's';
    if (isNear(x, y + h / 2)) return 'w';
    if (isNear(x + w, y + h / 2)) return 'e';

    // Body
    if (mapX >= x && mapX <= x + w && mapY >= y && mapY <= y + h) {
      return 'body';
    }

    return null;
  }

  private bindToggle(selector: string, callback: (active: boolean) => void): void {
    const label = this.container.querySelector(selector) as HTMLElement;
    const input = label?.querySelector('input') as HTMLInputElement;
    if (label && input) {
      input.addEventListener('change', () => {
        label.classList.toggle('active', input.checked);
        callback(input.checked);
        this.render();
      });
    }
  }

  private findEntityAt(mapX: number, mapY: number): GameObject | null {
    for (let i = this.world.entities.length - 1; i >= 0; i--) {
      const entity = this.world.entities[i];
      if (entity.isDestroyed) continue;
      if (entity.size.x >= this.world.tileMap.worldWidth && entity.size.y >= this.world.tileMap.worldHeight) {
        continue;
      }
      const x = entity.position.x;
      const y = entity.position.y;
      const w = entity.size.x;
      const h = entity.size.y;
      if (mapX >= x && mapX <= x + w && mapY >= y && mapY <= y + h) {
        return entity;
      }
    }
    return null;
  }

  public fitToView(): void {
    this.resizeCanvas();
    const mapW = this.world.tileMap.worldWidth || 1536;
    const mapH = this.world.tileMap.worldHeight || 1024;
    const padding = 36;

    const scaleX = (this.canvas.width - padding * 2) / mapW;
    const scaleY = (this.canvas.height - padding * 2) / mapH;
    this.scale = Math.min(scaleX, scaleY);

    this.panX = Math.round((this.canvas.width - mapW * this.scale) / 2);
    this.panY = Math.round((this.canvas.height - mapH * this.scale) / 2);

    this.updateZoomBadge();
  }

  public centerOn(mapX: number, mapY: number, targetScale?: number): void {
    if (targetScale) {
      this.scale = targetScale;
    }
    this.panX = Math.round(this.canvas.width / 2 - mapX * this.scale);
    this.panY = Math.round(this.canvas.height / 2 - mapY * this.scale);
    this.updateZoomBadge();
    this.render();
  }

  public focusEntity(entity: GameObject): void {
    this.selectEntity(entity);
    const cx = entity.position.x + entity.size.x / 2;
    const cy = entity.position.y + entity.size.y / 2;
    this.centerOn(cx, cy, Math.max(this.scale, 1.2));
  }

  private selectEntity(entity: GameObject): void {
    this.selectedEntity = entity;
    this.renderPropertyEditor();
    this.highlightSidebarItem(entity);
  }

  private highlightSidebarItem(entity: GameObject): void {
    const cards = this.entityListContainer.querySelectorAll('.entity-card');
    cards.forEach((c) => c.classList.remove('active'));

    const activeCard = Array.from(cards).find((c) => (c as any)._entity === entity);
    if (activeCard) {
      activeCard.classList.add('active');
      activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  private updateCoordIndicator(): void {
    if (this.statusCoordsEl) {
      const w = this.world.tileMap.worldWidth;
      const h = this.world.tileMap.worldHeight;
      const isInside = this.mouseMapX >= 0 && this.mouseMapX <= w && this.mouseMapY >= 0 && this.mouseMapY <= h;

      this.statusCoordsEl.innerHTML = `
        <span class="coord-label">Cursor:</span> 
        <strong style="color: ${isInside ? '#38bdf8' : '#ef4444'};">X: ${this.mouseMapX}</strong>, 
        <strong style="color: ${isInside ? '#38bdf8' : '#ef4444'};">Y: ${this.mouseMapY}</strong>
      `;
    }
  }

  private updateZoomBadge(): void {
    if (this.zoomBadgeEl) {
      this.zoomBadgeEl.textContent = `${Math.round(this.scale * 100)}%`;
    }
  }

  private copyToClipboard(text: string, toastMessage: string): void {
    navigator.clipboard.writeText(text).catch(() => {});
    this.showToast(toastMessage);
  }

  private showToast(msg: string): void {
    if (!this.toastEl) return;
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('show');
    clearTimeout((this.toastEl as any)._timeout);
    (this.toastEl as any)._timeout = setTimeout(() => {
      this.toastEl.classList.remove('show');
    }, 2200);
  }

  // --- PROPERTY EDITOR (SIDEBAR) ---
  private renderPropertyEditor(): void {
    if (!this.selectedEntity) {
      this.propertyEditorContainer.innerHTML = `
        <div class="empty-property-state">
          <div class="empty-icon">🎯</div>
          <div class="empty-title">Sin objeto seleccionado</div>
          <div class="empty-hint">Haz clic en un objeto del mapa o selecciónalo en la lista para editar posición, tamaño y forma.</div>
        </div>
      `;
      return;
    }

    const info = getEntityInfo(this.selectedEntity);
    const shape = this.selectedEntity.colliderShape ?? 'rectangle';

    this.propertyEditorContainer.innerHTML = `
      <div class="prop-editor-card">
        <div class="prop-header">
          <span class="prop-icon">${info.icon}</span>
          <div class="prop-title-group">
            <div class="prop-title">${info.label}</div>
            <div class="prop-class"><code>${this.selectedEntity.constructor.name}</code></div>
          </div>
        </div>

        <!-- Forma de Colisión: Rectangular vs Ovaloide -->
        <div class="prop-field-group">
          <label class="prop-label">Forma del Colisionador:</label>
          <div class="shape-toggle-group">
            <button class="shape-btn ${shape === 'rectangle' ? 'active' : ''}" id="btn-shape-rect">
              ⬛ Rectangular
            </button>
            <button class="shape-btn ${shape === 'oval' ? 'active' : ''}" id="btn-shape-oval">
              ⭕ Ovaloide
            </button>
          </div>
        </div>

        <!-- Posición X & Y -->
        <div class="prop-grid-2">
          <div class="prop-field">
            <label class="prop-label">Posición X:</label>
            <div class="prop-input-stepper">
              <input type="number" id="prop-input-x" value="${info.x}" step="1" />
              <div class="stepper-buttons">
                <button class="step-btn" data-target="x" data-delta="-10">-10</button>
                <button class="step-btn" data-target="x" data-delta="-1">-1</button>
                <button class="step-btn" data-target="x" data-delta="+1">+1</button>
                <button class="step-btn" data-target="x" data-delta="+10">+10</button>
              </div>
            </div>
          </div>

          <div class="prop-field">
            <label class="prop-label">Posición Y:</label>
            <div class="prop-input-stepper">
              <input type="number" id="prop-input-y" value="${info.y}" step="1" />
              <div class="stepper-buttons">
                <button class="step-btn" data-target="y" data-delta="-10">-10</button>
                <button class="step-btn" data-target="y" data-delta="-1">-1</button>
                <button class="step-btn" data-target="y" data-delta="+1">+1</button>
                <button class="step-btn" data-target="y" data-delta="+10">+10</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Dimensiones Ancho & Alto -->
        <div class="prop-grid-2">
          <div class="prop-field">
            <label class="prop-label">Ancho (Width):</label>
            <div class="prop-input-stepper">
              <input type="number" id="prop-input-w" value="${info.width}" step="1" min="8" />
              <div class="stepper-buttons">
                <button class="step-btn" data-target="w" data-delta="-10">-10</button>
                <button class="step-btn" data-target="w" data-delta="-1">-1</button>
                <button class="step-btn" data-target="w" data-delta="+1">+1</button>
                <button class="step-btn" data-target="w" data-delta="+10">+10</button>
              </div>
            </div>
          </div>

          <div class="prop-field">
            <label class="prop-label">Alto (Height):</label>
            <div class="prop-input-stepper">
              <input type="number" id="prop-input-h" value="${info.height}" step="1" min="8" />
              <div class="stepper-buttons">
                <button class="step-btn" data-target="h" data-delta="-10">-10</button>
                <button class="step-btn" data-target="h" data-delta="-1">-1</button>
                <button class="step-btn" data-target="h" data-delta="+1">+1</button>
                <button class="step-btn" data-target="h" data-delta="+10">+10</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="prop-actions">
          <button class="copy-code-btn" id="btn-copy-entity-code">
            📋 Copiar Configuración del Objeto
          </button>
        </div>
      </div>
    `;

    // Shape Button Events
    const btnRect = this.propertyEditorContainer.querySelector('#btn-shape-rect') as HTMLButtonElement;
    const btnOval = this.propertyEditorContainer.querySelector('#btn-shape-oval') as HTMLButtonElement;

    btnRect?.addEventListener('click', () => {
      if (this.selectedEntity) {
        this.selectedEntity.colliderShape = 'rectangle';
        btnRect.classList.add('active');
        btnOval.classList.remove('active');
        this.render();
      }
    });

    btnOval?.addEventListener('click', () => {
      if (this.selectedEntity) {
        this.selectedEntity.colliderShape = 'oval';
        btnOval.classList.add('active');
        btnRect.classList.remove('active');
        this.render();
      }
    });

    // Inputs direct change
    const inputX = this.propertyEditorContainer.querySelector('#prop-input-x') as HTMLInputElement;
    const inputY = this.propertyEditorContainer.querySelector('#prop-input-y') as HTMLInputElement;
    const inputW = this.propertyEditorContainer.querySelector('#prop-input-w') as HTMLInputElement;
    const inputH = this.propertyEditorContainer.querySelector('#prop-input-h') as HTMLInputElement;

    const onInputChange = () => {
      if (!this.selectedEntity) return;
      this.selectedEntity.position.x = parseFloat(inputX.value) || 0;
      this.selectedEntity.position.y = parseFloat(inputY.value) || 0;
      this.selectedEntity.size.x = Math.max(8, parseFloat(inputW.value) || 16);
      this.selectedEntity.size.y = Math.max(8, parseFloat(inputH.value) || 16);
      this.render();
    };

    inputX?.addEventListener('input', onInputChange);
    inputY?.addEventListener('input', onInputChange);
    inputW?.addEventListener('input', onInputChange);
    inputH?.addEventListener('input', onInputChange);

    // Stepper buttons (+1, -1, +10, -10)
    this.propertyEditorContainer.querySelectorAll('.step-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!this.selectedEntity) return;
        const target = btn.getAttribute('data-target');
        const delta = parseInt(btn.getAttribute('data-delta') || '0', 10);

        if (target === 'x') {
          this.selectedEntity.position.x += delta;
        } else if (target === 'y') {
          this.selectedEntity.position.y += delta;
        } else if (target === 'w') {
          this.selectedEntity.size.x = Math.max(8, this.selectedEntity.size.x + delta);
        } else if (target === 'h') {
          this.selectedEntity.size.y = Math.max(8, this.selectedEntity.size.y + delta);
        }

        this.syncPropertyInputs();
        this.render();
      });
    });

    // Copy single entity code
    this.propertyEditorContainer.querySelector('#btn-copy-entity-code')?.addEventListener('click', () => {
      if (!this.selectedEntity) return;
      const code = this.generateEntityCode(this.selectedEntity);
      this.copyToClipboard(code, `📋 Código copiado: ${code}`);
    });
  }

  private syncPropertyInputs(): void {
    if (!this.selectedEntity) return;
    const inputX = this.propertyEditorContainer.querySelector('#prop-input-x') as HTMLInputElement;
    const inputY = this.propertyEditorContainer.querySelector('#prop-input-y') as HTMLInputElement;
    const inputW = this.propertyEditorContainer.querySelector('#prop-input-w') as HTMLInputElement;
    const inputH = this.propertyEditorContainer.querySelector('#prop-input-h') as HTMLInputElement;

    if (inputX) inputX.value = String(Math.round(this.selectedEntity.position.x));
    if (inputY) inputY.value = String(Math.round(this.selectedEntity.position.y));
    if (inputW) inputW.value = String(Math.round(this.selectedEntity.size.x));
    if (inputH) inputH.value = String(Math.round(this.selectedEntity.size.y));
  }

  // --- ENTITY CODE GENERATOR ---
  public generateEntityCode(e: GameObject): string {
    const className = e.constructor.name;
    const x = Math.round(e.position.x);
    const y = Math.round(e.position.y);
    const w = Math.round(e.size.x);
    const h = Math.round(e.size.y);
    const shape = e.colliderShape ?? 'rectangle';
    const hasOval = shape === 'oval';

    let code = '';
    if (className === 'WaterFountain') {
      const cx = Math.round(x + w / 2);
      const cy = Math.round(y + h / 2);
      code = `const fountain = new WaterFountain(${cx}, ${cy}, ${w}, ${h});`;
      if (!hasOval) code += ` fountain.colliderShape = 'rectangle';`;
      code += ` world.addEntity(fountain);`;
      return code;
    }

    if (className === 'Fireplace') {
      code = `const fire = new Fireplace(${x}, ${y}, ${w}, ${h});`;
      if (hasOval) code += ` fire.colliderShape = 'oval';`;
      code += ` world.addEntity(fire);`;
      return code;
    }

    if (className === 'Footbridge') {
      code = `const bridge = new Footbridge(${x}, ${y}, ${w}, ${h});`;
      if (hasOval) code += ` bridge.colliderShape = 'oval';`;
      code += ` world.addEntity(bridge);`;
      return code;
    }

    if (className === 'KitchenStove') {
      code = `const stove = new KitchenStove(${x}, ${y}, ${w}, ${h});`;
      if (hasOval) code += ` stove.colliderShape = 'oval';`;
      code += ` world.addEntity(stove);`;
      return code;
    }

    if (className === 'BedEntity') {
      const bedName = (e as any).bedName || 'Cama';
      code = `const bed = new BedEntity(${x}, ${y}, ${w}, ${h}, '${bedName}');`;
      if (hasOval) code += ` bed.colliderShape = 'oval';`;
      code += ` world.addEntity(bed);`;
      return code;
    }

    if (className === 'PicnicTable') {
      code = `const table = new PicnicTable(${x}, ${y}, ${w}, ${h});`;
      if (hasOval) code += ` table.colliderShape = 'oval';`;
      code += ` world.addEntity(table);`;
      return code;
    }

    if (className === 'GardenBench') {
      code = `const bench = new GardenBench(${x}, ${y}, ${w}, ${h});`;
      if (hasOval) code += ` bench.colliderShape = 'oval';`;
      code += ` world.addEntity(bench);`;
      return code;
    }

    if (className === 'BookshelfEntity') {
      const bk = e as any;
      const title = bk.bookTitle || 'Crónicas';
      const desc = bk.bookDescription || '';
      code = `const shelf = new BookshelfEntity(${x}, ${y}, ${w}, ${h}, '${title}', '${desc}');`;
      if (hasOval) code += ` shelf.colliderShape = 'oval';`;
      code += ` world.addEntity(shelf);`;
      return code;
    }

    if (className === 'TreasureChest') {
      const c = e as any;
      const keyId = c.requiredKeyId || 'iron_key';
      code = `const chest = new TreasureChest(${x}, ${y}, '${keyId}', ${w}, ${h});`;
      if (hasOval) code += ` chest.colliderShape = 'oval';`;
      code += ` world.addEntity(chest);`;
      return code;
    }

    if (className === 'KeyItem') {
      const k = e as any;
      const keyId = k.keyId || 'golden_key';
      const keyName = k.keyName || 'Llave';
      code = `const key = new KeyItem(${x}, ${y}, assets.keySprite, '${keyId}', '${keyName}', ${w}, ${h});`;
      if (hasOval) code += ` key.colliderShape = 'oval';`;
      code += ` world.addEntity(key);`;
      return code;
    }

    if (className === 'Door') {
      const d = e as any;
      const keyId = d.requiredKeyId || 'golden_key';
      const doorName = d.doorName || 'Puerta';
      code = `const door = new Door(${x}, ${y}, null, null, '${keyId}', ${w}, ${h}, '${doorName}');`;
      if (hasOval) code += ` door.colliderShape = 'oval';`;
      code += ` world.addEntity(door);`;
      return code;
    }

    if (className === 'Player') {
      return `// Jugador: Posición inicial\nplayer.position.set(${x}, ${y});`;
    }

    // Default GameObject
    code = `const obj = new ${className}(${x}, ${y}, ${w}, ${h});`;
    if (hasOval) code += ` obj.colliderShape = 'oval';`;
    code += ` world.addEntity(obj);`;
    return code;
  }

  // --- EXPORT ENTIRE LEVEL ---
  private openExportModal(): void {
    const entities = this.world.entities.filter(
      (e) => !e.isDestroyed && !(e.size.x >= this.world.tileMap.worldWidth && e.size.y >= this.world.tileMap.worldHeight)
    );

    let fullCode = `    // ==========================================================================\n`;
    fullCode += `    // 4. Objetos interactivos vivos y animados (Exportado desde Map Inspector)\n`;
    fullCode += `    // ==========================================================================\n\n`;

    for (const e of entities) {
      if (e.constructor.name === 'Player') continue;
      const comment = getEntityInfo(e).label;
      fullCode += `    // ${comment}\n`;
      fullCode += `    ${this.generateEntityCode(e)}\n\n`;
    }

    const textarea = this.container.querySelector('#export-code-textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.value = fullCode;
    }

    this.exportModalEl.style.display = 'flex';
  }

  // --- ENTITY LIST (SIDEBAR) ---
  public updateEntityList(): void {
    if (!this.entityListContainer) return;

    const countBadge = this.container.querySelector('#entity-count-badge');
    const validEntities = this.world.entities.filter(
      (e) => !e.isDestroyed && !(e.size.x >= this.world.tileMap.worldWidth && e.size.y >= this.world.tileMap.worldHeight)
    );

    if (countBadge) {
      countBadge.textContent = `${validEntities.length} objetos`;
    }

    const infos: EntityInfo[] = validEntities.map((e) => getEntityInfo(e));

    const filtered = this.searchQuery
      ? infos.filter(
          (i) =>
            i.label.toLowerCase().includes(this.searchQuery) ||
            i.category.toLowerCase().includes(this.searchQuery) ||
            i.entity.constructor.name.toLowerCase().includes(this.searchQuery)
        )
      : infos;

    if (filtered.length === 0) {
      this.entityListContainer.innerHTML = `
        <div style="padding: 24px; text-align: center; color: #64748b; font-size: 0.9rem;">
          No se encontraron objetos coincidentes.
        </div>
      `;
      return;
    }

    this.entityListContainer.innerHTML = '';
    for (const info of filtered) {
      const card = document.createElement('div');
      card.className = `entity-card ${this.selectedEntity === info.entity ? 'active' : ''}`;
      (card as any)._entity = info.entity;

      const shapeIcon = info.shape === 'oval' ? '⭕ Oval' : '⬛ Rect';

      card.innerHTML = `
        <div class="card-header">
          <span class="card-icon">${info.icon}</span>
          <div class="card-title-group">
            <div class="card-title">${info.label}</div>
            <div class="card-category">${info.category} • <code>${info.entity.constructor.name}</code></div>
          </div>
        </div>
        <div class="card-body">
          <span class="pos-badge">📍 (${info.x}, ${info.y})</span>
          <span class="size-badge">📐 ${info.width}×${info.height}</span>
          <span class="shape-badge">${shapeIcon}</span>
          <button class="card-btn-focus" title="Centrar cámara en este objeto">🎯 Centrar</button>
        </div>
      `;

      card.addEventListener('click', (e) => {
        const isFocusBtn = (e.target as HTMLElement).closest('.card-btn-focus');
        if (isFocusBtn) {
          this.focusEntity(info.entity);
        } else {
          this.selectEntity(info.entity);
          this.render();
        }
      });

      card.addEventListener('mouseenter', () => {
        this.hoveredEntity = info.entity;
        this.render();
      });

      card.addEventListener('mouseleave', () => {
        if (this.hoveredEntity === info.entity) {
          this.hoveredEntity = null;
          this.render();
        }
      });

      this.entityListContainer.appendChild(card);
    }
  }

  // --- RENDER CYCLE ---
  public render(): void {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const mapW = this.world.tileMap.worldWidth;
    const mapH = this.world.tileMap.worldHeight;

    // Clear background
    ctx.save();
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, w, h);

    // Apply viewport transform
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.scale, this.scale);

    // 1. Map Canvas Drop Shadow & Border
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, mapW, mapH);
    ctx.restore();

    // 2. Base Background Image
    if (this.showBackground && this.world.tileMap.backgroundImage) {
      ctx.drawImage(this.world.tileMap.backgroundImage, 0, 0, mapW, mapH);
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, mapW, mapH);
    }

    // 3. Optional 32px Grid
    if (this.showGrid) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1 / this.scale;
      ctx.beginPath();
      for (let x = 0; x <= mapW; x += 32) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, mapH);
      }
      for (let y = 0; y <= mapH; y += 32) {
        ctx.moveTo(0, y);
        ctx.lineTo(mapW, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 4. Collision Mask Overlay (if active)
    const fullMapCamera = {
      isVisible: () => true,
      getVisibleBounds: () => ({ left: 0, top: 0, right: mapW, bottom: mapH, width: mapW, height: mapH }),
    } as any;

    if (this.showCollisionMask && this.world.collisionMask) {
      this.world.collisionMask.renderDebug(ctx, fullMapCamera);
    }

    // 5. Entities (Sprites & Visual Representation)
    if (this.showEntities) {
      const sortedEntities = [...this.world.entities].filter(
        (e) => !e.isDestroyed && !(e.size.x >= mapW && e.size.y >= mapH)
      );
      sortedEntities.sort((a, b) => {
        if (a.zIndex !== b.zIndex) return a.zIndex - b.zIndex;
        return a.position.y + a.size.y - (b.position.y + b.size.y);
      });

      for (const entity of sortedEntities) {
        entity.render(ctx, fullMapCamera);
      }
    }

    // 6. Foreground Canopy / Overhead Layer
    if (this.showForeground && this.world.tileMap.foregroundImage) {
      ctx.drawImage(this.world.tileMap.foregroundImage, 0, 0, mapW, mapH);
    }

    // 7. Red Debug Borders & Object Badges (with Oval / Rect shapes)
    if (this.showBorders) {
      this.renderEntityOverlays(ctx);
    }

    // 8. Transform Gizmo for Selected Entity
    if (this.selectedEntity) {
      this.renderGizmo(ctx, this.selectedEntity);
    }

    // 9. Crosshair & Coordinate Guides at Cursor
    if (this.isMouseInside && this.mouseMapX >= 0 && this.mouseMapX <= mapW && this.mouseMapY >= 0 && this.mouseMapY <= mapH) {
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.lineWidth = 1 / this.scale;
      ctx.setLineDash([4 / this.scale, 4 / this.scale]);

      // Horizontal guide
      ctx.beginPath();
      ctx.moveTo(0, this.mouseMapY);
      ctx.lineTo(mapW, this.mouseMapY);
      ctx.stroke();

      // Vertical guide
      ctx.beginPath();
      ctx.moveTo(this.mouseMapX, 0);
      ctx.lineTo(this.mouseMapX, mapH);
      ctx.stroke();

      // Small cursor circle
      ctx.setLineDash([]);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(this.mouseMapX, this.mouseMapY, 4 / this.scale, 0, Math.PI * 2);
      ctx.fill();

      // Cursor position tooltip on canvas
      ctx.font = `bold ${Math.max(10, Math.round(11 / this.scale))}px "Outfit", system-ui, sans-serif`;
      const coordText = `(${this.mouseMapX}, ${this.mouseMapY})`;
      const textW = ctx.measureText(coordText).width;
      const bH = 18 / this.scale;
      const bW = textW + 10 / this.scale;
      const bX = this.mouseMapX + 8 / this.scale;
      const bY = this.mouseMapY + 8 / this.scale;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1 / this.scale;
      ctx.beginPath();
      ctx.roundRect(bX, bY, bW, bH, 3 / this.scale);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.fillText(coordText, bX + 5 / this.scale, bY + bH / 2);

      ctx.restore();
    }

    ctx.restore();
  }

  private renderEntityOverlays(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const fontSize = Math.max(9, Math.round(10 / Math.max(0.6, this.scale)));
    ctx.font = `bold ${fontSize}px "Outfit", system-ui, sans-serif`;
    ctx.textBaseline = 'middle';

    const entities = this.world.entities.filter(
      (e) => !e.isDestroyed && !(e.size.x >= this.world.tileMap.worldWidth && e.size.y >= this.world.tileMap.worldHeight)
    );

    for (const entity of entities) {
      const isSelected = entity === this.selectedEntity;
      const isHovered = entity === this.hoveredEntity;
      const info = getEntityInfo(entity);
      const isOval = entity.colliderShape === 'oval';

      const x = Math.round(entity.position.x);
      const y = Math.round(entity.position.y);
      const w = Math.round(entity.size.x);
      const h = Math.round(entity.size.y);

      // Border colors
      if (isSelected) {
        ctx.strokeStyle = '#facc15'; // Gold
        ctx.lineWidth = 2.5 / this.scale;
        ctx.fillStyle = 'rgba(250, 204, 21, 0.2)';
      } else if (isHovered) {
        ctx.strokeStyle = '#38bdf8'; // Cyan
        ctx.lineWidth = 2 / this.scale;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
      } else {
        ctx.strokeStyle = '#ef4444'; // Red default
        ctx.lineWidth = 1.5 / this.scale;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
      }

      // Draw Shape: Oval vs Rect
      if (isOval) {
        const cx = Math.floor(x + w / 2);
        const cy = Math.floor(y + h / 2);
        const rx = Math.floor(w / 2);
        const ry = Math.floor(h / 2);
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
      }

      // Label Badge
      if (this.showLabels) {
        const shapeIndicator = isOval ? '⭕ ' : '';
        const fullLabel = `${shapeIndicator}${info.label} (${x}, ${y})`;
        const textWidth = ctx.measureText(fullLabel).width;
        const badgePadding = 6 / this.scale;
        const badgeW = textWidth + badgePadding * 2;
        const badgeH = 16 / this.scale;
        const badgeX = Math.floor(x + (w - badgeW) / 2);
        const badgeY = Math.floor(y - badgeH - 3 / this.scale);

        ctx.fillStyle = isSelected
          ? 'rgba(20, 25, 40, 0.95)'
          : isHovered
          ? 'rgba(15, 23, 42, 0.95)'
          : 'rgba(15, 23, 42, 0.88)';
        ctx.strokeStyle = isSelected ? '#facc15' : isHovered ? '#38bdf8' : '#ef4444';
        ctx.lineWidth = 1 / this.scale;

        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 3 / this.scale);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isSelected ? '#facc15' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(fullLabel, badgeX + badgeW / 2, badgeY + badgeH / 2);
      }
    }

    ctx.restore();
  }

  // --- RENDER TRANSFORM GIZMO ---
  private renderGizmo(ctx: CanvasRenderingContext2D, entity: GameObject): void {
    ctx.save();
    const x = entity.position.x;
    const y = entity.position.y;
    const w = entity.size.x;
    const h = entity.size.y;
    const handleSize = Math.max(5, 7 / this.scale);

    // Glowing bounding frame
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2 / this.scale;
    ctx.setLineDash([4 / this.scale, 3 / this.scale]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);

    // Draw handles (4 corners + 4 edges)
    const handles = [
      { type: 'nw', hx: x, hy: y },
      { type: 'ne', hx: x + w, hy: y },
      { type: 'se', hx: x + w, hy: y + h },
      { type: 'sw', hx: x, hy: y + h },
      { type: 'n', hx: x + w / 2, hy: y },
      { type: 's', hx: x + w / 2, hy: y + h },
      { type: 'w', hx: x, hy: y + h / 2 },
      { type: 'e', hx: x + w, hy: y + h / 2 },
    ];

    for (const { type, hx, hy } of handles) {
      const isHover = this.hoveredHandle === type || this.activeHandle === type;
      ctx.fillStyle = isHover ? '#38bdf8' : '#ffffff';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5 / this.scale;
      ctx.fillRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
    }

    ctx.restore();
  }
}
