/**
 * KeyClues: Registro exhaustivo de llaves, puertas y ubicaciones de la Finca.
 * Proporciona pistas inmersivas, coordenadas exactas y descripciones de cómo
 * conseguir cada llave para abrir cada puerta del juego.
 */

export interface KeyDoorClue {
  /** Identificador técnico de la llave */
  keyId: string;
  /** Nombre formal de la llave */
  keyName: string;
  /** Nombre de la puerta o cofre que abre */
  doorName: string;
  /** Coordenadas aproximadas de la puerta en el mapa */
  doorCoords: { x: number; y: number };
  /** Coordenadas donde se busca o consigue la llave */
  keyCoords: { x: number; y: number };
  /** Zona del mapa donde se encuentra */
  zoneName: string;
  /** Título breve de la ubicación */
  locationTitle: string;
  /** Pista corta para prompts y tooltips rápidos */
  shortHint: string;
  /** Pista detallada con instrucciones completas */
  detailedClue: string;
  /** Explicación de qué debe hacer el jugador para ganarla */
  howToGet: string;
  /** Lo que desbloquea o permite al abrir la puerta */
  unlocksDesc: string;
  /** Icono representativo */
  icon: string;
  /** Categoría: 'story' (progresión hacia Karolina) o 'exploration' */
  category: 'story' | 'exploration';
  /** Paso en la ruta recomendada (1 a 5) */
  stepNumber?: number;
}

export const KEY_DOOR_CLUES: Record<string, KeyDoorClue> = {
  // 1. Pesca -> Abre Cocina
  key_2: {
    keyId: 'key_2',
    keyName: 'Llave Marina (key_2)',
    doorName: 'Puerta de la cocina',
    doorCoords: { x: 91, y: 720 },
    keyCoords: { x: 1272, y: 343 },
    zoneName: 'Gran Lago Oriental (Muelle)',
    locationTitle: 'Muelle oriental del lago en (1272, 343)',
    shortHint: 'Pesca en el muelle oriental del lago en (1272, 343) usando la caña de pescar.',
    detailedClue:
      'Ve al muelle de madera del gran lago oriental en (1272, 343). Interactúa con la caña de pescar [E] y haz click en el momento preciso de la mordida para rescatar la brillante Llave Marina del fondo del agua.',
    howToGet: 'Pesca en el muelle oriental en (1272, 343) hasta extraer la llave del fondo del lago.',
    unlocksDesc: 'Abre la Puerta de la cocina en (91, 720), permitiendo entrar a la alacena donde están los platos musicales.',
    icon: '🎣',
    category: 'story',
    stepNumber: 1,
  },

  // 2. Platos de Cocina -> Abre Puerta Principal
  key_5: {
    keyId: 'key_5',
    keyName: 'Llave de los Platos (key_5)',
    doorName: 'Puerta principal',
    doorCoords: { x: 373, y: 865 },
    keyCoords: { x: 99, y: 600 },
    zoneName: 'Interior de la Cocina (Alacena de Porcelana)',
    locationTitle: 'Alacena de platos en la cocina en (99, 600)',
    shortHint: 'Supera la secuencia de 16 notas de los platos en la cocina en (99, 600). Requiere abrir antes la cocina con la Llave Marina.',
    detailedClue:
      'Primero abre la cocina en (91, 720) usando la Llave Marina pescada en el lago. Luego interactúa con la alacena de platos en (99, 600) y repite la melodía de los 4 platos de colores durante 16 rondas progresivas.',
    howToGet: 'Repite la secuencia de colores y sonidos de los 4 platos a lo largo de 16 rondas aceleradas en la cocina.',
    unlocksDesc: 'Abre la gran Puerta Principal de la mansión en (373, 865), el acceso definitivo para encontrar a Karolina.',
    icon: '🍽️',
    category: 'story',
    stepNumber: 2,
  },

  // 3. Tablero de Cartas -> Abre Puerta de la Fuente
  key_4: {
    keyId: 'key_4',
    keyName: 'Llave de las Cartas (key_4)',
    doorName: 'Puerta de la Fuente',
    doorCoords: { x: 609, y: 610 },
    keyCoords: { x: 928, y: 345 },
    zoneName: 'Jardín Floral Oriental',
    locationTitle: 'Tablero de juego en el jardín este en (928, 345)',
    shortHint: 'Encuentra todas las parejas de cartas en el tablero de memoria del jardín este en (928, 345).',
    detailedClue:
      'Dirígete al jardín de flores oriental en (928, 345) e interactúa con el tablero de madera [E]. Voltea las cartas memorizando sus posiciones y empareja todos los símbolos idénticos.',
    howToGet: 'Descubre y empareja todos los pares de símbolos volteando las cartas en el tablero de juego.',
    unlocksDesc: 'Abre la Puerta de la Fuente en (609, 610), conectando el sendero este con el patio de la gran fuente central.',
    icon: '🃏',
    category: 'story',
    stepNumber: 3,
  },

  // 4. Carta de Recuerdos (Quiz) -> Abre Puerta del Cristalero
  key_3: {
    keyId: 'key_3',
    keyName: 'Llave del Corazón (key_3)',
    doorName: 'Puerta del Cristalero',
    doorCoords: { x: 885, y: 655 },
    keyCoords: { x: 415, y: 145 },
    zoneName: 'Salón Norte de la Mansión',
    locationTitle: 'Escritorio con carta en el salón norte en (415, 145)',
    shortHint: 'Responde el cuestionario de recuerdos en el escritorio del salón norte en (415, 145).',
    detailedClue:
      'Sube al salón norte de la mansión en (415, 145) y lee el papel sobre el escritorio [E]. Responde correctamente las preguntas sobre la historia de amor y recuerdos compartidos.',
    howToGet: 'Completa con éxito las preguntas del formulario sobre recuerdos románticos compartidos.',
    unlocksDesc: 'Abre la Puerta del Cristalero en (885, 655), permitiendo acceder al invernadero botánico vidriado.',
    icon: '💌',
    category: 'story',
    stepNumber: 4,
  },

  // 5. Rompecabezas del Retrato -> Abre Cofre del Tesoro
  key_1: {
    keyId: 'key_1',
    keyName: 'Llave del Retrato (key_1)',
    doorName: 'Cofre del Tesoro',
    doorCoords: { x: 528, y: 488 },
    keyCoords: { x: 240, y: 740 },
    zoneName: 'Jardín Suroeste & Ruinas del Norte',
    locationTitle: 'Mesa de trabajo en el jardín suroeste en (240, 740)',
    shortHint: 'Reúne los 4 pedacitos de foto y ensámblalos en la mesa en (240, 740). Abre el cofre en (528, 488).',
    detailedClue:
      'Encuentra los 4 fragmentos del retrato: 1 en la Biblioteca (920, 250), 2 en el Patio de la fuente (904, 600), 3 en la Suite del dosel (105, 150) y 4 en la Costa oriental (125, 405). Luego ensámblalos en la mesa en (240, 740) para forjar la llave.',
    howToGet: 'Recolecta los 4 fragmentos dispersos por la finca y únelos en la mesa del rompecabezas.',
    unlocksDesc: 'Abre el Cofre del Tesoro en (528, 488) en las ruinas secretas del norte, revelando el Amuleto de Esmeralda.',
    icon: '🖼️',
    category: 'story',
    stepNumber: 5,
  },

  // Llave de la habitación (Exploración)
  room_key: {
    keyId: 'room_key',
    keyName: 'Llave de la Habitación (room_key)',
    doorName: 'Puerta Vertical de la habitación',
    doorCoords: { x: 160, y: 144 },
    keyCoords: { x: 224, y: 55 },
    zoneName: 'Orilla Noroeste del Estanque',
    locationTitle: 'Orilla noroeste del estanque en (224, 55)',
    shortHint: 'Recógela del suelo en la orilla noroeste del estanque en (224, 55).',
    detailedClue:
      'Camina hacia el extremo noroeste de la finca, a la orilla del estanque de agua en (224, 55). Verás una llave brillando sobre la hierba; acércate e interactúa [E] para recogerla.',
    howToGet: 'Acércate a la orilla del estanque en (224, 55) y recógela del suelo con la tecla [E].',
    unlocksDesc: 'Abre la Puerta Vertical de la habitación en (160, 144) en el ala residencial oeste.',
    icon: '🗝️',
    category: 'exploration',
  },

  // Llave de Hierro (Exploración)
  iron_key: {
    keyId: 'iron_key',
    keyName: 'Llave de Hierro (iron_key)',
    doorName: 'Puertas traseras',
    doorCoords: { x: 870, y: 390 },
    keyCoords: { x: 920, y: 316 },
    zoneName: 'Cocina Gourmet Oriental',
    locationTitle: 'Tabla de corte de la cocina en (920, 316)',
    shortHint: 'Recógela sobre la tabla de corte en la cocina gourmet este en (920, 316).',
    detailedClue:
      'Entra a la cocina gourmet del este y acércate a la tabla de madera de corte en (920, 316) (su ubicación se menciona en los libros de arquitectura de la biblioteca). Presiona [E] para tomarla.',
    howToGet: 'Interactúa con la tabla de madera de la encimera en la cocina oriental para tomar la llave.',
    unlocksDesc: 'Abre las Puertas traseras de servicio en (870, 390) que comunican las salas con el patio exterior.',
    icon: '🗝️',
    category: 'exploration',
  },
};

/**
 * Obtiene la información y pistas de búsqueda para una llave específica.
 */
export function getKeyClue(keyId: string): KeyDoorClue | undefined {
  return KEY_DOOR_CLUES[keyId];
}

/**
 * Obtiene la información y pistas de búsqueda según el nombre de la puerta.
 */
export function getKeyClueByDoorName(doorName: string): KeyDoorClue | undefined {
  const norm = doorName.toLowerCase().trim();
  return Object.values(KEY_DOOR_CLUES).find(
    (c) => c.doorName.toLowerCase().includes(norm) || norm.includes(c.doorName.toLowerCase())
  );
}
