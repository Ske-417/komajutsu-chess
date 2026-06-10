import { Chess } from 'chess.js';
import type { Color, PieceType, Square, Skill, GameState, Difficulty } from './types';
import { PIECE_VALUES, SKILL_BASE_VALUES } from './constants';
import { squareDistance } from './gameLogic';
import type { PieceState } from './types';

const LV_MULTIPLIER = [0, 1.0, 1.5, 2.0];

function skillBonus(skills: Skill[]): number {
  return skills.reduce((sum, s) => sum + SKILL_BASE_VALUES[s.category] * LV_MULTIPLIER[s.level], 0);
}

function evaluateBoard(chess: Chess, pieces: Map<Square, PieceState>, gems: Map<Square, string>, color: Color): number {
  let score = 0;
  const board = chess.board();
  const chessColor = color === 'white' ? 'w' : 'b';

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const file = String.fromCharCode('a'.charCodeAt(0) + c);
      const rank = (8 - r).toString();
      const sq = (file + rank) as Square;
      const pv = PIECE_VALUES[piece.type as PieceType];
      const ps = pieces.get(sq);
      const sb = ps ? skillBonus(ps.skills) : 0;
      const slotFull = ps && ps.skills.length >= ps.maxSlots ? 50 : 0;
      const val = pv + sb + slotFull;
      score += piece.color === chessColor ? val : -val;
    }
  }

  // Gem proximity bonus
  const gemSquares = Array.from(gems.keys());
  const board2 = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board2[r][c];
      if (!piece || piece.color !== chessColor) continue;
      const file = String.fromCharCode('a'.charCodeAt(0) + c);
      const rank = (8 - r).toString();
      const sq = file + rank as Square;
      if (gemSquares.length > 0) {
        const minDist = Math.min(...gemSquares.map(g => squareDistance(sq, g)));
        score += Math.max(0, (4 - minDist) * 5);
      }
    }
  }

  // Mobility bonus
  score += chess.moves().length * 2;

  return score;
}

function minimax(
  chess: Chess,
  pieces: Map<Square, PieceState>,
  gems: Map<Square, string>,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  botColor: Color
): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluateBoard(chess, pieces, gems, botColor);
  }

  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return evaluateBoard(chess, pieces, gems, botColor);

  if (maximizing) {
    let maxVal = -Infinity;
    for (const move of moves) {
      const chessCopy = new Chess(chess.fen());
      chessCopy.move(move);
      const val = minimax(chessCopy, pieces, gems, depth - 1, alpha, beta, false, botColor);
      maxVal = Math.max(maxVal, val);
      alpha = Math.max(alpha, val);
      if (beta <= alpha) break;
    }
    return maxVal;
  } else {
    let minVal = Infinity;
    for (const move of moves) {
      const chessCopy = new Chess(chess.fen());
      chessCopy.move(move);
      const val = minimax(chessCopy, pieces, gems, depth - 1, alpha, beta, true, botColor);
      minVal = Math.min(minVal, val);
      beta = Math.min(beta, val);
      if (beta <= alpha) break;
    }
    return minVal;
  }
}

export function getBotMove(
  chess: Chess,
  state: GameState,
  difficulty: Difficulty
): string | null {
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;

  if (difficulty === 'easy') {
    // 30% random
    if (Math.random() < 0.3) {
      return moves[Math.floor(Math.random() * moves.length)].san;
    }
    // Otherwise pick best with depth 1
    let best = moves[0];
    let bestScore = -Infinity;
    for (const move of moves) {
      const chessCopy = new Chess(chess.fen());
      chessCopy.move(move);
      const score = evaluateBoard(chessCopy, state.pieces, state.gems, state.botColor!);
      if (score > bestScore) {
        bestScore = score;
        best = move;
      }
    }
    return best.san;
  }

  const depth = difficulty === 'medium' ? 3 : 5;
  const botColor = state.botColor!;

  let bestMove = moves[0];
  let bestScore = -Infinity;

  // Gem priority: check if any move lands on a gem
  const gemMoves = moves.filter(m => state.gems.has(m.to));
  const candidateMoves = difficulty === 'hard' && gemMoves.length > 0
    ? [...gemMoves, ...moves.slice(0, 10)]
    : moves;

  for (const move of candidateMoves) {
    const chessCopy = new Chess(chess.fen());
    chessCopy.move(move);
    const score = minimax(chessCopy, state.pieces, state.gems, depth - 1, -Infinity, Infinity, false, botColor);
    // Gem bonus
    const gemBonus = state.gems.has(move.to) ? 30 : 0;
    // Absorption bonus (Hard)
    let absorbBonus = 0;
    if (difficulty === 'hard' && move.captured) {
      const victimSq = move.to as Square;
      const victim = state.pieces.get(victimSq);
      if (victim && victim.skills.length > 0) {
        absorbBonus = 40;
      }
    }
    const totalScore = score + gemBonus + absorbBonus;
    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMove = move;
    }
  }

  return bestMove.san;
}

export function botDraftPick(available: Skill[], myPicks: Skill[], _opponentPicks: Skill[]): Skill {
  function getBaseValue(s: Skill): number {
    return SKILL_BASE_VALUES[s.category];
  }
  function getSynergyBonus(s: Skill, picks: Skill[]): number {
    return picks.some(p => p.category === s.category) ? 10 : 0;
  }

  const scored = available.map(s => ({
    skill: s,
    score: getBaseValue(s) + getSynergyBonus(s, myPicks),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0].skill;
}

export function botAssignSkills(
  picks: Skill[],
  pieceTypes: Array<{ key: string; type: PieceType; maxSlots: number }>
): Map<string, Skill[]> {
  const assignments = new Map<string, Skill[]>();

  // Assign combat skills to high-value pieces (queen, rook, knight)
  const priority: PieceType[] = ['q', 'r', 'n', 'b', 'p', 'k'];
  const sortedPieces = [...pieceTypes].sort((a, b) =>
    priority.indexOf(a.type) - priority.indexOf(b.type)
  );

  const remaining = [...picks];
  for (const piece of sortedPieces) {
    if (remaining.length === 0) break;
    const slots = piece.maxSlots;
    const assigned: Skill[] = [];
    // King only gets defense
    const eligible = piece.type === 'k'
      ? remaining.filter(s => s.category === 'defense')
      : remaining;
    for (let i = 0; i < slots && eligible.length > 0; i++) {
      const idx = remaining.indexOf(eligible[0]);
      if (idx >= 0) {
        assigned.push(remaining.splice(idx, 1)[0]);
        eligible.shift();
      }
    }
    if (assigned.length > 0) {
      assignments.set(piece.key, assigned);
    }
  }
  return assignments;
}
