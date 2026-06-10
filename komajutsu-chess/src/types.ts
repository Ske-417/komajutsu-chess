export type SkillCategory = 'move' | 'combat' | 'curse' | 'defense';
export type SkillLevel = 1 | 2 | 3;
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type Color = 'white' | 'black';
export type Square = string;
export type GemType = 'blue' | 'red' | 'green' | 'gold';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GamePhase = 'title' | 'draft' | 'playing' | 'ended';

export interface Skill {
  id: string;
  name: { ja: string; en: string };
  category: SkillCategory;
  level: SkillLevel;
  descriptions: Record<SkillLevel, string>;
  compatiblePieces: PieceType[];
}

export interface PieceState {
  type: PieceType;
  color: Color;
  skills: Skill[];
  maxSlots: number;
  experience: number;
  level: number;
  isBound: boolean;
  boundTurns: number;
  isPhantom: boolean;
  reviveTurnsLeft?: number;
  armorCharges?: number;
  mistStepUses?: number;
  chainCapturesLeft?: number;
}

export interface DraftState {
  whiteHand: Skill[];
  blackHand: Skill[];
  whitePicks: Skill[];
  blackPicks: Skill[];
  whiteAssignments: Map<string, Skill[]>;
  blackAssignments: Map<string, Skill[]>;
  phase: 'picking' | 'assigning' | 'done';
  currentPicker: Color;
}

export interface GameState {
  phase: GamePhase;
  pieces: Map<Square, PieceState>;
  gems: Map<Square, GemType>;
  currentTurn: Color;
  turnNumber: number;
  winner: Color | null;
  botColor: Color | null;
  botDifficulty: Difficulty;
  draft: DraftState;
  pendingAbsorb: {
    capturingSquare: Square;
    capturedSkills: Skill[];
  } | null;
  pendingLevelUp: {
    square: Square;
    choices: Skill[];
  } | null;
  statusMessage: string;
  selectedSquare: Square | null;
  revivingPieces: Array<{ pieceState: PieceState; square: Square; turnsLeft: number }>;
}
