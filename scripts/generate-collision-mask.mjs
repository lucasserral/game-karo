import sharp from 'sharp';
import fs from 'fs';

/**
 * Script para generar la máscara de colisión de alta precisión (1600x1066)
 * para la Mansión y Finca Karo (map-expectation).
 *
 * Convención de la máscara:
 * - Blanco (255, 255, 255): Suelo transitable (walkable floor/paths)
 * - Negro (0, 0, 0): Obstáculo sólido (muros, agua profunda, muebles, setos)
 */
async function generateCollisionMask() {
  const width = 1600;
  const height = 1066;

  // Buffer de 1 canal (escala de grises) o 4 canales (RGBA)
  // Inicializado en 0 (todo negro / sólido por defecto)
  const mask = Buffer.alloc(width * height, 0);

  const setPixel = (x, y, val = 255) => {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      mask[y * width + x] = val;
    }
  };

  const fillRect = (x1, y1, w, h, val = 255) => {
    const minX = Math.max(0, Math.floor(x1));
    const maxX = Math.min(width, Math.floor(x1 + w));
    const minY = Math.max(0, Math.floor(y1));
    const maxY = Math.min(height, Math.floor(y1 + h));

    for (let y = minY; y < maxY; y++) {
      const row = y * width;
      for (let x = minX; x < maxX; x++) {
        mask[row + x] = val;
      }
    }
  };

  const fillCircle = (cx, cy, r, val = 255) => {
    const minX = Math.max(0, Math.floor(cx - r));
    const maxX = Math.min(width, Math.ceil(cx + r));
    const minY = Math.max(0, Math.floor(cy - r));
    const maxY = Math.min(height, Math.ceil(cy + r));
    const r2 = r * r;

    for (let y = minY; y < maxY; y++) {
      const row = y * width;
      const dy2 = (y - cy) * (y - cy);
      for (let x = minX; x < maxX; x++) {
        if ((x - cx) * (x - cx) + dy2 <= r2) {
          mask[row + x] = val;
        }
      }
    }
  };

  const fillRing = (cx, cy, innerR, outerR, val = 255) => {
    const minX = Math.max(0, Math.floor(cx - outerR));
    const maxX = Math.min(width, Math.ceil(cx + outerR));
    const minY = Math.max(0, Math.floor(cy - outerR));
    const maxY = Math.min(height, Math.ceil(cy + outerR));
    const in2 = innerR * innerR;
    const out2 = outerR * outerR;

    for (let y = minY; y < maxY; y++) {
      const row = y * width;
      const dy2 = (y - cy) * (y - cy);
      for (let x = minX; x < maxX; x++) {
        const d2 = (x - cx) * (x - cx) + dy2;
        if (d2 >= in2 && d2 <= out2) {
          mask[row + x] = val;
        }
      }
    }
  };

  console.log('Pintando áreas transitables (blanco)...');

  // ==========================================
  // 1. HABITACIONES DE LA MANSIÓN
  // ==========================================

  // --- Suite Principal (Noroeste) ---
  fillRect(40, 90, 160, 136); // Suelo de la habitación
  fillRect(190, 170, 30, 48); // Puerta este hacia pasillo
  // Obstáculos de muebles (negro)
  fillRect(45, 105, 75, 80, 0); // Cama con dosel
  fillRect(125, 95, 30, 40, 0); // Mesita de noche
  fillRect(38, 185, 30, 40, 0); // Cómoda
  fillRect(30, 95, 15, 70, 0);  // Biombo

  // --- Corredor Suite a Salón ---
  fillRect(200, 160, 80, 85);
  // Pasillo central vertical
  fillRect(265, 220, 75, 410);

  // --- Salón de la Chimenea (Norte) ---
  fillRect(285, 36, 230, 184); // Suelo
  fillRect(320, 200, 120, 60); // Paso al pasillo sur
  // Muebles (negro)
  fillRect(375, 20, 60, 50, 0);  // Chimenea norte
  fillRect(305, 70, 50, 45, 0);  // Sillón NO
  fillRect(450, 70, 50, 45, 0);  // Sillón NE
  fillRect(470, 125, 50, 55, 0); // Sofá E
  fillRect(295, 145, 50, 45, 0); // Sillón SO
  fillRect(375, 125, 60, 35, 0); // Mesa baja

  // --- Cocina Gourmet (Noreste interior) ---
  fillRect(595, 34, 125, 166); // Suelo general
  fillRect(630, 185, 55, 55);  // Escaleras hacia el pasillo sur
  // Encimeras en U (negro)
  fillRect(595, 34, 125, 38, 0); // Encimera norte con fogón
  fillRect(595, 72, 35, 95, 0);  // Encimera oeste
  fillRect(685, 72, 35, 95, 0);  // Fregadero este

  // --- Rincón de Lectura / Galería Curva ---
  fillRect(430, 220, 90, 100);
  fillRect(495, 260, 55, 45, 0); // Mesa y silla de lectura

  // --- Comedor Formal (Oeste) ---
  fillRect(55, 310, 390, 185); // Suelo
  fillRect(435, 370, 45, 75);  // Puerta este al pasillo
  // Muebles del comedor (negro)
  fillRect(240, 370, 150, 80, 0); // Gran mesa de comedor
  fillRect(245, 310, 120, 45, 0); // Alacena norte
  fillRect(55, 350, 40, 120, 0);  // Aparador oeste
  fillRect(395, 320, 50, 45, 0);  // Sillón este

  // --- Baño y Tocador (Suroeste) ---
  fillRect(35, 590, 160, 225); // Suelo
  fillRect(180, 640, 40, 70);  // Entrada este
  // Sanitarios y muebles (negro)
  fillRect(35, 590, 55, 70, 0); // Bañera
  fillRect(35, 710, 45, 60, 0); // Mueble

  // --- Salón Semicircular Sur ---
  fillRect(205, 635, 315, 205); // Suelo
  fillRect(260, 615, 70, 35);   // Entrada norte
  // Muebles del salón sur (negro)
  fillRect(340, 805, 110, 50, 0); // Sofá rosa
  fillRect(475, 650, 55, 55, 0);  // Sillón NE
  fillRect(465, 780, 55, 55, 0);  // Sillón SE
  fillRect(200, 760, 55, 55, 0);  // Sillón SO
  fillRect(525, 730, 60, 60, 0);  // Chimenea este

  // --- Estudio y Biblioteca (Noreste exterior) ---
  fillRect(775, 170, 225, 205); // Suelo
  fillRect(755, 240, 35, 60);   // Puerta oeste al jardín
  // Muebles del estudio (negro)
  fillRect(775, 165, 70, 80, 0);  // Librería O
  fillRect(920, 165, 80, 80, 0);  // Librería E
  fillRect(845, 165, 75, 75, 0);  // Escritorio
  fillRect(915, 235, 55, 60, 0);  // Sillón turquesa
  fillRect(945, 330, 35, 40, 0);  // Globo
  fillRect(775, 335, 70, 40, 0);  // Mesa estudio

  // --- Jardín Secreto (Norte del estudio) ---
  fillRect(785, 45, 160, 105);
  fillRect(840, 140, 50, 25); // Verja sur de entrada
  fillRect(880, 65, 36, 30, 0); // Cofre del tesoro (sólido hasta abrir)

  // --- Invernadero / Solarium (Sureste) ---
  fillRect(775, 430, 250, 225); // Suelo
  fillRect(885, 645, 50, 40);   // Puerta sur
  // Plantas y mesas (negro)
  fillRect(775, 430, 35, 220, 0); // Plantas oeste
  fillRect(990, 430, 35, 220, 0); // Plantas este
  fillRect(785, 485, 55, 60, 0);  // Sillón 1
  fillRect(955, 485, 55, 60, 0);  // Sillón 2
  fillRect(955, 565, 55, 60, 0);  // Sillón 3
  fillRect(865, 535, 70, 50, 0);  // Mesa cristal

  // --- Habitación de Invitados (Sureste inferior) ---
  fillRect(775, 710, 180, 170); // Suelo
  fillRect(945, 770, 40, 60);   // Puerta este al sendero
  // Muebles (negro)
  fillRect(840, 720, 85, 110, 0); // Cama
  fillRect(810, 715, 30, 45, 0);  // Mesita O
  fillRect(925, 715, 30, 45, 0);  // Mesita E
  fillRect(775, 720, 40, 80, 0);  // Tocador

  // ==========================================
  // 2. JARDÍN FORMAL DE SETOS Y FUENTE (Centro)
  // ==========================================
  // Todo el interior del jardín de setos
  fillRect(518, 385, 220, 210);

  // Anillo transitable alrededor de la fuente de agua
  fillRing(640, 490, 38, 95, 255);
  // Núcleo central de la fuente de piedra (negro / sólido)
  fillCircle(640, 490, 38, 0);

  // Setos curvos interiores (negro / sólidos)
  fillRect(540, 410, 65, 45, 0); // NO
  fillRect(675, 410, 65, 45, 0); // NE
  fillRect(540, 515, 65, 45, 0); // SO
  fillRect(675, 515, 65, 45, 0); // SE

  // Entradas del jardín formal
  fillRect(620, 340, 40, 60, 255); // Norte
  fillRect(620, 580, 45, 55, 255); // Sur

  // ==========================================
  // 3. SENDEROS EXTERIORES, PARQUE Y PLAYA
  // ==========================================

  // Patio exterior sur
  fillRect(460, 630, 130, 320);
  fillRect(240, 880, 450, 140); // Césped y ruinas sur

  // Sendero empedrado hacia el este y lago
  fillRect(630, 640, 460, 60);
  fillRect(1000, 600, 100, 200);

  // Zona de picnic exterior
  fillRect(1060, 580, 160, 150);
  fillRect(1110, 615, 85, 75, 0);  // Mesa de picnic (sólida)
  fillRect(1075, 600, 30, 60, 0);  // Banco izquierdo
  fillRect(1180, 650, 35, 60, 0);  // Banco derecho

  // Sendero curvado hacia el norte (bordeando el lago hacia el puente)
  fillRect(980, 160, 130, 450);
  fillRect(1080, 180, 80, 200);

  // PUENTE DE MADERA SOBRE EL ESTANQUE (Transitable)
  fillRect(1215, 316, 140, 42); // Tablones transitables del puente
  fillRect(1215, 295, 140, 21, 0); // Barandilla norte del puente (sólida)
  fillRect(1215, 358, 140, 22, 0); // Barandilla sur del puente (sólida)

  // Isla / Orilla este al cruzar el puente
  fillRect(1340, 310, 120, 100);

  // Césped y senderos entre árboles al sur
  fillRect(1150, 750, 140, 250);
  fillRect(1050, 820, 250, 180);

  // PLAYA COSTERA Y ARENA (Todo transitable en la arena)
  fillRect(1260, 600, 210, 440);
  fillRect(1350, 550, 120, 100);

  // Troncos de árboles (negro / sólidos en la base)
  fillRect(1035, 70, 30, 25, 0);  // Árbol junto al puente
  fillRect(1100, 455, 30, 25, 0); // Árbol este del solarium
  fillRect(1330, 545, 30, 25, 0); // Árbol picnic
  fillRect(1435, 790, 30, 25, 0); // Árbol playa
  fillRect(1220, 915, 30, 25, 0); // Árbol sur

  // Bancos de jardín blancos (negro / sólidos)
  fillRect(1055, 250, 36, 40, 0);
  fillRect(1120, 550, 40, 32, 0);
  fillRect(700, 710, 36, 45, 0);
  fillRect(485, 865, 45, 32, 0);
  fillRect(240, 950, 45, 32, 0);

  // Límites exteriores del mapa (marco negro impenetrable)
  fillRect(0, 0, width, 18, 0);
  fillRect(0, height - 18, width, 18, 0);
  fillRect(0, 0, 18, height, 0);
  fillRect(width - 18, 0, 18, height, 0);

  // Guardar máscara en public/maps/estate-collision.png
  fs.mkdirSync('public/maps', { recursive: true });
  await sharp(mask, {
    raw: { width, height, channels: 1 }
  })
    .png()
    .toFile('public/maps/estate-collision.png');

  console.log('✅ Máscara de colisión generada con éxito: public/maps/estate-collision.png (1600x1066)');
}

generateCollisionMask().catch(console.error);
