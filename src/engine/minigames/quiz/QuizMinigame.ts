import type { IMinigame, MinigameState } from '../IMinigame.ts';
import type { Player } from '../../entities/Player.ts';
import { QuizView } from './QuizView.ts';

export interface QuizQuestion {
  id: number;
  question: string;
  options: Array<{ letter: string; text: string }>;
  correctLetter: string;
}

/**
 * QuizMinigame: Minijuego de formulario de preguntas y recuerdos en (415, 145).
 * Al responder correctamente las 4 preguntas, se obtiene la llave 'key_3'.
 */
export class QuizMinigame implements IMinigame {
  public readonly id = 'quiz_minigame';
  public readonly title = 'Cuestionario de Recuerdos';
  public state: MinigameState = 'not_started';
  public currentQuestionIndex = 0;
  public isRewardClaimed = false;

  public readonly questions: QuizQuestion[] = [
    {
      id: 1,
      question: '¿Cuándo nos pusimos oficialmente de novios?',
      options: [
        { letter: 'A', text: '16 de agosto de 2024' },
        { letter: 'B', text: '1 de noviembre de 2024' },
        { letter: 'C', text: '1 de diciembre de 2024' },
      ],
      correctLetter: 'B',
    },
    {
      id: 2,
      question: '¿Qué te regalé para tu graduación?',
      options: [
        { letter: 'A', text: 'AirPods' },
        { letter: 'B', text: 'Un reloj inteligente' },
        { letter: 'C', text: 'Una computadora' },
      ],
      correctLetter: 'A',
    },
    {
      id: 3,
      question: '¿Qué es lo que más me gusta hacer cuando tenemos una cita?',
      options: [
        { letter: 'A', text: 'Ir al cine' },
        { letter: 'B', text: 'Ir a cenar' },
        { letter: 'C', text: 'Ir a caminar' },
      ],
      correctLetter: 'B',
    },
    {
      id: 4,
      question: '¿Cuál fue el primer regalo que le hice a Lucas?',
      options: [
        { letter: 'A', text: 'Chocolates' },
        { letter: 'B', text: 'Caramelos' },
        { letter: 'C', text: 'Una carta' },
        { letter: 'D', text: 'Una flor' },
      ],
      correctLetter: 'A',
    },
  ];

  private view: QuizView;

  constructor() {
    this.view = new QuizView(this);
  }

  public onInteract(player: Player): void {
    if (this.isRewardClaimed || player.hasKey('key_3')) {
      this.isRewardClaimed = true;
      this.state = 'completed';
    } else if (this.currentQuestionIndex > 0) {
      this.state = 'in_progress';
    } else {
      this.state = 'not_started';
    }
  }

  public renderSidebar(container: HTMLElement, player: Player): void {
    this.view.render(container, player);
  }

  public isComplete(): boolean {
    return this.isRewardClaimed;
  }

  public checkAnswer(selectedLetter: string, player: Player): boolean {
    const currentQ = this.questions[this.currentQuestionIndex];
    if (!currentQ) return false;

    if (selectedLetter.toUpperCase() === currentQ.correctLetter.toUpperCase()) {
      if (this.currentQuestionIndex + 1 < this.questions.length) {
        this.currentQuestionIndex++;
      } else {
        // Todas las preguntas respondidas
        this.rewardPlayer(player);
      }
      return true;
    }
    return false;
  }

  public rewardPlayer(player: Player): void {
    if (this.isRewardClaimed) return;
    this.isRewardClaimed = true;
    this.state = 'completed';
    player.addKey('key_3');
    player.setNotification('❤️ ¡Cuestionario completado! Has obtenido la llave key_3.', 5.0);
  }

  public resetProgress(): void {
    if (!this.isRewardClaimed) {
      this.currentQuestionIndex = 0;
      this.state = 'not_started';
    }
  }
}
