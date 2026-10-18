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

Los elementos del entorno (**suelo, paredes, pilares, puertas y llaves**) se generan automáticamente en un **Canvas offscreen en memoria** dentro de [`AssetManager.ts`](file:///Users/lucas/dev/projects/game-karo/src/engine/graphics/AssetManager.ts). Esto se hizo para que el juego fuese 100% jugable de inmediato sin depender de archivos de texturas externos.

### El Canvas interno de texturas (`AssetManager.ts`):
Al iniciar, `AssetManager` crea una textura en memoria de 128×192 píxeles dividida en celdas de 32×32:

```
+------------+------------+------------+------------+
| (0, 4)     | (1, 4)     | (2, 4)     | (3, 4)     |
|   SUELO    |   PARED    | BORDE TOP  |   PILAR    |
| (Cobble)   | (Fortress) |  (Shaded)  | (Gema azul)|
+------------+------------+------------+------------+
| (0, 5)     | (1, 5)     | (2, 5)     | (3, 5)     |
|   PUERTA   |   PUERTA   |   LLAVE    |   VACÍO    |
|  (Cerrada) |  (Abierta) |  (Dorada)  |            |
+------------+------------+------------+------------+
```

En las líneas 95 a 198 de [`AssetManager.ts`](file:///Users/lucas/dev/projects/game-karo/src/engine/graphics/AssetManager.ts):
- **Suelo (`floorSprite`)**: Dibuja adoquines oscuros con `ctx.strokeRect` y puntos de brillo (`#3d3c52`).
- **Pared (`wallSprite`)**: Dibuja un bloque de piedra de fortaleza con sombras superiores e inferiores y líneas de ladrillo (`#4a4f5f`).
- **Pilar (`pillarSprite`)**: Dibuja una columna circular con una gema azul brillante en el centro (`#38bdf8`).
- **Puerta cerrada (`doorClosedSprite`)**: Dibuja tablones de madera con remaches de hierro y cerradura dorada.
- **Puerta abierta (`doorOpenSprite`)**: Dibuja el marco con el pasaje oscuro abierto.
- **Llave (`keySprite`)**: Dibuja el anillo, eje y dientes de una llave dorada brillante.

Luego, en el método `sliceSprites()` (línea 313), se recortan en objetos `Sprite`:
```typescript
this.floorSprite      = new Sprite(this.tilesheetCanvas, 0 * 32, 4 * 32, 32, 32);
this.wallSprite       = new Sprite(this.tilesheetCanvas, 1 * 32, 4 * 32, 32, 32);
this.pillarSprite     = new Sprite(this.tilesheetCanvas, 3 * 32, 4 * 32, 32, 32);
this.doorClosedSprite = new Sprite(this.tilesheetCanvas, 0 * 5 * 32, 32, 32);
this.doorOpenSprite   = new Sprite(this.tilesheetCanvas, 1 * 5 * 32, 32, 32);
this.keySprite        = new Sprite(this.tilesheetCanvas, 2 * 5 * 32, 32, 32);
```

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
