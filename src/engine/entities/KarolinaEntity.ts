import { GameObject } from '../core/GameObject.ts';
import { BoundingBox } from '../math/BoundingBox.ts';
import type { ICollidable } from '../core/ICollidable.ts';
import type { IInteractive, InteractionResult } from '../core/IInteractive.ts';
import type { Camera } from '../core/Camera.ts';
import { Player } from './Player.ts';

interface HeartParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  life: number;
  maxLife: number;
}

/**
 * KarolinaEntity: Aparece al lado derecho del cofre al ser abierto.
 * Diseñada en pixel art con el mismo estilo, proporciones y escala que el personaje principal.
 * Muestra el mensaje "Te amo. Gracias por ser como sos" durante los primeros 5 segundos,
 * y luego cambia triunfalmente a "Ganaron!!" acompañado de confeti festivo.
 */
export class KarolinaEntity extends GameObject implements ICollidable, IInteractive {
  public timer = 0;
  public targetPlayer: Player | null = null;
  public readonly interactionRadius = 60;
  private notifiedVictory = false;
  private hearts: HeartParticle[] = [];
  private confetti: ConfettiParticle[] = [];
  private spawnTime = 0;
  private audioPlayedOpening = false;
  private audioPlayedVictory = false;

  constructor(x = 574, y = 476, width = 36, height = 46, targetPlayer: Player | null = null) {
    super(x, y, width, height, 22); // zIndex 22 para renderizarse en el plano del jugador
    this.targetPlayer = targetPlayer;
    this.playRomanticChime();
  }

  // --- ICollidable ---
  public isSolid(): boolean {
    return true;
  }

  public getCollider(): BoundingBox {
    // Caja de colisión en la base de los pies (similar a Player)
    return new BoundingBox(this.position.x + 6, this.position.y + 32, 24, 12);
  }

  // --- IInteractive ---
  public canInteract(initiator: GameObject): boolean {
    const dist = this.getCenter().distanceTo(initiator.getCenter());
    return dist <= 60;
  }

  public getInteractionPrompt(_initiator: GameObject): string {
    return '💖 [E] Hablar con Karolina';
  }

  public interact(initiator: GameObject): InteractionResult {
    if (initiator instanceof Player) {
      if (this.timer < 5.0) {
        initiator.setNotification('❤️ Karolina: "Te amo. Gracias por ser como sos"', 4.5);
      } else {
        initiator.setNotification('🎉 Karolina: "¡¡Ganaron!! ¡Gracias por encontrarme!"', 5.0);
      }
    }
    return { success: true, message: 'Has interactuado con Karolina.' };
  }

  public override update(dt: number): void {
    this.timer += dt;
    this.spawnTime += dt;

    // Generar partículas de corazones periódicamente
    if (this.timer < 5.0 && Math.random() < 0.25) {
      this.spawnHeart();
    }

    // A los 5 segundos exactos: disparar ráfaga de confeti y sonido festivo
    if (this.timer >= 5.0 && !this.notifiedVictory) {
      this.notifiedVictory = true;
      this.burstConfetti();
      this.playVictoryFanfare();
      if (this.targetPlayer) {
        this.targetPlayer.setNotification('🎉 ¡¡Ganaron!! 🎉', 7.0);
      }
    }

    // En modo victoria continuo: generar confeti suave
    if (this.timer >= 5.0 && Math.random() < 0.3) {
      this.spawnSingleConfetti();
    }

    // Actualizar corazones
    for (let i = this.hearts.length - 1; i >= 0; i--) {
      const h = this.hearts[i];
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      h.life += dt;
      h.alpha = Math.max(0, 1 - h.life / h.maxLife);
      if (h.life >= h.maxLife) {
        this.hearts.splice(i, 1);
      }
    }

    // Actualizar confeti
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const c = this.confetti[i];
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.rotation += c.vRot * dt;
      c.life += dt;
      // gravedad suave
      c.vy += 30 * dt;
      if (c.life >= c.maxLife) {
        this.confetti.splice(i, 1);
      }
    }
  }

  private spawnHeart(): void {
    const kX = this.position.x + 18 + (Math.random() * 20 - 10);
    const kY = this.position.y + 16 + (Math.random() * 10 - 5);
    const colors = ['#f43f5e', '#ec4899', '#fb7185', '#fda4af', '#f472b6'];
    this.hearts.push({
      x: kX,
      y: kY,
      vx: (Math.random() - 0.5) * 16,
      vy: -20 - Math.random() * 25,
      size: 4 + Math.random() * 4,
      alpha: 1,
      life: 0,
      maxLife: 1.8 + Math.random() * 0.8,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  private burstConfetti(): void {
    const colors = ['#f59e0b', '#fbbf24', '#f43f5e', '#10b981', '#38bdf8', '#a855f7', '#ffffff'];
    const centerX = this.position.x + 18;
    const centerY = this.position.y - 10;

    for (let i = 0; i < 48; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      this.confetti.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 10,
        life: 0,
        maxLife: 2.5 + Math.random() * 1.5,
      });
    }
  }

  private spawnSingleConfetti(): void {
    const colors = ['#f59e0b', '#fbbf24', '#f43f5e', '#10b981', '#38bdf8', '#ffffff'];
    this.confetti.push({
      x: this.position.x - 20 + Math.random() * 76,
      y: this.position.y - 45 - Math.random() * 15,
      vx: (Math.random() - 0.5) * 20,
      vy: 15 + Math.random() * 30,
      size: 3 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 8,
      life: 0,
      maxLife: 2.0 + Math.random() * 1.0,
    });
  }

  public override render(ctx: CanvasRenderingContext2D, _camera: Camera): void {
    const x = Math.floor(this.position.x);
    const y = Math.floor(this.position.y);

    ctx.save();

    // 1. Aura resplandeciente suave detrás de Karolina
    const auraGrad = ctx.createRadialGradient(x + 18, y + 24, 6, x + 18, y + 24, 32);
    auraGrad.addColorStop(0, 'rgba(244, 114, 182, 0.26)');
    auraGrad.addColorStop(0.6, 'rgba(251, 191, 36, 0.14)');
    auraGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = auraGrad;
    ctx.fillRect(x - 16, y - 10, 68, 68);

    // 2. Sombra de pies idéntica a la del Player
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x + 18, y + 43, 11, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Dibujo Pixel-Art de Karolina (mismo estilo y proporción del protagonista)
    const bobY = Math.round(Math.sin(this.timer * 3.2) * 1.2);
    this.drawKarolinaPixelArt(ctx, x, y + bobY);

    // 4. Renderizar partículas de corazones
    for (const heart of this.hearts) {
      this.drawHeart(ctx, heart.x, heart.y, heart.size, heart.color, heart.alpha);
    }

    // 5. Renderizar confeti
    for (const c of this.confetti) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.7);
      ctx.restore();
    }

    // 6. Bocadillo de diálogo / Texto flotante arriba de la cabeza
    this.renderSpeechBubble(ctx, x, y + bobY);

    ctx.restore();
  }

  /**
   * Renderiza el bocadillo de diálogo estilizado sobre la cabeza de Karolina.
   * Primeros 5 segundos: "Te amo. Gracias por ser como sos"
   * A partir de los 5 segundos: "Ganaron!!"
   */
  private renderSpeechBubble(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const isVictory = this.timer >= 5.0;
    const text = isVictory ? 'Ganaron!!' : 'Te amo. Gracias por ser como sos';

    ctx.save();

    if (!isVictory) {
      // Estado 1: Mensaje Romántico (0 a 5 segundos)
      ctx.font = 'bold 12px "Outfit", system-ui, sans-serif';
      const textWidth = ctx.measureText(text).width;
      const bubbleW = textWidth + 30; // espacio para corazón
      const bubbleH = 26;
      const bubbleX = x + 18 - bubbleW / 2;
      const bubbleY = y - 36;

      // Sombra exterior
      ctx.shadowColor = 'rgba(236, 72, 153, 0.4)';
      ctx.shadowBlur = 10;

      // Fondo oscuro semitransparente
      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 7);
      ctx.fill();
      ctx.stroke();

      // Flechita / puntero hacia la cabeza
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(x + 13, bubbleY + bubbleH);
      ctx.lineTo(x + 18, bubbleY + bubbleH + 6);
      ctx.lineTo(x + 23, bubbleY + bubbleH);
      ctx.closePath();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.fill();
      ctx.strokeStyle = '#f472b6';
      ctx.stroke();

      // Ícono de corazón latiendo
      const heartPulse = 1 + Math.sin(this.timer * 6) * 0.15;
      ctx.font = `${Math.round(11 * heartPulse)}px system-ui`;
      ctx.textAlign = 'left';
      ctx.fillText('❤️', bubbleX + 8, bubbleY + 18);

      // Texto "Te amo. Gracias por ser como sos"
      ctx.font = 'bold 12px "Outfit", system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(text, bubbleX + 26, bubbleY + 18);
    } else {
      // Estado 2: Victoria Triunfal (>= 5 segundos)
      const pulse = 1 + Math.sin((this.timer - 5.0) * 4) * 0.05;
      ctx.font = `800 ${Math.round(15 * pulse)}px "Outfit", system-ui, sans-serif`;
      const textWidth = ctx.measureText(text).width;
      const bubbleW = textWidth + 38;
      const bubbleH = 32;
      const bubbleX = x + 18 - bubbleW / 2;
      const bubbleY = y - 42;

      // Resplandor dorado de celebración
      ctx.shadowColor = 'rgba(250, 204, 21, 0.75)';
      ctx.shadowBlur = 14;

      // Fondo oscuro con degradado dorado
      ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 8);
      ctx.fill();
      ctx.stroke();

      // Flecha apuntando a la cabeza
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(x + 12, bubbleY + bubbleH);
      ctx.lineTo(x + 18, bubbleY + bubbleH + 7);
      ctx.lineTo(x + 24, bubbleY + bubbleH);
      ctx.closePath();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.stroke();

      // Ícono de fiesta
      ctx.font = '14px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText('🎉', bubbleX + 8, bubbleY + 22);

      // Texto "Ganaron!!" en dorado brillante
      ctx.font = `800 ${Math.round(15 * pulse)}px "Outfit", system-ui, sans-serif`;
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'left';
      ctx.fillText(text, bubbleX + 28, bubbleY + 22);
    }

    ctx.restore();
  }

  /**
   * Dibuja a Karolina píxel por píxel para un acabado fiel al héroe del juego.
   */
  private drawKarolinaPixelArt(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
    const p = (px: number, py: number, color: string, pw = 1, ph = 1): void => {
      ctx.fillStyle = color;
      ctx.fillRect(ox + px, oy + py, pw, ph);
    };

    // Paleta de colores armoniosa
    const cSkin = '#fed7aa'; // Piel suave cálida
    const cSkinShadow = '#fbcfe8';
    const cBlush = '#fb7185'; // Rubor en mejillas
    const cHair = '#5c2e14'; // Pelo castaño oscuro cálido
    const cHairMid = '#78350f';
    const cHairHigh = '#b45309'; // Brillo dorado
    const cDress = '#f43f5e'; // Vestido rosa carmesí elegante
    const cDressLight = '#fb7185';
    const cDressShadow = '#be123c';
    const cDressHem = '#ffffff'; // Ribetes de encaje blanco
    const cBelt = '#f59e0b'; // Cinturón dorado
    const cBuckle = '#fde047';
    const cShoes = '#881337'; // Zapatos de vestir
    const cEyes = '#0f172a';
    const cIris = '#78350f'; // Ojos miel cálidos

    // 1. Cabello posterior largo (cae detrás de los hombros hasta la cintura)
    p(8, 8, cHair, 20, 16);
    p(6, 12, cHair, 4, 18);
    p(26, 12, cHair, 4, 18);
    p(7, 24, cHairMid, 3, 8);
    p(26, 24, cHairMid, 3, 8);

    // 2. Cabeza y Rostro
    p(11, 8, cSkin, 14, 14);
    p(12, 6, cHairMid, 12, 3); // nacimiento del cabello

    // Flequillo y peinado delantero ondulado
    p(10, 4, cHair, 16, 4);
    p(9, 7, cHair, 5, 6);
    p(22, 7, cHair, 5, 6);
    p(12, 5, cHairHigh, 8, 2); // brillo superior del cabello

    // Flor / broche rosa en el pelo (lado izquierdo)
    p(7, 7, '#f43f5e', 4, 4);
    p(8, 8, '#fde047', 2, 2); // pistilo dorado
    p(6, 6, '#10b981', 2, 2); // hojita verde esmeralda

    // Ojos dulces y expresivos
    p(13, 13, cEyes, 3, 3);
    p(20, 13, cEyes, 3, 3);
    p(14, 14, cIris, 2, 2);
    p(21, 14, cIris, 2, 2);
    p(13, 13, '#ffffff', 1, 1); // brillo / catchlight
    p(20, 13, '#ffffff', 1, 1);

    // Pestañas sutiles
    p(12, 12, cEyes, 4, 1);
    p(20, 12, cEyes, 4, 1);

    // Mejillas sonrosadas (blush)
    p(12, 17, cBlush, 3, 2);
    p(21, 17, cBlush, 3, 2);

    // Sonrisa tierna
    p(16, 18, '#be123c', 4, 1);
    p(17, 19, '#be123c', 2, 1);

    // Cuello delicado
    p(16, 21, cSkin, 4, 3);
    p(16, 22, cSkinShadow, 4, 1);

    // Collar / colgante dorado
    p(17, 23, '#fde047', 2, 2);

    // 3. Vestido elegante: Corpiño
    p(12, 24, cDressHem, 12, 2); // escote de encaje blanco
    p(11, 26, cDress, 14, 5);
    p(13, 26, cDressLight, 10, 4); // centro luminoso
    p(10, 26, cDressShadow, 2, 5);
    p(24, 26, cDressShadow, 2, 5);

    // Cinturón dorado de gala
    p(11, 31, cBelt, 14, 2);
    p(17, 31, cBuckle, 2, 2);

    // 4. Falda con vuelo
    p(9, 33, cDress, 18, 7);
    p(11, 33, cDressLight, 14, 6);
    p(8, 38, cDressShadow, 3, 2);
    p(25, 38, cDressShadow, 3, 2);
    p(8, 40, cDressHem, 20, 1); // dobladillo blanco

    // 5. Brazos y manos delicadas al frente
    p(9, 25, cSkin, 3, 6);
    p(24, 25, cSkin, 3, 6);
    // Manos entrelazadas en el pecho
    p(15, 28, cSkin, 6, 3);
    p(15, 29, '#fde047', 1, 1); // anillo / pulsera brillante

    // 6. Piernas y zapatos de fiesta
    p(13, 41, cSkin, 4, 2);
    p(19, 41, cSkin, 4, 2);
    p(12, 42, cShoes, 5, 3);
    p(19, 42, cShoes, 5, 3);
    p(13, 43, '#fde047', 2, 1); // hebilla dorada
    p(20, 43, '#fde047', 2, 1);
  }

  private drawHeart(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    alpha: number
  ): void {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    const topCurveHeight = size * 0.3;
    ctx.moveTo(x, y + topCurveHeight);
    ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
    ctx.bezierCurveTo(
      x - size / 2,
      y + (size + topCurveHeight) / 2,
      x,
      y + (size + topCurveHeight) / 1.2,
      x,
      y + size
    );
    ctx.bezierCurveTo(
      x,
      y + (size + topCurveHeight) / 1.2,
      x + size / 2,
      y + (size + topCurveHeight) / 2,
      x + size / 2,
      y + topCurveHeight
    );
    ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /**
   * Melodía romántica y dulce al aparecer Karolina.
   */
  private playRomanticChime(): void {
    if (this.audioPlayedOpening) return;
    this.audioPlayedOpening = true;

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      // Arpegio romántico: Do5 -> Mi5 -> Sol5 -> Do6
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + index * 0.12);

        gain.gain.setValueAtTime(0, audioCtx.currentTime + index * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + index * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + index * 0.12 + 0.7);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + index * 0.12);
        osc.stop(audioCtx.currentTime + index * 0.12 + 0.7);
      });
    } catch {
      // Audio opcional sin interrupción si el navegador restringe autoplay
    }
  }

  /**
   * Fanfarria alegre y triunfal al llegar a los 5 segundos ("Ganaron!!").
   */
  private playVictoryFanfare(): void {
    if (this.audioPlayedVictory) return;
    this.audioPlayedVictory = true;

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      // Fanfarria triunfal: Sol4 -> Do5 -> Mi5 -> Sol5 -> Do6
      const notes = [
        { f: 392.0, d: 0.12 },
        { f: 523.25, d: 0.12 },
        { f: 659.25, d: 0.12 },
        { f: 783.99, d: 0.2 },
        { f: 1046.5, d: 0.8 },
      ];

      let timeOffset = 0;
      notes.forEach((n) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, audioCtx.currentTime + timeOffset);

        gain.gain.setValueAtTime(0, audioCtx.currentTime + timeOffset);
        gain.gain.linearRampToValueAtTime(0.22, audioCtx.currentTime + timeOffset + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + timeOffset + n.d);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + timeOffset);
        osc.stop(audioCtx.currentTime + timeOffset + n.d);

        timeOffset += n.d * 0.85;
      });
    } catch {
      // Audio opcional
    }
  }
}
