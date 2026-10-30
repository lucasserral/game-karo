import type { Player } from '../../entities/Player.ts';
import type { QuizMinigame } from './QuizMinigame.ts';
import { MinigameManager } from '../MinigameManager.ts';

/**
 * QuizView: Renderiza la interfaz de la nota con formulario de preguntas románticas en el panel lateral.
 */
export class QuizView {
  private minigame: QuizMinigame;
  private feedbackText = '';
  private feedbackType: 'success' | 'error' | '' = '';
  private isTransitioning = false;

  constructor(minigame: QuizMinigame) {
    this.minigame = minigame;
  }

  public render(container: HTMLElement, player: Player): void {
    const isCompleted = this.minigame.isRewardClaimed;
    const questions = this.minigame.questions;
    const currentIndex = this.minigame.currentQuestionIndex;
    const currentQ = questions[currentIndex];

    container.innerHTML = `
      <div class="quiz-sheet-wrapper">
        <div class="quiz-sheet ${isCompleted ? 'quiz-completed-glow' : ''}">
          <!-- Decorative Stamp/Seal -->
          <div class="quiz-seal" title="Sellado con amor">💌</div>

          <!-- Header -->
          <div class="quiz-header">
            <span class="quiz-tag">Mesa (415, 145) • Formulario</span>
            <button class="quiz-close-btn" id="btn-close-quiz" title="Cerrar nota" aria-label="Cerrar">✕</button>
          </div>

          <!-- Body -->
          <div class="quiz-body">
            <!-- Progress bar -->
            <div class="quiz-progress-bar">
              ${questions
                .map((_q, idx) => {
                  const isDone = isCompleted || idx < currentIndex;
                  const isActive = !isCompleted && idx === currentIndex;
                  return `
                  <div class="quiz-step ${isDone ? 'step-done' : ''} ${isActive ? 'step-active' : ''}">
                    <span class="step-num">${isDone ? '✓' : idx + 1}</span>
                  </div>
                `;
                })
                .join('<div class="step-line"></div>')}
            </div>

            ${
              isCompleted
                ? `
              <!-- Pantalla de Éxito / Completado -->
              <div class="quiz-success-view">
                <div class="heart-pulse-icon">❤️</div>
                <h3 class="quiz-success-title">¡Respondiste todo a la perfección!</h3>
                <p class="quiz-success-msg">
                  Cada recuerdo es un tesoro. Un compartimento oculto en el marco de la mesa se ha abierto.
                </p>

                <!-- Recompensa de la Llave key_3 -->
                <div class="quiz-reward-box">
                  <span class="reward-key-icon">🗝️</span>
                  <div>
                    <strong>¡Llave key_3 Obtenida!</strong>
                    <p>La llave dorada del amor ha sido añadida a tu inventario.</p>
                  </div>
                </div>

                <!-- Resumen de Recuerdos -->
                <div class="quiz-summary-card">
                  <h4>Nuestros Recuerdos</h4>
                  <ul>
                    <li><strong>Noviazgo:</strong> 1 de noviembre de 2024</li>
                    <li><strong>Graduación:</strong> AirPods</li>
                    <li><strong>Cita perfecta:</strong> Ir a cenar</li>
                    <li><strong>Primer regalo a Lucas:</strong> Chocolates</li>
                  </ul>
                </div>
              </div>
            `
                : `
              <!-- Pregunta Activa -->
              <div class="quiz-question-card">
                <span class="question-number">Pregunta ${currentIndex + 1} de ${questions.length}</span>
                <h3 class="question-title">${currentQ.question}</h3>

                <!-- Feedback banner si hay intento -->
                ${
                  this.feedbackText
                    ? `
                  <div class="quiz-feedback-banner ${this.feedbackType}">
                    ${this.feedbackType === 'success' ? '✨' : '💭'} ${this.feedbackText}
                  </div>
                `
                    : ''
                }

                <!-- Opciones de respuesta -->
                <div class="quiz-options-list">
                  ${currentQ.options
                    .map(
                      (opt) => `
                    <button class="quiz-option-btn" data-letter="${opt.letter}">
                      <span class="option-letter">${opt.letter}</span>
                      <span class="option-text">${opt.text}</span>
                    </button>
                  `
                    )
                    .join('')}
                </div>
              </div>
            `
            }
          </div>
        </div>
      </div>
    `;

    // Event listeners
    const btnClose = container.querySelector('#btn-close-quiz');
    btnClose?.addEventListener('click', () => {
      this.feedbackText = '';
      this.feedbackType = '';
      MinigameManager.getInstance().closeMinigame();
    });

    if (!isCompleted) {
      const optionButtons = container.querySelectorAll('.quiz-option-btn');
      optionButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          if (this.isTransitioning) return;
          const letter = (e.currentTarget as HTMLElement).getAttribute('data-letter') || '';
          this.handleOptionSelect(letter, player, container, e.currentTarget as HTMLElement);
        });
      });
    }
  }

  private handleOptionSelect(
    letter: string,
    player: Player,
    container: HTMLElement,
    btnEl: HTMLElement
  ): void {
    const isCorrect = this.minigame.checkAnswer(letter, player);

    if (isCorrect) {
      this.isTransitioning = true;
      btnEl.classList.add('option-correct');
      this.feedbackText = '¡Respuesta correcta! ❤️';
      this.feedbackType = 'success';

      setTimeout(() => {
        this.isTransitioning = false;
        this.feedbackText = '';
        this.feedbackType = '';
        this.render(container, player);
      }, 750);
    } else {
      btnEl.classList.add('option-wrong');
      this.feedbackText = '¡Casi! Esa no es la correcta, ¡inténtalo de nuevo!';
      this.feedbackType = 'error';

      setTimeout(() => {
        btnEl.classList.remove('option-wrong');
      }, 600);
    }
  }
}
