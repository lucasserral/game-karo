import { GameObject } from '../core/GameObject.ts';
import { Actor } from '../entities/Actor.ts';
import { Player } from '../entities/Player.ts';
import { isCollidable } from '../core/ICollidable.ts';
import { isInteractive, type IInteractive } from '../core/IInteractive.ts';
import type { TileMap } from './TileMap.ts';
import type { Camera } from '../core/Camera.ts';
import type { CollisionMask } from './CollisionMask.ts';
import type { BoundingBox } from '../math/BoundingBox.ts';

/**
 * World maintains the active scene, handles decoupled physical collisions
 * via both the pixel-perfect CollisionMask and dynamic entities,
 * manages entity lifecycles, and performs depth-sorted rendering.
 */
export class World {
  public entities: GameObject[] = [];
  public player: Player;
  public tileMap: TileMap;
  public collisionMask: CollisionMask | null = null;
  public showCollisionDebug = false;
  public showEntityDebug = true;

  constructor(tileMap: TileMap, player: Player) {
    this.tileMap = tileMap;
    this.player = player;
    this.addEntity(player);
  }

  public addEntity(entity: GameObject): void {
    this.entities.push(entity);
  }

  public removeEntity(entity: GameObject): void {
    const idx = this.entities.indexOf(entity);
    if (idx !== -1) {
      this.entities.splice(idx, 1);
    }
  }

  /**
   * Finds the closest interactive entity within interaction range.
   */
  public findNearestInteractive(player: Player): (GameObject & IInteractive) | null {
    let closest: (GameObject & IInteractive) | null = null;
    let minDistance = Infinity;

    for (const entity of this.entities) {
      if (entity === player || entity.isDestroyed) {
        continue;
      }

      if (isInteractive(entity) && entity.canInteract(player)) {
        const dist = player.getCenter().distanceTo(entity.getCenter());
        if (dist < minDistance) {
          minDistance = dist;
          closest = entity as GameObject & IInteractive;
        }
      }
    }

    return closest;
  }

  /**
   * Comprueba si una caja de colisión intersecta alguna entidad sólida activa (como puertas cerradas).
   */
  private checkSolidEntityCollision(actor: Actor, box: BoundingBox): boolean {
    for (const other of this.entities) {
      if (other === actor || other.isDestroyed || !isCollidable(other)) {
        continue;
      }
      if (other.isSolid() && box.intersects(other.getCollider())) {
        return true;
      }
    }
    return false;
  }

  /**
   * Resolves physical collision with decoupled X and Y axis testing.
   * Guarantees smooth wall sliding and pixel-flush positioning using the CollisionMask.
   */
  private resolveActorMovement(actor: Actor, dt: number): void {
    const dx = actor.velocity.x * dt;
    const dy = actor.velocity.y * dt;

    if (dx === 0 && dy === 0) {
      return;
    }

    // --- 1. X-AXIS MOVEMENT ---
    if (dx !== 0) {
      const prevX = actor.position.x;
      actor.position.x += dx;
      const currentBox = actor.getCollider();

      let collided = false;

      // 1a. Comprobación contra la Máscara de Colisión de la imagen
      if (this.collisionMask && this.collisionMask.checkAABBCollision(currentBox)) {
        collided = true;
      }

      // 1b. Comprobación contra entidades colisionables (puertas cerradas, cofres, etc.)
      if (!collided) {
        for (const other of this.entities) {
          if (other === actor || other.isDestroyed || !isCollidable(other)) continue;
          const otherBox = other.getCollider();
          if (currentBox.intersects(otherBox)) {
            if (other.onCollision) other.onCollision(actor, dx > 0 ? -1 : 1, 0);
            if (other.isSolid()) {
              collided = true;
              break;
            }
          }
        }
      }

      // 1c. Si colisionó, ajustar al píxel exacto contra la pared para deslizamiento perfecto
      if (collided) {
        actor.position.x = prevX;
        const step = Math.sign(dx);
        const maxSteps = Math.ceil(Math.abs(dx));
        for (let s = 0; s < maxSteps; s++) {
          actor.position.x += step;
          const box = actor.getCollider();
          const hit =
            (this.collisionMask && this.collisionMask.checkAABBCollision(box)) ||
            this.checkSolidEntityCollision(actor, box);
          if (hit) {
            actor.position.x -= step;
            break;
          }
        }
      }
    }

    // --- 2. Y-AXIS MOVEMENT ---
    if (dy !== 0) {
      const prevY = actor.position.y;
      actor.position.y += dy;
      const currentBox = actor.getCollider();

      let collided = false;

      // 2a. Comprobación contra la Máscara de Colisión de la imagen
      if (this.collisionMask && this.collisionMask.checkAABBCollision(currentBox)) {
        collided = true;
      }

      // 2b. Comprobación contra entidades colisionables
      if (!collided) {
        for (const other of this.entities) {
          if (other === actor || other.isDestroyed || !isCollidable(other)) continue;
          const otherBox = other.getCollider();
          if (currentBox.intersects(otherBox)) {
            if (other.onCollision) other.onCollision(actor, 0, dy > 0 ? -1 : 1);
            if (other.isSolid()) {
              collided = true;
              break;
            }
          }
        }
      }

      // 2c. Si colisionó, ajustar al píxel exacto contra la pared
      if (collided) {
        actor.position.y = prevY;
        const step = Math.sign(dy);
        const maxSteps = Math.ceil(Math.abs(dy));
        for (let s = 0; s < maxSteps; s++) {
          actor.position.y += step;
          const box = actor.getCollider();
          const hit =
            (this.collisionMask && this.collisionMask.checkAABBCollision(box)) ||
            this.checkSolidEntityCollision(actor, box);
          if (hit) {
            actor.position.y -= step;
            break;
          }
        }
      }
    }

    // --- 3. CLAMP TO WORLD BOUNDS ---
    const minX = 0;
    const maxX = this.tileMap.worldWidth - actor.size.x;
    const minY = 0;
    const maxY = this.tileMap.worldHeight - actor.size.y;

    actor.position.x = Math.max(minX, Math.min(actor.position.x, maxX));
    actor.position.y = Math.max(minY, Math.min(actor.position.y, maxY));
  }

  public update(dt: number): void {
    // 1. Update entities
    for (const entity of this.entities) {
      if (!entity.isDestroyed) {
        entity.update(dt);

        if (entity instanceof Actor) {
          this.resolveActorMovement(entity, dt);
        }
      }
    }

    // 2. Cleanup destroyed entities
    this.entities = this.entities.filter((e) => !e.isDestroyed);
  }

  public render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    // 1. Render floor tiles o mapa ilustrado de fondo
    this.tileMap.render(ctx, camera);

    // 2. Frustum culling: filter entities in view
    const visibleEntities = this.entities.filter((entity) =>
      camera.isVisible(entity.getBounds())
    );

    // 3. Depth Sorting: sort by zIndex, then Y-sort by base position
    visibleEntities.sort((a, b) => {
      if (a.zIndex !== b.zIndex) {
        return a.zIndex - b.zIndex;
      }
      return (a.position.y + a.size.y) - (b.position.y + b.size.y);
    });

    // 4. Polymorphic render calls
    for (const entity of visibleEntities) {
      entity.render(ctx, camera);
    }

    // 5. Capa superior no interactiva (foreground / dosel / overhead)
    // Se dibuja por encima del jugador y de todas las entidades (sin colisión ni interacción).
    this.tileMap.renderForeground(ctx, camera);

    // 6. Superposición visual de depuración de máscara si está activa
    if (this.showCollisionDebug && this.collisionMask) {
      this.collisionMask.renderDebug(ctx, camera);
    }

    // 7. Bordes rojos e indicadores de tipo para objetos/entidades que no son la máscara
    if (this.showEntityDebug) {
      this.renderEntityDebug(ctx, visibleEntities);
    }
  }

  /**
   * Dibuja un borde rojo fino alrededor de los objetos interactivos y un cartel
   * con el nombre/tipo de objeto para depuración visual.
   */
  private renderEntityDebug(ctx: CanvasRenderingContext2D, visibleEntities: GameObject[]): void {
    ctx.save();
    ctx.font = 'bold 10px "Outfit", system-ui, sans-serif';
    ctx.textBaseline = 'middle';

    for (const entity of visibleEntities) {
      if (entity.isDestroyed) continue;

      // Omitir sistemas globales que abarcan todo el mapa
      if (entity.size.x >= this.tileMap.worldWidth && entity.size.y >= this.tileMap.worldHeight) {
        continue;
      }

      // Obtener el collider exacto si es colisionable, o su bounding box
      const box = isCollidable(entity) ? entity.getCollider() : entity.getBounds();
      const x = Math.floor(box.left);
      const y = Math.floor(box.top);
      const w = Math.floor(box.width);
      const h = Math.floor(box.height);

      // 1. Borde fino rojo (#ef4444)
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 0.5, y + 0.5, w, h);

      // Relleno sutil translúcido para identificar el área física del objeto
      ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
      ctx.fillRect(x + 0.5, y + 0.5, w, h);

      // 2. Determinar etiqueta legible del tipo de objeto
      const className = entity.constructor.name;
      let label = className;

      if (className === 'Player') {
        label = 'Jugador (Player)';
      } else if (className === 'WaterFountain') {
        label = 'Fuente de Agua (Fountain)';
      } else if (className === 'Fireplace') {
        label = 'Chimenea (Fireplace)';
      } else if (className === 'Footbridge') {
        label = 'Puente (Footbridge)';
      } else if (className === 'Door') {
        const d = entity as any;
        label = `Puerta: ${d.doorName || 'Cerrada'} [${d.isUnlocked ? 'Abierta' : 'Cerrada'}]`;
      } else if (className === 'KeyItem') {
        const k = entity as any;
        label = `Llave: ${k.keyName || k.keyId}`;
      } else if (className === 'KitchenStove') {
        label = 'Fogón (Stove)';
      } else if (className === 'BedEntity') {
        const b = entity as any;
        label = `Cama: ${b.bedName || 'Dormitorio'}`;
      } else if (className === 'BookshelfEntity') {
        const bk = entity as any;
        label = `Librería: ${bk.bookTitle || 'Estudio'}`;
      } else if (className === 'TreasureChest') {
        const c = entity as any;
        label = `Cofre [${c.isOpen ? 'Abierto' : 'Cerrado'}]`;
      } else if (className === 'PicnicTable') {
        label = 'Mesa de Picnic';
      } else if (className === 'GardenBench') {
        label = 'Banco de Jardín';
      } else if (className === 'BeachShore') {
        label = 'Costa / Mar';
      } else if (className === 'TreeEntity') {
        label = 'Árbol (Tronco)';
      }

      // 3. Renderizar etiqueta flotante sobre el objeto
      const textWidth = ctx.measureText(label).width;
      const badgeW = textWidth + 8;
      const badgeH = 15;
      const badgeX = Math.floor(x + (w - badgeW) / 2);
      const badgeY = y - badgeH - 3;

      // Fondo oscuro semitransparente con borde rojo
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 3);
      ctx.fill();
      ctx.stroke();

      // Texto blanco
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(label, badgeX + badgeW / 2, badgeY + badgeH / 2);
    }

    ctx.restore();
  }
}
