# Directorio de Sprites y Texturas

Coloca aquí tus imágenes y hojas de sprites (PNG, WebP, etc.).
Por ejemplo:
- `public/sprites/player.png`
- `public/sprites/tileset.png`
- `public/sprites/enemies.png`

Al estar en la carpeta `public/`, Vite las sirve automáticamente en la raíz:
```ts
const playerSheet = await SpriteSheet.load('/sprites/player.png', 32, 32);
```
