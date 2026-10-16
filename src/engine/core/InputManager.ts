import { Vector2D } from '../math/Vector2D.ts';

/**
 * Key codes that may trigger page scroll or standard browser actions.
 */
const SCROLL_PREVENT_KEYS = new Set([
  'Space',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'Tab',
]);

/**
 * InputManager manages keyboard state and prevents browser scrolling
 * whenever the game canvas is focused or active.
 */
export class InputManager {
  private activeKeys = new Set<string>();
  private justPressedKeys = new Set<string>();
  private canvas: HTMLCanvasElement;
  private hasFocus = false;
  private onFocusChangeCallbacks: Array<(focused: boolean) => void> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupListeners();
  }

  private setupListeners(): void {
    // Ensure canvas can receive keyboard focus
    if (!this.canvas.hasAttribute('tabindex')) {
      this.canvas.setAttribute('tabindex', '0');
    }

    this.canvas.addEventListener('focus', this.handleFocus);
    this.canvas.addEventListener('blur', this.handleBlur);
    window.addEventListener('blur', this.handleBlur);

    // Listen on window with capturing phase to catch keys when canvas is active
    window.addEventListener('keydown', this.handleKeyDown, { passive: false });
    window.addEventListener('keyup', this.handleKeyUp, { passive: false });

    // Focus canvas automatically on pointer down inside it
    this.canvas.addEventListener('pointerdown', () => {
      this.canvas.focus();
    });

    // Check initial focus
    this.hasFocus = document.activeElement === this.canvas;
  }

  private handleFocus = (): void => {
    this.hasFocus = true;
    this.notifyFocusChange();
  };

  private handleBlur = (): void => {
    this.hasFocus = false;
    this.activeKeys.clear();
    this.justPressedKeys.clear();
    this.notifyFocusChange();
  };

  private notifyFocusChange(): void {
    for (const callback of this.onFocusChangeCallbacks) {
      callback(this.hasFocus);
    }
  }

  public onFocusChange(callback: (focused: boolean) => void): () => void {
    this.onFocusChangeCallbacks.push(callback);
    return () => {
      this.onFocusChangeCallbacks = this.onFocusChangeCallbacks.filter((cb) => cb !== callback);
    };
  }

  public isFocused(): boolean {
    return this.hasFocus;
  }

  public focus(): void {
    this.canvas.focus();
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    // Prevent default scroll actions if canvas is focused or clicked
    const isCanvasFocused = document.activeElement === this.canvas;

    if (isCanvasFocused && SCROLL_PREVENT_KEYS.has(event.code)) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!this.activeKeys.has(event.code)) {
      this.justPressedKeys.add(event.code);
    }

    this.activeKeys.add(event.code);
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    const isCanvasFocused = document.activeElement === this.canvas;
    if (isCanvasFocused && SCROLL_PREVENT_KEYS.has(event.code)) {
      event.preventDefault();
      event.stopPropagation();
    }

    this.activeKeys.delete(event.code);
  };

  public isKeyDown(code: string): boolean {
    return this.activeKeys.has(code);
  }

  public isKeyJustPressed(code: string): boolean {
    return this.justPressedKeys.has(code);
  }

  /**
   * Resets single-frame transient input states at the end of each game tick.
   */
  public endFrame(): void {
    this.justPressedKeys.clear();
  }

  /**
   * Calculates a 2D movement vector from WASD and Arrow keys.
   * Normalized so diagonal movement doesn't give a speed boost.
   */
  public getMovementVector(): Vector2D {
    let dx = 0;
    let dy = 0;

    // Up
    if (this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp')) {
      dy -= 1;
    }
    // Down
    if (this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown')) {
      dy += 1;
    }
    // Left
    if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft')) {
      dx -= 1;
    }
    // Right
    if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) {
      dx += 1;
    }

    const vec = new Vector2D(dx, dy);
    return vec.normalize();
  }

  /**
   * Checks if the interact action ('KeyE' or 'Space') was pressed this frame.
   */
  public isInteractJustPressed(): boolean {
    return this.isKeyJustPressed('KeyE') || this.isKeyJustPressed('Space');
  }

  public destroy(): void {
    this.canvas.removeEventListener('focus', this.handleFocus);
    this.canvas.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.activeKeys.clear();
    this.justPressedKeys.clear();
  }
}
