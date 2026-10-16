/**
 * Vector2D represents a 2-dimensional vector with comprehensive vector arithmetic.
 */
export class Vector2D {
  public x: number;
  public y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  public static zero(): Vector2D {
    return new Vector2D(0, 0);
  }

  public clone(): Vector2D {
    return new Vector2D(this.x, this.y);
  }

  public set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  public copyFrom(other: Vector2D): this {
    this.x = other.x;
    this.y = other.y;
    return this;
  }

  public add(v: Vector2D): Vector2D {
    return new Vector2D(this.x + v.x, this.y + v.y);
  }

  public addSelf(v: Vector2D): this {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  public subtract(v: Vector2D): Vector2D {
    return new Vector2D(this.x - v.x, this.y - v.y);
  }

  public subtractSelf(v: Vector2D): this {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  public multiply(scalar: number): Vector2D {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }

  public multiplySelf(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  public magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  public magnitude(): number {
    return Math.sqrt(this.magnitudeSquared());
  }

  public normalize(): Vector2D {
    const mag = this.magnitude();
    if (mag === 0) {
      return Vector2D.zero();
    }
    return new Vector2D(this.x / mag, this.y / mag);
  }

  public normalizeSelf(): this {
    const mag = this.magnitude();
    if (mag > 0) {
      this.x /= mag;
      this.y /= mag;
    }
    return this;
  }

  public distanceTo(other: Vector2D): number {
    return this.subtract(other).magnitude();
  }

  public isZero(): boolean {
    return this.x === 0 && this.y === 0;
  }
}
