import { Actor } from './Actor.ts';
import type { InputManager } from '../core/InputManager.ts';
import type { AnimatedSprite } from '../graphics/AnimatedSprite.ts';
import { AssetManager } from '../graphics/AssetManager.ts';
import type { Camera } from '../core/Camera.ts';

/**
 * Player entity controlled via WASD keyboard input.
 * Holds inventory for keys and manages directional animations.
 */
export class Player extends Actor {
  private inputManager: InputManager;
  private animator: AnimatedSprite;
  public inventoryKeys = new Set<string>();

  // Feedback notifications (e.g. "¡Recogiste la Llave Dorada!", "Puerta abierta")
  public lastNotification: string | null = null;
  private notificationTimer = 0;

  constructor(x: number, y: number, inputManager: InputManager) {
    super(x, y, 32, 32, 140, 20); // 140px/sec movement speed, zIndex 20
    this.inputManager = inputManager;
    this.animator = AssetManager.getInstance().createPlayerAnimator();
  }

  public addKey(keyId: string): void {
    this.inventoryKeys.add(keyId);
    this.setNotification(`Llave obtenida: ${keyId.toUpperCase()}`);
  }

  public hasKey(keyId: string): boolean {
    return this.inventoryKeys.has(keyId);
  }

  public consumeKey(keyId: string): boolean {
    if (this.inventoryKeys.has(keyId)) {
      this.inventoryKeys.delete(keyId);
      return true;
    }
    return false;
  }

  public setNotification(text: string, duration = 2.5): void {
    this.lastNotification = text;
    this.notificationTimer = duration;
  }

  public override update(dt: number): void {
    // 1. Process WASD movement vector
    const moveInput = this.inputManager.getMovementVector();
    this.velocity = moveInput.multiply(this.speed);

    // 2. Update orientation & state
    this.updateOrientation(moveInput);

    // 3. Play directional animation
    const clipName = `${this.state}_${this.facingDirection}`;
    this.animator.play(clipName);
    this.animator.update(dt);

    // 4. Update notification display timer
    if (this.notificationTimer > 0) {
      this.notificationTimer -= dt;
      if (this.notificationTimer <= 0) {
        this.lastNotification = null;
      }
    }
  }

  public override render(ctx: CanvasRenderingContext2D, _camera: Camera): void {
    const x = Math.floor(this.position.x);
    const y = Math.floor(this.position.y);

    // 1. Subtle drop shadow beneath the character
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x + 16, y + 29, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Draw animated player sprite
    this.animator.draw(ctx, x, y, this.size.x, this.size.y);

    // 3. Render floating notification bubble if active
    if (this.lastNotification) {
      ctx.save();
      ctx.font = 'bold 11px system-ui, sans-serif';
      const textWidth = ctx.measureText(this.lastNotification).width;
      const bubbleX = x + 16 - textWidth / 2 - 6;
      const bubbleY = y - 18;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bubbleX, bubbleY, textWidth + 12, 16, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.fillText(this.lastNotification, x + 16, bubbleY + 12);
      ctx.restore();
    }
  }
}
