import { Chess } from 'chess.js';
import type { Square, Color, PieceType, GemType, Skill, PieceState } from './types';
import {
  PIECE_MAX_SLOTS, GEM_POSITIONS, ALL_SKILLS, SKILLS_BY_CATEGORY,
} from './constants';

export function initPieceState(type: PieceType, color: Color): PieceState {
  return {
    type,
    color,
    skills: [],
    maxSlots: PIECE_MAX_SLOTS[type],
    experience: 0,
    level: 1,
    isBound: false,
    boundTurns: 0,
    isPhantom: false,
    armorCharges: 0,
    mistStepUses: 0,
    chainCapturesLeft: 0,
  };
}

export function buildInitialPieces(chess: Chess): Map<Square, PieceState> {
  const pieces = new Map<Square, PieceState>();
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        const file = String.fromCharCode('a'.charCodeAt(0) + c);
        const rank = (8 - r).toString();
        const sq = file + rank;
        const color: Color = piece.color === 'w' ? 'white' : 'black';
        pieces.set(sq, initPieceState(piece.type as PieceType, color));
      }
    }
  }
  return pieces;
}

export function buildInitialGems(): Map<Square, GemType> {
  const gems = new Map<Square, GemType>();
  for (const [sq, type] of Object.entries(GEM_POSITIONS)) {
    gems.set(sq, type as GemType);
  }
  return gems;
}

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createDeck(): Skill[] {
  return shuffleArray([...ALL_SKILLS, ...ALL_SKILLS, ...ALL_SKILLS, ...ALL_SKILLS]);
}

export function dealHands(deck: Skill[]): { whiteHand: Skill[]; blackHand: Skill[]; remaining: Skill[] } {
  const d = [...deck];
  const whiteHand = d.splice(0, 8);
  const blackHand = d.splice(0, 8);
  return { whiteHand, blackHand, remaining: d };
}

export function getRandomSkillByCategory(category: string): Skill {
  const skills = SKILLS_BY_CATEGORY[category];
  return { ...skills[Math.floor(Math.random() * skills.length)] };
}

export function getRandomSkillAny(): Skill {
  return { ...ALL_SKILLS[Math.floor(Math.random() * ALL_SKILLS.length)] };
}

export function addExp(pieceState: PieceState, amount: number): { updated: PieceState; leveledUp: boolean; choices: Skill[] } {
  const updated = { ...pieceState, experience: pieceState.experience + amount };
  const thresholds = [0, 10, 30];
  const currentLevel = updated.level;

  if (currentLevel >= 3) return { updated, leveledUp: false, choices: [] };

  const threshold = thresholds[currentLevel];
  if (updated.experience >= threshold) {
    if (updated.skills.length === 0) {
      return { updated: { ...updated, level: currentLevel + 1 }, leveledUp: false, choices: [] };
    }
    const minLv = Math.min(...updated.skills.map(s => s.level));
    const candidates = updated.skills.filter(s => s.level === minLv && s.level < 3);
    if (candidates.length === 0) {
      return { updated: { ...updated, level: currentLevel + 1 }, leveledUp: false, choices: [] };
    }
    if (candidates.length === 1) {
      const upgraded = updated.skills.map(s =>
        s.id === candidates[0].id ? { ...s, level: (s.level + 1) as 1 | 2 | 3 } : s
      );
      return { updated: { ...updated, skills: upgraded }, leveledUp: true, choices: [] };
    }
    return { updated, leveledUp: true, choices: candidates };
  }
  return { updated, leveledUp: false, choices: [] };
}

export function applySkillToAssignment(
  assignments: Map<string, Skill[]>,
  pieceKey: string,
  skill: Skill,
  maxSlots: number
): Map<string, Skill[]> {
  const current = assignments.get(pieceKey) || [];
  if (current.length >= maxSlots) return assignments;
  const next = new Map(assignments);
  next.set(pieceKey, [...current, { ...skill }]);
  return next;
}

export function applyDraftAssignmentsToPieces(
  pieces: Map<Square, PieceState>,
  chess: Chess,
  whiteAssignments: Map<string, Skill[]>,
  blackAssignments: Map<string, Skill[]>
): Map<Square, PieceState> {
  const next = new Map(pieces);
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const file = String.fromCharCode('a'.charCodeAt(0) + c);
      const rank = (8 - r).toString();
      const sq = file + rank;
      const color: Color = piece.color === 'w' ? 'white' : 'black';
      const pieceKey = `${piece.type}-${c}-${color}`;
      const assignments = color === 'white' ? whiteAssignments : blackAssignments;
      const skills = assignments.get(pieceKey) || [];
      const current = next.get(sq);
      if (current) {
        next.set(sq, { ...current, skills: skills.map(s => ({ ...s })) });
      }
    }
  }
  return next;
}


export function getAdjacentSquares(sq: Square): Square[] {
  const file = sq.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = parseInt(sq[1]) - 1;
  const results: Square[] = [];
  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (df === 0 && dr === 0) continue;
      const nf = file + df;
      const nr = rank + dr;
      if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
        results.push(String.fromCharCode('a'.charCodeAt(0) + nf) + (nr + 1).toString());
      }
    }
  }
  return results;
}

export function squareDistance(a: Square, b: Square): number {
  const af = a.charCodeAt(0) - 'a'.charCodeAt(0);
  const ar = parseInt(a[1]) - 1;
  const bf = b.charCodeAt(0) - 'a'.charCodeAt(0);
  const br = parseInt(b[1]) - 1;
  return Math.max(Math.abs(af - bf), Math.abs(ar - br));
}

export function getPieceKey(type: PieceType, colIndex: number, color: Color): string {
  return `${type}-${colIndex}-${color}`;
}

export function getPiecesOnBoard(chess: Chess): Array<{ sq: Square; type: PieceType; color: Color; colIndex: number }> {
  const result = [];
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        const file = String.fromCharCode('a'.charCodeAt(0) + c);
        const rank = (8 - r).toString();
        result.push({
          sq: file + rank as Square,
          type: piece.type as PieceType,
          color: piece.color as Color,
          colIndex: c,
        });
      }
    }
  }
  return result;
}
