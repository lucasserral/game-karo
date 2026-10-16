import { Sprite } from './Sprite.ts';

export interface AnimationClip {
  name: string;
  frames: Sprite[];
  frameDuration: number; // in seconds
  loop?: boolean;
}

/**
 * Controller for multi-frame animations with state switching.
 */
export class AnimatedSprite {
  private clips = new Map<string, AnimationClip>();
  private currentClip: AnimationClip | null = null;
  private currentFrameIndex = 0;
  private timer = 0;

  constructor(clips?: AnimationClip[]) {
    if (clips) {
      for (const clip of clips) {
        this.addClip(clip);
      }
    }
  }

  public addClip(clip: AnimationClip): void {
    this.clips.set(clip.name, clip);
    if (!this.currentClip) {
      this.play(clip.name);
    }
  }

  public play(name: string, restartIfSame = false): void {
    if (this.currentClip && this.currentClip.name === name && !restartIfSame) {
      return;
    }

    const clip = this.clips.get(name);
    if (!clip) {
      console.warn(`[AnimatedSprite] Clip not found: ${name}`);
      return;
    }

    this.currentClip = clip;
    this.currentFrameIndex = 0;
    this.timer = 0;
  }

  public getCurrentClipName(): string | null {
    return this.currentClip ? this.currentClip.name : null;
  }

  public update(dt: number): void {
    if (!this.currentClip || this.currentClip.frames.length <= 1) {
      return;
    }

    this.timer += dt;
    if (this.timer >= this.currentClip.frameDuration) {
      const framesPassed = Math.floor(this.timer / this.currentClip.frameDuration);
      this.timer %= this.currentClip.frameDuration;

      const totalFrames = this.currentClip.frames.length;
      const isLooping = this.currentClip.loop ?? true;

      if (isLooping) {
        this.currentFrameIndex = (this.currentFrameIndex + framesPassed) % totalFrames;
      } else {
        this.currentFrameIndex = Math.min(this.currentFrameIndex + framesPassed, totalFrames - 1);
      }
    }
  }

  public getCurrentSprite(): Sprite | null {
    if (!this.currentClip || this.currentClip.frames.length === 0) {
      return null;
    }
    return this.currentClip.frames[this.currentFrameIndex] ?? null;
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    dWidth?: number,
    dHeight?: number,
    flipX = false
  ): void {
    const sprite = this.getCurrentSprite();
    if (sprite) {
      sprite.draw(ctx, dx, dy, dWidth, dHeight, flipX);
    }
  }
}
