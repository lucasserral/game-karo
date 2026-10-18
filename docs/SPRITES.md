# 🎨 Guía de Sprites, Tiles y Gráficos en el Motor

Esta guía explica en detalle cómo funcionan los sprites, cómo se renderizan los elementos del mundo (**suelo, paredes, pilares, puertas y llaves**) y cómo puedes cambiarlos o reemplazarlos por tus propias imágenes.

---

## 📑 Índice
1. [¿Cómo funcionan los Sprites en el motor?](#1-cómo-funcionan-los-sprites-en-el-motor)
2. [¿Cómo se dibujan las paredes, el suelo y los objetos actualmente?](#2-cómo-se-dibujan-las-paredes-el-suelo-y-los-objetos-actualmente)
3. [¿En qué archivos se conectan los sprites con los objetos?](#3-en-qué-archivos-se-conectan-los-sprites-con-los-objetos)
4. [¿Cómo cambiar o reemplazar los gráficos?](#4-cómo-cambiar-o-reemplazar-los-gráficos)
   - [Opción A: Reemplazar con una imagen de Tileset (Recomendada)](#opción-a-reemplazar-con-una-imagen-de-tileset-png)
   - [Opción B: Usar imágenes PNG individuales](#opción-b-usar-imágenes-png-individuales)
   - [Opción C: Modificar los colores y patrones generados en código](#opción-c-modificar-el-código-de-dibujo-en-assetmanagerts)

---

## 1. ¿Cómo funcionan los Sprites en el motor?

El motor utiliza el estándar de la industria para gráficos 2D en Canvas: **recortes rectangulares de texturas**.

Toda la lógica de dibujo se basa en la clase [`Sprite`](file:///Users/lucas/dev/projects/game-karo/src/engine/graphics/Sprite.ts):

```typescript
export class Sprite {
  constructor(
    public source: CanvasImageSource, // Una imagen (HTMLImageElement) o un Canvas offscreen
    public sx: number,                // Coordenada X donde empieza el recorte en la imagen
    public sy: number,                // Coordenada Y donde empieza el recorte en la imagen
    public sWidth: number,            // Ancho del recorte en la imagen (ej: 32px)
    public sHeight: number            // Alto del recorte en la imagen (ej: 32px)
  ) {}

  public draw(ctx: CanvasRenderingContext2D, dx: number, dy: number, dWidth?: number, dHeight?: number) {
    // Llama directamente a la API nativa de Canvas:
    ctx.drawImage(this.source, this.sx, this.sy, this.sWidth, this.sHeight, dx, dy, dWidth, dHeight);
  }
}
```

- **`source`**: La hoja de texturas que contiene uno o más sprites.
- **`(sx, sy, sWidth, sHeight)`**: El "cuadrante" que recorta el gráfico exacto (Source Rectangle).
- **`(dx, dy, dWidth, dHeight)`**: La posición y tamaño donde se dibuja en el mundo del juego (Destination).

---

## 2. ¿Cómo se dibujan las paredes, el suelo y los objetos actualmente?

Actualmente, solo el **héroe** proviene de una imagen externa (`public/sprites/hero.png`). 

Actualmente, el **héroe** proviene de una imagen externa (`public/sprites/hero.png`). 

Los elementos del entorno (**suelo, paredes, pilares, puertas y llaves**) están desacoplados en objetos TypeScript individuales dentro de la carpeta [`src/engine/graphics/tiles/`](file:///Users/lucas/dev/projects/game-karo/src/engine/graphics/tiles/) utilizando **Herencia** (`BaseTile`) y el patrón de diseño **Factory** ([`TileFactory.ts`](file:///Users/lucas/dev/projects/game-karo/src/engine/graphics/tiles/TileFactory.ts)).

### Estructura de la carpeta `tiles/`:
- [`BaseTile.ts`](file:///Users/lucas/dev/projects/game-karo/src/engine/graphics/tiles/BaseTile.ts): Clase base abstracta con utilidades `pixel()`, `renderToCanvas()` y `toSprite()`.
- [`FloorTile.ts`](file:///Users/lucas/dev/projects/game-karo/src/engine/graphics/tiles/FloorTile.ts): Hereda de `BaseTile` y renderiza el suelo de mazmorra.
- [`WallTile.ts`](file:///Users/lucas/dev/projects/game-karo/src/engine/graphics/tiles/WallTile.ts): Hereda de `BaseTile` y renderiza el bloque de piedra con biseles.
- [`WallTopTile.ts`](file:///Users/lucas/dev/projects/game-karo/src/engine/graphics/tiles/WallTopTile.ts): Hereda de `BaseTile` y renderiza la cornisa superior.
- [`PillarTile.ts`](file:///Users/lucas/dev/projects/game-karo/src/engine/graphics/tiles/PillarTile.ts): Hereda de `BaseTile` y renderiza el pilar con gema.
- [`DoorClosedTile.ts`](file:///Users/lucas/dev/projects/game-karo/src/engine/graphics/tiles/DoorClosedTile.ts): Hereda de `BaseTile` y renderiza la puerta cerrada con cerrojo.
- [`DoorOpenTile.ts`](file:///Users/lucas/dev/projects/game-karo/src/engine/graphics/tiles/DoorOpenTile.ts): Hereda de `BaseTile` y renderiza el umbral abierto.
- [`KeyTile.ts`](file:///Users/lucas/dev/projects/game-karo/src/engine/graphics/tiles/KeyTile.ts): Hereda de `BaseTile` y renderiza la llave dorada.
- [`CustomTile.ts`](file:///Users/lucas/dev/projects/game-karo/src/engine/graphics/tiles/CustomTile.ts): Permite instanciar tiles personalizados a partir de matrices de píxeles.
- [`TileFactory.ts`](file:///Users/lucas/dev/projects/game-karo/src/engine/graphics/tiles/TileFactory.ts): Fábrica extensible con registro en tiempo de ejecución (`TileFactory.createTile('floor')`).

### El Canvas interno de texturas (`AssetManager.ts`):
Al iniciar, `AssetManager` invoca a `TileFactory` para dibujar cada celda en el canvas de texturas de 128×192:

```typescript
// En AssetManager.generateSpritesheet():
const s = this.tileSize;
TileFactory.createTile('floor', s).draw(ctx, 0 * s, 4 * s);
TileFactory.createTile('wall', s).draw(ctx, 1 * s, 4 * s);
TileFactory.createTile('wallTop', s).draw(ctx, 2 * s, 4 * s);
TileFactory.createTile('pillar', s).draw(ctx, 3 * s, 4 * s);
TileFactory.createTile('doorClosed', s).draw(ctx, 0 * s, 5 * s);
TileFactory.createTile('doorOpen', s).draw(ctx, 1 * s, 5 * s);
TileFactory.createTile('key', s).draw(ctx, 2 * s, 5 * s);
```

Luego, en `sliceSprites()`, se generan los objetos `Sprite` referenciados por el mapa y las entidades. Si en Tile Studio se usa **"⚡ Aplicar Ahora"**, el método `AssetManager.updateTileSprite(target, canvas)` muta la fuente gráfica del `Sprite` en caliente para que el cambio se refleje en vivo al instante sin recrear el mundo.

---

## 3. ¿En qué archivos se conectan los sprites con los objetos?

El ensamblado ocurre en [`src/engine/world/LevelBuilder.ts`](file:///Users/lucas/dev/projects/game-karo/src/engine/world/LevelBuilder.ts):

1. **El mapa de suelo**:
   ```typescript
   // Se pasa el sprite de suelo al TileMap:
   const tileMap = new TileMap(cols, rows, tileSize, assets.floorSprite);
   ```
2. **Las paredes y pilares**:
   ```typescript
   case '#':
     // Instancia una pared física con el sprite de pared:
     world.addEntity(new StaticObstacle(x, y, assets.wallSprite, 'wall', tileSize, tileSize));
     break;
   case 'P':
     // Instancia un pilar físico con el sprite de pilar:
     world.addEntity(new StaticObstacle(x, y, assets.pillarSprite, 'pillar', tileSize, tileSize));
     break;
   ```
3. **Las puertas y llaves**:
   ```typescript
   case 'D':
     // Puerta con ambos sprites (cerrada y abierta):
     world.addEntity(new Door(x, y, assets.doorClosedSprite, assets.doorOpenSprite, 'golden_key'));
     break;
   case 'K':
     // Llave coleccionable:
     world.addEntity(new KeyItem(x, y, assets.keySprite, 'golden_key', 'Llave Dorada'));
     break;
   ```

Cada una de estas clases (`StaticObstacle`, `Door`, `KeyItem`) hereda de `GameObject` y en su método `render()` simplemente llaman a `this.sprite.draw(ctx, this.position.x, this.position.y)`.

---

## 4. ¿Cómo cambiar o reemplazar los gráficos?

Tienes 3 formas de personalizar estos gráficos según tus necesidades:

---

### Opción A: Reemplazar con una imagen de Tileset `.png` *(Recomendada)*

Si descargas o tienes una hoja de tiles tipo RPG (por ejemplo `tileset.png` de 32×32 o 16×16 por celda):

1. **Guarda tu imagen** en:
   ```
   public/sprites/tileset.png
   ```

2. **Cárgala en [`AssetManager.ts`](file:///Users/lucas/dev/projects/game-karo/src/engine/graphics/AssetManager.ts)**:
   Puedes añadir este método en `AssetManager`:
   ```typescript
   public async loadCustomTileset(url = '/sprites/tileset.png', tileSize = 32): Promise<void> {
     const sheet = await SpriteSheet.load(url, tileSize, tileSize);

     // Asignar según las coordenadas (columna, fila) de tu imagen:
     this.floorSprite      = sheet.getSprite(0, 0); // Columna 0, Fila 0
     this.wallSprite       = sheet.getSprite(1, 0); // Columna 1, Fila 0
     this.pillarSprite     = sheet.getSprite(2, 0); // Columna 2, Fila 0
     this.doorClosedSprite = sheet.getSprite(0, 1); // Columna 0, Fila 1
     this.doorOpenSprite   = sheet.getSprite(1, 1); // Columna 1, Fila 1
     this.keySprite        = sheet.getSprite(2, 1); // Columna 2, Fila 1
   }
   ```

3. **Llama a `loadCustomTileset()` en [`main.ts`](file:///Users/lucas/dev/projects/game-karo/src/main.ts)** antes de crear el mundo:
   ```typescript
   await AssetManager.getInstance().loadCustomTileset('/sprites/tileset.png');
   ```

---

### Opción B: Usar imágenes PNG individuales

Si tienes imágenes separadas (ej: `wall.png`, `floor.png`, `key.png`):

1. Colócalas en `public/sprites/`:
   - `public/sprites/wall.png`
   - `public/sprites/floor.png`
   - `public/sprites/key.png`

2. En [`AssetManager.ts`](file:///Users/lucas/dev/projects/game-karo/src/engine/graphics/AssetManager.ts), usa `SpriteSheet.load` para cada una:
   ```typescript
   public async loadSeparateAssets(): Promise<void> {
     const wallImg = await SpriteSheet.load('/sprites/wall.png', 32, 32);
     this.wallSprite = wallImg.getSprite(0, 0);

     const floorImg = await SpriteSheet.load('/sprites/floor.png', 32, 32);
     this.floorSprite = floorImg.getSprite(0, 0);
   }
   ```

---

### Opción C: Modificar el código de dibujo en `AssetManager.ts`

Si quieres cambiar los colores o estilos de las paredes y el suelo directamente en código:

Abre [`src/engine/graphics/AssetManager.ts`](file:///Users/lucas/dev/projects/game-karo/src/engine/graphics/AssetManager.ts) y busca la sección `generateSpritesheet()`:

- **Cambiar color de suelo** (líneas 95–114):
  ```typescript
  // Cambia el color base '#2b2a3a' por el color que gustes (ej. '#1a3a2a' para césped):
  pixel(fx, fy, '#1a3a2a', 32, 32);
  ```
- **Cambiar color de pared** (líneas 115–133):
  ```typescript
  // Cambia el color '#4a4f5f' por ladrillos rojizos '#7c2d12' o madera '#78350f':
  pixel(wx, wy, '#7c2d12', 32, 32);
  ```
- **Cambiar la gema del pilar** (línea 150):
  ```typescript
  // Cambia '#38bdf8' (azul) por '#ef4444' (rubí rojo) o '#22c55e' (esmeralda verde):
  pixel(px + 12, py + 14, '#ef4444', 8, 6);
  ```

---

## 5. Resumen de Flujo de Renderizado

```
+------------------------------------+
|  Archivo de Imagen o Canvas Memory |
+------------------------------------+
                 │
                 ▼
+------------------------------------+
|               Sprite               |  (sx, sy, sWidth, sHeight)
+------------------------------------+
                 │
                 ▼
+------------------------------------+
|      Entidades del Juego           |
| (TileMap, StaticObstacle, Door...) |
+------------------------------------+
                 │
                 ▼
+------------------------------------+
|        World.render()              |  (Ordenado por Z-Index y profundidad Y)
+------------------------------------+
                 │
                 ▼
+------------------------------------+
|     HTML5 Canvas en Pantalla       |
+------------------------------------+
```
