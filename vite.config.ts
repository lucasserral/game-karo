import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  // base: './' asegura que los assets se carguen con rutas relativas,
  // permitiendo que funcione tanto en local como en subdirectorios de GitHub Pages (ej: /game-karo/).
  base: './',
});
