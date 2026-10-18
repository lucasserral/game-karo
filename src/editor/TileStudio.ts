import { AssetManager } from '../engine/graphics/AssetManager.ts';
import { Sprite } from '../engine/graphics/Sprite.ts';

export type ToolType = 'pencil' | 'bucket' | 'eraser' | 'picker' | 'line' | 'rect';

/**
 * Classic 28-color MS Paint XP Palette
 */
export const XP_PALETTE: string[] = [
  // Row 1
  '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080',
  '#800080', '#808040', '#004040', '#0080ff', '#004080', '#8000ff', '#804000',
  // Row 2
  '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff',
  '#ff00ff', '#ffff80', '#00ff80', '#80ffff', '#8080ff', '#ff0080', '#ff8040',
];

export interface TileStudioOptions {
  container: HTMLElement;
  initialSize?: number;
}

export class TileStudio {
  private width: number;
  private height: number;
  private zoom = 16;
  private showGrid = true;
  private tool: ToolType = 'pencil';
  private primaryColor = '#4a4f5f';
  private secondaryColor = '#ffffff';

  // Grid of hex strings (or '' for transparent)
  private grid: string[][];
  private history: string[][][] = [];
  private historyIndex = -1;
  private maxHistory = 30;

  // Mouse interaction state
  private isMouseDown = false;
  private activeMouseButton = 0; // 0 = primary, 2 = secondary
  private dragStart: { x: number; y: number } | null = null;
  private lastDrawnPixel: { x: number; y: number } | null = null;

  // DOM Elements
  private container: HTMLElement;
  private editorCanvas!: HTMLCanvasElement;
  private editorCtx!: CanvasRenderingContext2D;
  private previewCanvas!: HTMLCanvasElement;
  private previewCtx!: CanvasRenderingContext2D;
  private statusCoord!: HTMLElement;
  private statusSize!: HTMLElement;
  private codeOutput!: HTMLTextAreaElement;
  private primaryColorBox!: HTMLElement;
  private secondaryColorBox!: HTMLElement;
  private copyToast!: HTMLElement;

  constructor(options: TileStudioOptions) {
    this.container = options.container;
    this.width = options.initialSize ?? 32;
    this.height = options.initialSize ?? 32;

    this.grid = this.createEmptyGrid(this.width, this.height);
    this.buildUI();
    this.pushHistory();

    // Default load existing floor tile as a starter so the user isn't faced with a blank canvas
    this.loadTilePreset('floor');
  }

  private createEmptyGrid(w: number, h: number): string[][] {
    const grid: string[][] = [];
    for (let y = 0; y < h; y++) {
      const row: string[] = [];
      for (let x = 0; x < w; x++) {
        row.push('');
      }
      grid.push(row);
    }
    return grid;
  }

  private cloneGrid(grid: string[][]): string[][] {
    return grid.map((row) => [...row]);
  }

  private pushHistory(): void {
    // Truncate redo states
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    this.history.push(this.cloneGrid(this.grid));
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  public undo(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.grid = this.cloneGrid(this.history[this.historyIndex]);
      this.render();
      this.updateCodePreview();
    }
  }

  public redo(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.grid = this.cloneGrid(this.history[this.historyIndex]);
      this.render();
      this.updateCodePreview();
    }
  }

  public clear(): void {
    this.grid = this.createEmptyGrid(this.width, this.height);
    this.pushHistory();
    this.render();
    this.updateCodePreview();
  }

  public resize(newSize: number): void {
    const newGrid = this.createEmptyGrid(newSize, newSize);
    const minW = Math.min(this.width, newSize);
    const minH = Math.min(this.height, newSize);
    for (let y = 0; y < minH; y++) {
      for (let x = 0; x < minW; x++) {
        newGrid[y][x] = this.grid[y][x];
      }
    }
    this.width = newSize;
    this.height = newSize;
    this.grid = newGrid;
    this.editorCanvas.width = this.width * this.zoom;
    this.editorCanvas.height = this.height * this.zoom;
    this.statusSize.textContent = `${this.width} x ${this.height} px`;
    this.pushHistory();
    this.render();
    this.updateCodePreview();
  }

  /**
   * Builds the MS Paint XP UI layout and controls
   */
  private buildUI(): void {
    this.container.innerHTML = `
      <div class="xp-paint-window">
        <!-- XP Window Titlebar -->
        <div class="xp-titlebar">
          <div class="xp-titlebar-text">
            <span class="xp-titlebar-icon">🎨</span>
            <span>Tile Studio - Microsoft Paint XP Edition (Game Tileset Editor)</span>
          </div>
          <div class="xp-window-controls">
            <button class="xp-win-btn xp-btn-min" title="Minimizar">_</button>
            <button class="xp-win-btn xp-btn-max" title="Maximizar">□</button>
            <button class="xp-win-btn xp-btn-close" title="Cerrar">✕</button>
          </div>
        </div>

        <!-- Menu / Presets Bar -->
        <div class="xp-menubar">
          <div class="xp-menu-item">
            <label for="xp-preset-select"><strong>Cargar Tile Existente:</strong></label>
            <select id="xp-preset-select" class="xp-select">
              <option value="floor">🧱 Suelo de Mazmorra (Floor)</option>
              <option value="wall">🧱 Pared de Fortaleza (Wall)</option>
              <option value="wallTop">🧱 Techo de Pared (Wall Top)</option>
              <option value="pillar">🏛️ Pilar con Gema (Pillar)</option>
              <option value="doorClosed">🚪 Puerta Cerrada (Door Closed)</option>
              <option value="doorOpen">🚪 Puerta Abierta (Door Open)</option>
              <option value="key">🗝️ Llave Dorada (Golden Key)</option>
              <option value="blank">✨ Lienzo Vacío (32x32)</option>
            </select>
          </div>

          <div class="xp-menu-item">
            <label for="xp-size-select"><strong>Tamaño:</strong></label>
            <select id="xp-size-select" class="xp-select">
              <option value="32" selected>32 x 32 px (Estándar)</option>
              <option value="16">16 x 16 px (Pequeño / Item)</option>
              <option value="48">48 x 48 px (Mediano)</option>
              <option value="64">64 x 64 px (Grande / Jefe)</option>
            </select>
          </div>

          <div class="xp-menu-item xp-menu-actions">
            <button id="xp-btn-undo" class="xp-action-btn" title="Deshacer (Ctrl+Z)">↩ Deshacer</button>
            <button id="xp-btn-redo" class="xp-action-btn" title="Rehacer (Ctrl+Y)">↪ Rehacer</button>
            <button id="xp-btn-grid" class="xp-action-btn active" title="Alternar Grilla">▦ Grilla</button>
            <button id="xp-btn-clear" class="xp-action-btn xp-btn-danger" title="Limpiar Todo">🗑 Limpiar</button>
          </div>
        </div>

        <!-- Main Workspace -->
        <div class="xp-workspace">
          <!-- Left: Classic MS Paint Toolbar -->
          <div class="xp-toolbar">
            <div class="xp-tools-header">Herramientas</div>
            <div class="xp-tools-grid">
              <button class="xp-tool-btn active" data-tool="pencil" title="Lápiz (Pintar 1 píxel)">
                <span class="tool-icon">✏️</span>
              </button>
              <button class="xp-tool-btn" data-tool="bucket" title="Relleno de Color / Bote de Pintura">
                <span class="tool-icon">🪣</span>
              </button>
              <button class="xp-tool-btn" data-tool="eraser" title="Borrador (Transparente)">
                <span class="tool-icon">🧹</span>
              </button>
              <button class="xp-tool-btn" data-tool="picker" title="Cuentagotas (Selector de color)">
                <span class="tool-icon">👁️</span>
              </button>
              <button class="xp-tool-btn" data-tool="line" title="Línea Recta">
                <span class="tool-icon">📏</span>
              </button>
              <button class="xp-tool-btn" data-tool="rect" title="Rectángulo">
                <span class="tool-icon">▭</span>
              </button>
            </div>

            <!-- Zoom Controls -->
            <div class="xp-tool-setting">
              <span class="setting-label">Zoom:</span>
              <div class="zoom-btn-group">
                <button id="xp-zoom-out" class="xp-sub-btn" title="Reducir zoom">-</button>
                <span id="xp-zoom-label" class="zoom-value">16x</span>
                <button id="xp-zoom-in" class="xp-sub-btn" title="Aumentar zoom">+</button>
              </div>
            </div>

            <!-- Seamless 3x3 Pattern Preview -->
            <div class="xp-preview-box">
              <div class="preview-label">Vista Previa 3x3:</div>
              <div class="preview-canvas-wrapper" title="Patrón repetido 3x3 continuo para verificar que calce perfectamente">
                <canvas id="xp-preview-canvas" width="96" height="96"></canvas>
              </div>
              <span class="preview-hint">Mosaico Repetido</span>
            </div>
          </div>

          <!-- Center: Canvas Area -->
          <div class="xp-canvas-area">
            <div class="xp-canvas-scroll-wrapper">
              <canvas id="xp-editor-canvas" width="${this.width * this.zoom}" height="${this.height * this.zoom}"></canvas>
            </div>
          </div>

          <!-- Right: Code Export & Live Apply Panel -->
          <div class="xp-export-panel">
            <div class="export-header">
              <h3>📦 Exportar y Guardar</h3>
              <p>Copia el código TypeScript listo para pegar en el juego o aplícalo en vivo.</p>
            </div>

            <!-- Live Apply into Active Game Engine -->
            <div class="export-card live-apply-card">
              <div class="card-title">⚡ Aplicar en Vivo al Juego</div>
              <p class="card-desc">Actualiza el sprite inmediatamente sin recargar la página:</p>
              <div class="live-apply-row">
                <select id="xp-target-sprite" class="xp-select">
                  <option value="floorSprite">Suelo (Floor)</option>
                  <option value="wallSprite">Pared (Wall)</option>
                  <option value="wallTopSprite">Techo Pared (Wall Top)</option>
                  <option value="pillarSprite">Pilar (Pillar)</option>
                  <option value="doorClosedSprite">Puerta Cerrada</option>
                  <option value="doorOpenSprite">Puerta Abierta</option>
                  <option value="keySprite">Llave Dorada</option>
                </select>
                <button id="xp-btn-apply-live" class="xp-btn-primary">⚡ Aplicar Ahora</button>
              </div>
            </div>

            <!-- Code Copying Actions -->
            <div class="export-card code-export-card">
              <div class="card-title">📋 Código para el Motor</div>
              <div class="code-actions">
                <button id="xp-btn-copy-ts" class="xp-btn-secondary" title="Copiar código TypeScript optimizado para AssetManager.ts">
                  📋 Copiar Código TS
                </button>
                <button id="xp-btn-download-png" class="xp-btn-secondary" title="Descargar como archivo PNG de 32x32">
                  💾 Descargar PNG
                </button>
                <button id="xp-btn-copy-dataurl" class="xp-btn-secondary" title="Copiar como Data URL / Base64">
                  🔗 Copiar Base64
                </button>
              </div>

              <div class="code-editor-box">
                <label for="xp-code-output" class="code-label">Código TypeScript Generado:</label>
                <textarea id="xp-code-output" class="xp-code-area" readonly spellcheck="false"></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom: MS Paint XP Classic Color Palette Bar -->
        <div class="xp-palette-bar">
          <!-- Dual Color Box -->
          <div class="xp-dual-color-box">
            <div class="xp-color-secondary" id="xp-color-sec" title="Color Secundario (Clic Derecho)"></div>
            <div class="xp-color-primary" id="xp-color-prim" title="Color Primario (Clic Izquierdo)"></div>
          </div>

          <!-- Color Swatches Grid -->
          <div class="xp-swatches-grid" id="xp-swatches"></div>

          <!-- Custom Color Picker & Transparent -->
          <div class="xp-custom-colors">
            <label class="custom-color-picker" title="Elegir Color Personalizado">
              <span>Personalizado:</span>
              <input type="color" id="xp-native-color-picker" value="${this.primaryColor}" />
            </label>
            <button id="xp-transparent-btn" class="xp-trans-swatch" title="Pintar transparente">
              <span class="checker-sample"></span> Transparente
            </button>
          </div>
        </div>

        <!-- Status Bar -->
        <div class="xp-statusbar">
          <div class="status-item" id="xp-status-info">Para dibujar, haz clic o arrastra. Clic derecho para color secundario.</div>
          <div class="status-item status-coords" id="xp-status-coord">X: 0, Y: 0</div>
          <div class="status-item status-size" id="xp-status-size">${this.width} x ${this.height} px</div>
        </div>
      </div>

      <!-- Toast Feedback Notification -->
      <div id="xp-toast" class="xp-toast">¡Copiado con éxito al portapapeles!</div>
    `;

    // Cache elements
    this.editorCanvas = this.container.querySelector('#xp-editor-canvas') as HTMLCanvasElement;
    this.editorCtx = this.editorCanvas.getContext('2d')!;
    this.editorCtx.imageSmoothingEnabled = false;

    this.previewCanvas = this.container.querySelector('#xp-preview-canvas') as HTMLCanvasElement;
    this.previewCtx = this.previewCanvas.getContext('2d')!;
    this.previewCtx.imageSmoothingEnabled = false;

    this.statusCoord = this.container.querySelector('#xp-status-coord') as HTMLElement;
    this.statusSize = this.container.querySelector('#xp-status-size') as HTMLElement;
    this.codeOutput = this.container.querySelector('#xp-code-output') as HTMLTextAreaElement;
    this.primaryColorBox = this.container.querySelector('#xp-color-prim') as HTMLElement;
    this.secondaryColorBox = this.container.querySelector('#xp-color-sec') as HTMLElement;
    this.copyToast = this.container.querySelector('#xp-toast') as HTMLElement;

    this.updateColorBoxes();
    this.renderPaletteSwatches();
    this.bindEvents();
    this.render();
  }

  private updateColorBoxes(): void {
    this.primaryColorBox.style.backgroundColor = this.primaryColor || 'transparent';
    this.secondaryColorBox.style.backgroundColor = this.secondaryColor || 'transparent';
  }

  private renderPaletteSwatches(): void {
    const swatchesContainer = this.container.querySelector('#xp-swatches') as HTMLElement;
    swatchesContainer.innerHTML = '';

    XP_PALETTE.forEach((color) => {
      const swatch = document.createElement('div');
      swatch.className = 'xp-swatch';
      swatch.style.backgroundColor = color;
      swatch.title = `Color: ${color} (Clic Izquierdo = Primario, Clic Derecho = Secundario)`;

      swatch.addEventListener('click', (e) => {
        e.preventDefault();
        this.primaryColor = color;
        this.updateColorBoxes();
      });

      swatch.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.secondaryColor = color;
        this.updateColorBoxes();
      });

      swatchesContainer.appendChild(swatch);
    });
  }

  /**
   * Binds user events for drawing, tools, and actions
   */
  private bindEvents(): void {
    // Canvas Drawing Events
    this.editorCanvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mouseup', () => this.handleMouseUp());
    this.editorCanvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Tools Switching
    const toolBtns = this.container.querySelectorAll('.xp-tool-btn');
    toolBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        toolBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.tool = btn.getAttribute('data-tool') as ToolType;
      });
    });

    // Preset Selection
    const presetSelect = this.container.querySelector('#xp-preset-select') as HTMLSelectElement;
    presetSelect.addEventListener('change', () => {
      const val = presetSelect.value;
      if (val === 'blank') {
        this.clear();
      } else {
        this.loadTilePreset(val);
      }
    });

    // Size Selection
    const sizeSelect = this.container.querySelector('#xp-size-select') as HTMLSelectElement;
    sizeSelect.addEventListener('change', () => {
      this.resize(parseInt(sizeSelect.value, 10));
    });

    // Zoom Controls
    const zoomInBtn = this.container.querySelector('#xp-zoom-in') as HTMLButtonElement;
    const zoomOutBtn = this.container.querySelector('#xp-zoom-out') as HTMLButtonElement;
    const zoomLabel = this.container.querySelector('#xp-zoom-label') as HTMLElement;

    zoomInBtn.addEventListener('click', () => {
      if (this.zoom < 32) {
        this.zoom = Math.min(32, this.zoom + 4);
        this.updateZoom(zoomLabel);
      }
    });

    zoomOutBtn.addEventListener('click', () => {
      if (this.zoom > 4) {
        this.zoom = Math.max(4, this.zoom - 4);
        this.updateZoom(zoomLabel);
      }
    });

    // Grid Toggle
    const gridBtn = this.container.querySelector('#xp-btn-grid') as HTMLButtonElement;
    gridBtn.addEventListener('click', () => {
      this.showGrid = !this.showGrid;
      gridBtn.classList.toggle('active', this.showGrid);
      this.render();
    });

    // Undo / Redo / Clear
    this.container.querySelector('#xp-btn-undo')!.addEventListener('click', () => this.undo());
    this.container.querySelector('#xp-btn-redo')!.addEventListener('click', () => this.redo());
    this.container.querySelector('#xp-btn-clear')!.addEventListener('click', () => {
      if (confirm('¿Deseas vaciar todo el lienzo?')) {
        this.clear();
      }
    });

    // Native Color Picker
    const colorPicker = this.container.querySelector('#xp-native-color-picker') as HTMLInputElement;
    colorPicker.addEventListener('input', () => {
      this.primaryColor = colorPicker.value;
      this.updateColorBoxes();
    });

    // Transparent button
    this.container.querySelector('#xp-transparent-btn')!.addEventListener('click', () => {
      this.primaryColor = '';
      this.updateColorBoxes();
    });

    // Keyboard Shortcuts (Undo: Ctrl+Z, Redo: Ctrl+Y)
    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          this.redo();
        } else {
          this.undo();
        }
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        this.redo();
        e.preventDefault();
      }
    });

    // Export Buttons
    this.container.querySelector('#xp-btn-copy-ts')!.addEventListener('click', () => this.copyTypeScriptCode());
    this.container.querySelector('#xp-btn-download-png')!.addEventListener('click', () => this.downloadPNG());
    this.container.querySelector('#xp-btn-copy-dataurl')!.addEventListener('click', () => this.copyDataURL());
    this.container.querySelector('#xp-btn-apply-live')!.addEventListener('click', () => this.applyToLiveGame());
  }

  private updateZoom(zoomLabel: HTMLElement): void {
    zoomLabel.textContent = `${this.zoom}x`;
    this.editorCanvas.width = this.width * this.zoom;
    this.editorCanvas.height = this.height * this.zoom;
    this.render();
  }

  private getGridCoordinates(e: MouseEvent): { x: number; y: number } | null {
    const rect = this.editorCanvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    const x = Math.floor(canvasX / this.zoom);
    const y = Math.floor(canvasY / this.zoom);

    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return { x, y };
    }
    return null;
  }

  private handleMouseDown(e: MouseEvent): void {
    const coords = this.getGridCoordinates(e);
    if (!coords) return;

    this.isMouseDown = true;
    this.activeMouseButton = e.button; // 0 = primary, 2 = secondary
    this.dragStart = { ...coords };
    this.lastDrawnPixel = null;

    const color = this.activeMouseButton === 2 ? this.secondaryColor : this.primaryColor;

    if (this.tool === 'pencil') {
      this.setPixel(coords.x, coords.y, color);
      this.lastDrawnPixel = coords;
      this.render();
    } else if (this.tool === 'eraser') {
      this.setPixel(coords.x, coords.y, '');
      this.lastDrawnPixel = coords;
      this.render();
    } else if (this.tool === 'bucket') {
      this.floodFill(coords.x, coords.y, color);
      this.pushHistory();
      this.render();
      this.updateCodePreview();
    } else if (this.tool === 'picker') {
      const picked = this.grid[coords.y][coords.x];
      if (this.activeMouseButton === 2) {
        this.secondaryColor = picked;
      } else {
        this.primaryColor = picked;
      }
      this.updateColorBoxes();
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    const coords = this.getGridCoordinates(e);
    if (coords) {
      this.statusCoord.textContent = `X: ${coords.x}, Y: ${coords.y}`;
    }

    if (!this.isMouseDown || !coords) return;

    const color = this.activeMouseButton === 2 ? this.secondaryColor : this.primaryColor;

    if (this.tool === 'pencil') {
      if (!this.lastDrawnPixel || this.lastDrawnPixel.x !== coords.x || this.lastDrawnPixel.y !== coords.y) {
        // Draw line between lastDrawnPixel and current coords to avoid gaps on fast drag
        if (this.lastDrawnPixel) {
          this.drawLine(this.lastDrawnPixel.x, this.lastDrawnPixel.y, coords.x, coords.y, color);
        } else {
          this.setPixel(coords.x, coords.y, color);
        }
        this.lastDrawnPixel = coords;
        this.render();
      }
    } else if (this.tool === 'eraser') {
      if (!this.lastDrawnPixel || this.lastDrawnPixel.x !== coords.x || this.lastDrawnPixel.y !== coords.y) {
        if (this.lastDrawnPixel) {
          this.drawLine(this.lastDrawnPixel.x, this.lastDrawnPixel.y, coords.x, coords.y, '');
        } else {
          this.setPixel(coords.x, coords.y, '');
        }
        this.lastDrawnPixel = coords;
        this.render();
      }
    } else if (this.tool === 'line' || this.tool === 'rect') {
      // Re-render with preview
      this.render();
      if (this.dragStart) {
        this.renderToolOverlay(this.dragStart, coords, color);
      }
    }
  }

  private handleMouseUp(): void {
    if (!this.isMouseDown) return;

    if (this.dragStart && (this.tool === 'line' || this.tool === 'rect')) {
      const coords = this.lastDrawnPixel || this.dragStart;
      const color = this.activeMouseButton === 2 ? this.secondaryColor : this.primaryColor;

      if (this.tool === 'line') {
        this.drawLine(this.dragStart.x, this.dragStart.y, coords.x, coords.y, color);
      } else if (this.tool === 'rect') {
        this.drawRect(this.dragStart.x, this.dragStart.y, coords.x, coords.y, color);
      }
    }

    if (this.tool === 'pencil' || this.tool === 'eraser' || this.tool === 'line' || this.tool === 'rect') {
      this.pushHistory();
      this.updateCodePreview();
    }

    this.isMouseDown = false;
    this.dragStart = null;
    this.lastDrawnPixel = null;
    this.render();
  }

  private setPixel(x: number, y: number, color: string): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.grid[y][x] = color;
    }
  }

  /**
   * Bresenham line algorithm
   */
  private drawLine(x0: number, y0: number, x1: number, y1: number, color: string): void {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let cx = x0;
    let cy = y0;

    while (true) {
      this.setPixel(cx, cy, color);
      if (cx === x1 && cy === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        cx += sx;
      }
      if (e2 < dx) {
        err += dx;
        cy += sy;
      }
    }
  }

  /**
   * Rectangle outline drawing
   */
  private drawRect(x0: number, y0: number, x1: number, y1: number, color: string): void {
    const minX = Math.min(x0, x1);
    const maxX = Math.max(x0, x1);
    const minY = Math.min(y0, y1);
    const maxY = Math.max(y0, y1);

    for (let x = minX; x <= maxX; x++) {
      this.setPixel(x, minY, color);
      this.setPixel(x, maxY, color);
    }
    for (let y = minY; y <= maxY; y++) {
      this.setPixel(minX, y, color);
      this.setPixel(maxX, y, color);
    }
  }

  /**
   * Flood fill (Paint Bucket)
   */
  private floodFill(startX: number, startY: number, targetColor: string): void {
    const sourceColor = this.grid[startY][startX];
    if (sourceColor === targetColor) return;

    const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { x, y } = queue.pop()!;
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;
      if (this.grid[y][x] !== sourceColor) continue;

      this.grid[y][x] = targetColor;

      queue.push({ x: x + 1, y });
      queue.push({ x: x - 1, y });
      queue.push({ x, y: y + 1 });
      queue.push({ x, y: y - 1 });
    }
  }

  /**
   * Renders transient preview of tools (line/rect) during drag
   */
  private renderToolOverlay(start: { x: number; y: number }, end: { x: number; y: number }, color: string): void {
    this.editorCtx.fillStyle = color || 'rgba(255,255,255,0.7)';
    if (this.tool === 'line') {
      const dx = Math.abs(end.x - start.x);
      const dy = Math.abs(end.y - start.y);
      const sx = start.x < end.x ? 1 : -1;
      const sy = start.y < end.y ? 1 : -1;
      let err = dx - dy;
      let cx = start.x;
      let cy = start.y;
      while (true) {
        this.editorCtx.fillRect(cx * this.zoom, cy * this.zoom, this.zoom, this.zoom);
        if (cx === end.x && cy === end.y) break;
        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          cx += sx;
        }
        if (e2 < dx) {
          err += dx;
          cy += sy;
        }
      }
    } else if (this.tool === 'rect') {
      const minX = Math.min(start.x, end.x);
      const maxX = Math.max(start.x, end.x);
      const minY = Math.min(start.y, end.y);
      const maxY = Math.max(start.y, end.y);

      for (let x = minX; x <= maxX; x++) {
        this.editorCtx.fillRect(x * this.zoom, minY * this.zoom, this.zoom, this.zoom);
        this.editorCtx.fillRect(x * this.zoom, maxY * this.zoom, this.zoom, this.zoom);
      }
      for (let y = minY; y <= maxY; y++) {
        this.editorCtx.fillRect(minX * this.zoom, y * this.zoom, this.zoom, this.zoom);
        this.editorCtx.fillRect(maxX * this.zoom, y * this.zoom, this.zoom, this.zoom);
      }
    }
  }

  /**
   * Renders the editor canvas with checkerboard and pixel grid
   */
  public render(): void {
    const ctx = this.editorCtx;
    const z = this.zoom;

    // 1. Draw transparency checkerboard pattern
    const checkSize = Math.max(4, Math.floor(z / 2));
    const totalCols = Math.ceil(this.editorCanvas.width / checkSize);
    const totalRows = Math.ceil(this.editorCanvas.height / checkSize);

    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#1e2230' : '#282d40';
        ctx.fillRect(c * checkSize, r * checkSize, checkSize, checkSize);
      }
    }

    // 2. Draw pixels
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const color = this.grid[y][x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x * z, y * z, z, z);
        }
      }
    }

    // 3. Draw grid lines (subtle border)
    if (this.showGrid && z >= 6) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= this.width; x++) {
        ctx.moveTo(x * z + 0.5, 0);
        ctx.lineTo(x * z + 0.5, this.height * z);
      }
      for (let y = 0; y <= this.height; y++) {
        ctx.moveTo(0, y * z + 0.5);
        ctx.lineTo(this.width * z, y * z + 0.5);
      }
      ctx.stroke();
    }

    // 4. Update 3x3 Preview Canvas
    this.render3x3Preview();
  }

  /**
   * Renders 3x3 seamless tiling preview
   */
  private render3x3Preview(): void {
    const ctx = this.previewCtx;
    const tileW = this.width;
    const tileH = this.height;

    // Create an offscreen 1:1 canvas for the current tile
    const offscreen = document.createElement('canvas');
    offscreen.width = tileW;
    offscreen.height = tileH;
    const offCtx = offscreen.getContext('2d')!;

    for (let y = 0; y < tileH; y++) {
      for (let x = 0; x < tileW; x++) {
        const color = this.grid[y][x];
        if (color) {
          offCtx.fillStyle = color;
          offCtx.fillRect(x, y, 1, 1);
        }
      }
    }

    // Clear preview canvas
    ctx.clearRect(0, 0, 96, 96);
    // Draw 3x3 tiles scaled to 32x32 each
    for (let ty = 0; ty < 3; ty++) {
      for (let tx = 0; tx < 3; tx++) {
        ctx.drawImage(offscreen, tx * 32, ty * 32, 32, 32);
      }
    }
  }

  /**
   * Loads an existing tile from AssetManager into the canvas grid
   */
  public loadTilePreset(presetName: string): void {
    const am = AssetManager.getInstance();
    let sprite: Sprite | null = null;

    switch (presetName) {
      case 'floor':
        sprite = am.floorSprite;
        break;
      case 'wall':
        sprite = am.testSprite;
        break;
      case 'wallTop':
        sprite = am.wallTopSprite;
        break;
      case 'pillar':
        sprite = am.pillarSprite;
        break;
      case 'doorClosed':
        sprite = am.doorClosedSprite;
        break;
      case 'doorOpen':
        sprite = am.doorOpenSprite;
        break;
      case 'key':
        sprite = am.keySprite;
        break;
    }

    if (!sprite) return;

    // Draw sprite to temporary 32x32 canvas and read pixels
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.width;
    tempCanvas.height = this.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.imageSmoothingEnabled = false;

    sprite.draw(tempCtx, 0, 0, this.width, this.height);

    const imgData = tempCtx.getImageData(0, 0, this.width, this.height).data;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = (y * this.width + x) * 4;
        const r = imgData[idx];
        const g = imgData[idx + 1];
        const b = imgData[idx + 2];
        const a = imgData[idx + 3];

        if (a < 10) {
          this.grid[y][x] = '';
        } else {
          // Convert to #hex
          const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
          this.grid[y][x] = hex;
        }
      }
    }

    this.pushHistory();
    this.render();
    this.updateCodePreview();
  }

  /**
   * Generates compressed, clean TypeScript code ready to paste into src/engine/graphics/tiles/
   * or directly into the codebase using OOP inheritance (BaseTile).
   */
  public generateTypeScriptCode(): string {
    // 1. Check if background is mostly uniform
    const colorCounts: Record<string, number> = {};
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const c = this.grid[y][x];
        if (c) {
          colorCounts[c] = (colorCounts[c] || 0) + 1;
        }
      }
    }

    let dominantColor = '';
    let maxCount = 0;
    for (const [col, count] of Object.entries(colorCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantColor = col;
      }
    }

    const lines: string[] = [];
    lines.push(`import { BaseTile } from './BaseTile.ts';`);
    lines.push(``);
    lines.push(`/**`);
    lines.push(` * Tile Personalizado (${this.width}x${this.height}) generado con Tile Studio (MS Paint XP)`);
    lines.push(` * Guarda este archivo en: src/engine/graphics/tiles/CustomTileGenerated.ts`);
    lines.push(` * Y regístralo en TileFactory con:`);
    lines.push(` *   TileFactory.registerTile('mi_tile', CustomTileGenerated);`);
    lines.push(` */`);
    lines.push(`export class CustomTileGenerated extends BaseTile {`);
    lines.push(`  public readonly id = 'custom_${Date.now().toString().slice(-4)}';`);
    lines.push(`  public readonly name = 'Tile Personalizado';`);
    lines.push(``);
    lines.push(`  public draw(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {`);

    // If dominant color covers > 40% of the tile, fill entire base first
    const hasBaseFill = dominantColor && maxCount > (this.width * this.height * 0.4);
    if (hasBaseFill) {
      lines.push(`    // 1. Color base de fondo`);
      lines.push(`    this.pixel(ctx, ox, oy, 0, 0, '${dominantColor}', this.size, this.size);`);
      lines.push(``);
      lines.push(`    // 2. Detalles y píxeles`);
    } else {
      lines.push(`    // Píxeles del tile`);
    }

    // Horizontal run-length grouping
    for (let y = 0; y < this.height; y++) {
      let x = 0;
      while (x < this.width) {
        const color = this.grid[y][x];
        if (!color || (hasBaseFill && color === dominantColor)) {
          x++;
          continue;
        }

        // Count contiguous matching pixels
        let runLen = 1;
        while (x + runLen < this.width && this.grid[y][x + runLen] === color) {
          runLen++;
        }

        if (runLen > 1) {
          lines.push(`    this.pixel(ctx, ox, oy, ${x}, ${y}, '${color}', ${runLen}, 1);`);
        } else {
          lines.push(`    this.pixel(ctx, ox, oy, ${x}, ${y}, '${color}');`);
        }

        x += runLen;
      }
    }

    lines.push(`  }`);
    lines.push(`}`);
    return lines.join('\n');
  }

  public updateCodePreview(): void {
    if (this.codeOutput) {
      this.codeOutput.value = this.generateTypeScriptCode();
    }
  }

  public async copyTypeScriptCode(): Promise<void> {
    const code = this.generateTypeScriptCode();
    try {
      await navigator.clipboard.writeText(code);
      this.showToast('¡Código TypeScript (Clase BaseTile) copiado al portapapeles!');
    } catch {
      this.codeOutput.select();
      document.execCommand('copy');
      this.showToast('¡Código copiado al portapapeles!');
    }
  }

  public async copyDataURL(): Promise<void> {
    const offscreen = document.createElement('canvas');
    offscreen.width = this.width;
    offscreen.height = this.height;
    const ctx = offscreen.getContext('2d')!;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const color = this.grid[y][x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    const dataUrl = offscreen.toDataURL('image/png');
    try {
      await navigator.clipboard.writeText(dataUrl);
      this.showToast('¡Data URL Base64 copiado al portapapeles!');
    } catch {
      prompt('Copia tu Data URL:', dataUrl);
    }
  }

  public downloadPNG(): void {
    const offscreen = document.createElement('canvas');
    offscreen.width = this.width;
    offscreen.height = this.height;
    const ctx = offscreen.getContext('2d')!;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const color = this.grid[y][x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    const link = document.createElement('a');
    link.download = `custom-tile-${this.width}x${this.height}.png`;
    link.href = offscreen.toDataURL('image/png');
    link.click();
    this.showToast('¡Descarga de PNG iniciada!');
  }

  /**
   * Directly updates the active AssetManager instance with the edited tile in real time!
   * Mutates the existing Sprite in-place so TileMap and all entities reflect it instantly.
   */
  public applyToLiveGame(): void {
    const targetSelect = this.container.querySelector('#xp-target-sprite') as HTMLSelectElement;
    const targetProp = targetSelect.value as
      | 'floorSprite'
      | 'wallSprite'
      | 'wallTopSprite'
      | 'pillarSprite'
      | 'doorClosedSprite'
      | 'doorOpenSprite'
      | 'keySprite';

    const offscreen = document.createElement('canvas');
    offscreen.width = this.width;
    offscreen.height = this.height;
    const ctx = offscreen.getContext('2d')!;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const color = this.grid[y][x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    const am = AssetManager.getInstance();
    // Update existing Sprite object in-place
    am.updateTileSprite(targetProp, offscreen, this.width, this.height);

    const friendlyName = targetSelect.options[targetSelect.selectedIndex]?.text || targetProp;
    this.showToast(`⚡ ¡${friendlyName} actualizado en vivo! Vuelve a la pestaña Juego.`);
  }

  private showToast(msg: string): void {
    this.copyToast.textContent = msg;
    this.copyToast.classList.add('visible');
    setTimeout(() => {
      this.copyToast.classList.remove('visible');
    }, 2800);
  }
}
