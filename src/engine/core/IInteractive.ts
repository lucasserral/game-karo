import type { GameObject } from './GameObject.ts';

/**
 * Result of an interaction attempt.
 */
export interface InteractionResult {
  success: boolean;
  message?: string;
  consumedItem?: string;
}

/**
 * Interface for game objects that support active user interaction.
 */
export interface IInteractive {
  /**
   * Distance in world units at which the interaction can be triggered.
   */
  readonly interactionRadius: number;

  /**
   * Evaluates if the initiator (e.g. Player) can currently trigger the interaction.
   */
  canInteract(initiator: GameObject): boolean;

  /**
   * Executes the active interaction.
   */
  interact(initiator: GameObject): InteractionResult;

  /**
   * Human-readable prompt shown to the user when in interaction range (e.g. "[E] Abrir puerta").
   */
  getInteractionPrompt(initiator: GameObject): string;
}

/**
 * Type guard for IInteractive.
 */
export function isInteractive(obj: unknown): obj is IInteractive {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'interactionRadius' in obj &&
    'canInteract' in obj &&
    'interact' in obj &&
    'getInteractionPrompt' in obj
  );
}
