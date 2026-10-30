import { GameObject } from '../engine/core/GameObject.ts';
import type { World } from '../engine/world/World.ts';
import { isCollidable } from '../engine/core/ICollidable.ts';

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
  }

  const box = isCollidable(entity) ? entity.getCollider() : entity.getBounds();
  return {
    entity,
    label,
    icon,
    category,
    x: Math.floor(box.left),
    y: Math.floor(box.top),
    width: Math.floor(box.width),
    height: Math.floor(box.height),
  };
}

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
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;

  // Mouse cursor in map coordinates
  private mouseMapX = 0;
  private mouseMapY = 0;
  private isMouseInside = false;

  // Selected & Hovered Entities
  private selectedEntity: GameObject | null = null;
  private hoveredEntity: GameObject | null = null;

  // Layer Toggles
  private showBackground = true;
  private showEntities = true;
  private showBorders = true;
  private showLabels = true;
  private showCollisionMask = false;
  private showForeground = true;
  private showGrid = true;

  // Filter query in sidebar
  private searchQuery = '';

  // DOM Elements
  private statusCoordsEl!: HTMLElement;
  private zoomBadgeEl!: HTMLElement;
  private entityListContainer!: HTMLElement;
  private toastEl!: HTMLElement;

  constructor(options: MapInspectorOptions) {
    this.container = options.container;
    this.world = options.world;
    this.buildUI();
    this.attachEvents();
    // Centrar automáticamente el mapa al inicializar
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
              <span class="toolbar-title">🗺️ Inspector de Mapa Global</span>
              <span class="badge badge-tech" id="map-res-badge">...</span>
              <span class="badge badge-status" id="map-zoom-badge">100%</span>
            </div>

            <div class="toolbar-center">
              <span class="coord-indicator" id="map-coord-display">
                <span class="coord-label">Cursor:</span> <strong>X: 0</strong>, <strong>Y: 0</strong>
              </span>
            </div>

            <div class="toolbar-actions">
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
            </div>

            <div class="hint-text">
              🖱️ <strong>Arrastrar:</strong> Mover mapa • <strong>Rueda:</strong> Zoom • <strong>Clic:</strong> Copiar Coordenadas (X, Y)
            </div>
          </div>
        </div>

        <!-- Sidebar: Entity Inspector & Placement Helper -->
        <aside class="map-inspector-sidebar">
          <div class="sidebar-header">
            <h3>📦 Objetos en el Mapa</h3>
            <span class="entity-count-badge" id="entity-count-badge">0 objetos</span>
          </div>

          <div class="sidebar-search">
            <input 
              type="text" 
              id="inspector-search-input" 
              placeholder="Filtrar por nombre o tipo..." 
              autocomplete="off"
            />
          </div>

          <!-- Selected Entity Quick Info & Code Snippet -->
          <div class="selected-entity-box" id="selected-entity-box">
            <div class="box-title">Selección / Último Clic:</div>
            <div class="selected-coords" id="selected-coords">Haz clic en el mapa o en un objeto</div>
            <button class="copy-code-btn" id="btn-copy-code" title="Copiar código para LevelBuilder.ts">
              📋 Copiar Coordenadas
            </button>
          </div>

          <!-- Scrollable Entity List -->
          <div class="entity-list-scroll" id="inspector-entity-list">
            <!-- Rendered dynamically -->
          </div>
        </aside>
      </div>
    `;

    this.canvas = this.container.querySelector('#map-inspector-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.statusCoordsEl = this.container.querySelector('#map-coord-display') as HTMLElement;
    this.zoomBadgeEl = this.container.querySelector('#map-zoom-badge') as HTMLElement;
    this.entityListContainer = this.container.querySelector('#inspector-entity-list') as HTMLElement;
    this.toastEl = this.container.querySelector('#inspector-toast') as HTMLElement;

    this.updateMapResolutionBadge();
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

    // Panning & Mouse interactions
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragStartX = e.clientX - this.panX;
      this.dragStartY = e.clientY - this.panY;
      this.canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.panX = e.clientX - this.dragStartX;
        this.panY = e.clientY - this.dragStartY;
        this.render();
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.canvas.style.cursor = 'crosshair';
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseCanvasX = e.clientX - rect.left;
      const mouseCanvasY = e.clientY - rect.top;

      // Transform from screen coords to map coords
      this.mouseMapX = Math.round((mouseCanvasX - this.panX) / this.scale);
      this.mouseMapY = Math.round((mouseCanvasY - this.panY) / this.scale);
      this.isMouseInside = true;

      // Check if hovering over any entity
      this.hoveredEntity = this.findEntityAt(this.mouseMapX, this.mouseMapY);

      this.updateCoordIndicator();
      this.render();
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

      // Zoom toward cursor
      this.panX = mouseX - (mouseX - this.panX) * (newScale / this.scale);
      this.panY = mouseY - (mouseY - this.panY) * (newScale / this.scale);
      this.scale = newScale;

      this.updateZoomBadge();
      this.render();
    }, { passive: false });

    // Click to select entity or copy coordinates
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseCanvasX = e.clientX - rect.left;
      const mouseCanvasY = e.clientY - rect.top;

      const clickMapX = Math.round((mouseCanvasX - this.panX) / this.scale);
      const clickMapY = Math.round((mouseCanvasY - this.panY) / this.scale);

      // Check if clicking inside map
      const w = this.world.tileMap.worldWidth;
      const h = this.world.tileMap.worldHeight;
      if (clickMapX < 0 || clickMapX > w || clickMapY < 0 || clickMapY > h) {
        return;
      }

      const entity = this.findEntityAt(clickMapX, clickMapY);
      if (entity) {
        this.selectEntity(entity);
      } else {
        this.selectedEntity = null;
        this.updateSelectedInfo(clickMapX, clickMapY);
      }

      // Automatically copy coordinates to clipboard
      this.copyToClipboard(`X: ${clickMapX}, Y: ${clickMapY}`, `📍 Coordenadas copiadas: (${clickMapX}, ${clickMapY})`);
      this.render();
    });

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

    // Copy Code button in sidebar
    this.container.querySelector('#btn-copy-code')?.addEventListener('click', () => {
      if (this.selectedEntity) {
        const info = getEntityInfo(this.selectedEntity);
        const code = `new ${this.selectedEntity.constructor.name}(${info.x}, ${info.y})`;
        this.copyToClipboard(code, `📋 Código copiado: ${code}`);
      } else {
        const text = `X: ${this.mouseMapX}, Y: ${this.mouseMapY}`;
        this.copyToClipboard(text, `📍 Coordenadas copiadas: (${this.mouseMapX}, ${this.mouseMapY})`);
      }
    });

    // Layer Toggles
    this.bindToggle('#toggle-bg', (active) => { this.showBackground = active; });
    this.bindToggle('#toggle-entities', (active) => { this.showEntities = active; });
    this.bindToggle('#toggle-borders', (active) => { this.showBorders = active; this.showLabels = active; });
    this.bindToggle('#toggle-mask', (active) => { this.showCollisionMask = active; });
    this.bindToggle('#toggle-fg', (active) => { this.showForeground = active; });
    this.bindToggle('#toggle-grid', (active) => { this.showGrid = active; });

    // Search filter input
    const searchInput = this.container.querySelector('#inspector-search-input') as HTMLInputElement;
    searchInput?.addEventListener('input', () => {
      this.searchQuery = searchInput.value.toLowerCase().trim();
      this.updateEntityList();
    });
  }

  private bindToggle(selector: string, callback: (active: boolean) => void): void {
    const label = this.container.querySelector(selector) as HTMLElement;
    const input = label?.querySelector('input') as HTMLInputElement;
    if (label && input) {
      input.addEventListener('change', () => {
        if (input.checked) {
          label.classList.add('active');
        } else {
          label.classList.remove('active');
        }
        callback(input.checked);
        this.render();
      });
    }
  }

  private findEntityAt(mapX: number, mapY: number): GameObject | null {
    // Search in reverse order (top zIndex first)
    for (let i = this.world.entities.length - 1; i >= 0; i--) {
      const entity = this.world.entities[i];
      if (entity.isDestroyed) continue;
      // Skip global entities spanning the entire map
      if (entity.size.x >= this.world.tileMap.worldWidth && entity.size.y >= this.world.tileMap.worldHeight) {
        continue;
      }
      const box = isCollidable(entity) ? entity.getCollider() : entity.getBounds();
      if (mapX >= box.left && mapX <= box.right && mapY >= box.top && mapY <= box.bottom) {
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
    const box = isCollidable(entity) ? entity.getCollider() : entity.getBounds();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    this.centerOn(cx, cy, Math.max(this.scale, 1.2));
  }

  private selectEntity(entity: GameObject): void {
    this.selectedEntity = entity;
    const info = getEntityInfo(entity);
    this.updateSelectedInfo(info.x, info.y, info);
    this.highlightSidebarItem(entity);
  }

  private updateSelectedInfo(x: number, y: number, info?: EntityInfo): void {
    const selectedCoordsEl = this.container.querySelector('#selected-coords');
    const copyBtn = this.container.querySelector('#btn-copy-code') as HTMLButtonElement;

    if (!selectedCoordsEl || !copyBtn) return;

    if (info) {
      selectedCoordsEl.innerHTML = `
        <div style="font-weight: 700; color: #38bdf8; margin-bottom: 2px;">${info.icon} ${info.label}</div>
        <div>Posición: <strong>X: ${info.x}</strong>, <strong>Y: ${info.y}</strong></div>
        <div style="font-size: 0.8rem; color: #94a3b8;">Tamaño: ${info.width} × ${info.height} px</div>
      `;
      copyBtn.innerHTML = `📋 Copiar constructor: <code>new ${info.entity.constructor.name}(${info.x}, ${info.y})</code>`;
    } else {
      selectedCoordsEl.innerHTML = `
        <div style="font-weight: 700; color: #f8fafc; margin-bottom: 2px;">📍 Punto en Mapa</div>
        <div>Posición: <strong>X: ${x}</strong>, <strong>Y: ${y}</strong></div>
        <div style="font-size: 0.8rem; color: #94a3b8;">Sin objeto en este punto</div>
      `;
      copyBtn.innerHTML = `📋 Copiar Coordenadas (${x}, ${y})`;
    }
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

    // Filter by search query
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
      // Checkerboard placeholder if background disabled
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

      // Render entities sorted by depth
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

    // 7. Red Debug Borders & Object Badges
    if (this.showBorders) {
      this.renderEntityOverlays(ctx);
    }

    // 8. Crosshair & Coordinate Guides at Cursor
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
      const info = getEntityInfo(entity);
      const isSelected = entity === this.selectedEntity;
      const isHovered = entity === this.hoveredEntity;

      const x = info.x;
      const y = info.y;
      const w = info.width;
      const h = info.height;

      // Border styling
      if (isSelected) {
        ctx.strokeStyle = '#facc15'; // Gold for selected
        ctx.lineWidth = 2.5 / this.scale;
        ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
      } else if (isHovered) {
        ctx.strokeStyle = '#38bdf8'; // Cyan for hovered
        ctx.lineWidth = 2 / this.scale;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      } else {
        ctx.strokeStyle = '#ef4444'; // Red default
        ctx.lineWidth = 1.5 / this.scale;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
      }

      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);

      // Label Badge
      if (this.showLabels) {
        const fullLabel = `${info.label} (${x}, ${y})`;
        const textWidth = ctx.measureText(fullLabel).width;
        const badgePadding = 6 / this.scale;
        const badgeW = textWidth + badgePadding * 2;
        const badgeH = 16 / this.scale;
        const badgeX = Math.floor(x + (w - badgeW) / 2);
        const badgeY = Math.floor(y - badgeH - 3 / this.scale);

        // Badge background
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

        // Badge text
        ctx.fillStyle = isSelected ? '#facc15' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(fullLabel, badgeX + badgeW / 2, badgeY + badgeH / 2);
      }
    }

    ctx.restore();
  }
}
