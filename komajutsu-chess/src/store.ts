import { create } from 'zustand';
import { Chess } from 'chess.js';
import type {
  GameState, Color, Square, Skill, Difficulty, PieceType,
} from './types';
import {
  buildInitialPieces, buildInitialGems, createDeck, dealHands,
  addExp, applyDraftAssignmentsToPieces, getAdjacentSquares, getRandomSkillByCategory, getRandomSkillAny,
  getPieceKey, flipChessTurn, ACTIVE_SKILL_IDS,
} from './gameLogic';
import { GEM_EXP, PIECE_MAX_SLOTS } from './constants';
import { getBotMove, botDraftPick, botAssignSkills } from './botAI';

interface BotMethods {
  doBotDraft: () => void;
  doBotAssign: () => void;
  doBotMove: () => void;
}

interface StoreActions {
  startGame: (botDifficulty: Difficulty, botColor: Color) => void;
  selectSkillForDraft: (skill: Skill) => void;
  confirmDraftPicks: () => void;
  assignSkillToPiece: (pieceKey: string, skill: Skill) => void;
  confirmAssignments: () => void;
  makeMove: (from: Square, to: Square) => boolean;
  absorbSkill: (skill: Skill | null) => void;
  levelUpChoice: (skillId: string) => void;
  setSelectedSquare: (sq: Square | null) => void;
  resetGame: () => void;
  startSkillActivation: (skillId: string) => void;
  cancelSkillActivation: () => void;
  executeSkillTarget: (targetSquare: Square) => void;
}

type StoreState = GameState & StoreActions & BotMethods & { chess: Chess };

const initialChess = new Chess();

const emptyGameState: GameState = {
  phase: 'title',
  pieces: new Map(),
  gems: new Map(),
  currentTurn: 'white',
  turnNumber: 1,
  winner: null,
  botColor: null,
  botDifficulty: 'medium',
  draft: {
    whiteHand: [],
    blackHand: [],
    whitePicks: [],
    blackPicks: [],
    whiteAssignments: new Map(),
    blackAssignments: new Map(),
    phase: 'picking',
    currentPicker: 'white',
  },
  pendingAbsorb: null,
  pendingLevelUp: null,
  pendingSkillActivation: null,
  statusMessage: '',
  selectedSquare: null,
  revivingPieces: [],
};

export const useGameStore = create<StoreState>((set, get) => ({
  chess: initialChess,
  ...emptyGameState,

  setSelectedSquare: (sq) => set(() => ({ selectedSquare: sq })),

  resetGame: () => {
    const chess = new Chess();
    set(() => ({ ...emptyGameState, chess }));
  },

  startGame: (botDifficulty, botColor) => {
    const chess = new Chess();
    const deck = createDeck();
    const { whiteHand, blackHand } = dealHands(deck);

    set(() => ({
      chess,
      phase: 'draft',
      pieces: buildInitialPieces(chess),
      gems: buildInitialGems(),
      currentTurn: 'white',
      turnNumber: 1,
      winner: null,
      botColor,
      botDifficulty,
      selectedSquare: null,
      pendingAbsorb: null,
      pendingLevelUp: null,
      pendingSkillActivation: null,
      revivingPieces: [],
      statusMessage: 'ドラフトフェーズ: スキルを5枚選んでください',
      draft: {
        whiteHand,
        blackHand,
        whitePicks: [],
        blackPicks: [],
        whiteAssignments: new Map(),
        blackAssignments: new Map(),
        phase: 'picking',
        currentPicker: 'white',
      },
    }));

    if (botColor === 'white') {
      setTimeout(() => get().doBotDraft(), 300);
    }
  },

  selectSkillForDraft: (skill) => {
    const state = get();
    if (state.draft.phase !== 'picking') return;
    const color = state.draft.currentPicker;
    if (color === state.botColor) return;

    const picks = color === 'white' ? state.draft.whitePicks : state.draft.blackPicks;

    // Toggle: already picked → remove it
    const isAlreadyPicked = picks.includes(skill);
    const newPicks = isAlreadyPicked
      ? picks.filter(p => p !== skill)
      : picks.length >= 5 ? picks : [...picks, skill];

    set((s) => ({
      draft: {
        ...s.draft,
        whitePicks: color === 'white' ? newPicks : s.draft.whitePicks,
        blackPicks: color === 'black' ? newPicks : s.draft.blackPicks,
      },
    }));
  },

  confirmDraftPicks: () => {
    const state = get();
    const color = state.draft.currentPicker;
    const picks = color === 'white' ? state.draft.whitePicks : state.draft.blackPicks;
    if (picks.length !== 5) return;

    const otherColor: Color = color === 'white' ? 'black' : 'white';
    const otherPicks = otherColor === 'white' ? state.draft.whitePicks : state.draft.blackPicks;

    if (otherPicks.length === 0) {
      // Other player hasn't picked yet
      set((s) => ({
        draft: { ...s.draft, currentPicker: otherColor },
        statusMessage: state.botColor === otherColor ? '相手のドラフト中...' : 'ドラフトフェーズ: スキルを5枚選んでください',
      }));
      if (state.botColor === otherColor) {
        setTimeout(() => get().doBotDraft(), 500);
      }
    } else {
      // Both have picked
      set((s) => ({
        draft: { ...s.draft, phase: 'assigning' },
        statusMessage: 'スキルを駒に割り当ててください',
      }));
      if (state.botColor) {
        setTimeout(() => get().doBotAssign(), 300);
      }
    }
  },

  assignSkillToPiece: (pieceKey, skill) => {
    const state = get();
    if (state.draft.phase !== 'assigning') return;
    const humanColor: Color = state.botColor === 'white' ? 'black' : 'white';
    const assignments = humanColor === 'white' ? state.draft.whiteAssignments : state.draft.blackAssignments;

    const parts = pieceKey.split('-');
    const pieceType = parts[0] as PieceType;
    const maxSlots = PIECE_MAX_SLOTS[pieceType];
    const currentAssigned = assignments.get(pieceKey) || [];
    if (currentAssigned.length >= maxSlots) return;

    // Check skill isn't already assigned somewhere
    const allAssigned = Array.from(assignments.values()).flat();
    if (allAssigned.includes(skill)) return;

    const humanPicks = humanColor === 'white' ? state.draft.whitePicks : state.draft.blackPicks;
    if (!humanPicks.includes(skill)) return;

    const newAssignments = new Map(assignments);
    newAssignments.set(pieceKey, [...currentAssigned, skill]);

    set((s) => ({
      draft: {
        ...s.draft,
        whiteAssignments: humanColor === 'white' ? newAssignments : s.draft.whiteAssignments,
        blackAssignments: humanColor === 'black' ? newAssignments : s.draft.blackAssignments,
      },
    }));
  },

  confirmAssignments: () => {
    const state = get();
    if (state.draft.phase !== 'assigning') return;

    const chess = state.chess;
    const pieces = applyDraftAssignmentsToPieces(
      state.pieces, chess, state.draft.whiteAssignments, state.draft.blackAssignments
    );

    const updatedPieces = new Map(pieces);
    for (const [sq, piece] of updatedPieces) {
      const armorSkill = piece.skills.find(s => s.id === 'armor');
      const mistStep = piece.skills.find(s => s.id === 'mist-step');
      let updated = { ...piece };
      if (armorSkill) updated = { ...updated, armorCharges: armorSkill.level };
      if (mistStep) updated = { ...updated, mistStepUses: mistStep.level };
      updatedPieces.set(sq, updated);
    }

    set(() => ({
      phase: 'playing',
      pieces: updatedPieces,
      draft: { ...state.draft, phase: 'done' },
      statusMessage: 'ゲーム開始！白の番です',
      currentTurn: 'white',
    }));

    if (state.botColor === 'white') {
      setTimeout(() => get().doBotMove(), 500);
    }
  },

  makeMove: (from, to) => {
    const state = get();
    if (state.phase !== 'playing') return false;
    if (state.pendingAbsorb || state.pendingLevelUp) return false;

    const chess = state.chess;
    const fromPiece = chess.get(from as any);
    if (!fromPiece) return false;

    const movingPieceState = state.pieces.get(from);
    if (!movingPieceState) return false;
    if (movingPieceState.isBound) {
      set(() => ({ statusMessage: 'この駒は呪縛中で動けません！' }));
      return false;
    }

    const victimPiece = chess.get(to as any);
    const victimState = state.pieces.get(to);

    // Armor check — blocks capture but still advances the turn
    if (victimState?.armorCharges && victimState.armorCharges > 0) {
      const newPieces = new Map(state.pieces);
      const newCharges = victimState.armorCharges - 1;
      if (newCharges <= 0) {
        const skills = victimState.skills.filter(s => s.id !== 'armor');
        newPieces.set(to, { ...victimState, armorCharges: 0, skills });
      } else {
        newPieces.set(to, { ...victimState, armorCharges: newCharges });
      }
      // Flip turn so the attacker consumes their move
      flipChessTurn(chess);
      const nextTurn: Color = chess.turn() === 'w' ? 'white' : 'black';
      set(() => ({
        pieces: newPieces,
        currentTurn: nextTurn,
        turnNumber: state.turnNumber + 1,
        statusMessage: '🛡 鎧スキルが攻撃を防いだ！',
        selectedSquare: null,
      }));
      if (state.botColor === nextTurn) {
        setTimeout(() => get().doBotMove(), 600);
      }
      return true;
    }

    let move;
    try {
      const promotionRank = fromPiece.color === 'w' ? '8' : '1';
      const isPromotion = fromPiece.type === 'p' && to[1] === promotionRank;
      move = chess.move({ from, to, promotion: isPromotion ? 'q' : undefined });
    } catch {
      return false;
    }
    if (!move) return false;

    const newPieces = new Map(state.pieces);
    let expGain = victimPiece ? 3 : 1;

    const movedPiece = { ...movingPieceState };

    if (chess.inCheck()) expGain += 2;

    if (victimPiece) newPieces.delete(to);

    // Handle explosion
    if (victimState) {
      const explosionSkill = victimState.skills.find(s => s.id === 'explosion');
      if (explosionSkill) {
        if (explosionSkill.level === 3) {
          for (let df = -1; df <= 1; df++) {
            for (let dr = -1; dr <= 1; dr++) {
              if (df === 0 && dr === 0) continue;
              const f = to.charCodeAt(0) - 'a'.charCodeAt(0) + df;
              const r = parseInt(to[1]) - 1 + dr;
              if (f >= 0 && f < 8 && r >= 0 && r < 8) {
                const sq = String.fromCharCode('a'.charCodeAt(0) + f) + (r + 1);
                const p = chess.get(sq as any);
                if (p && p.color !== victimPiece?.color && p.type !== 'k') {
                  newPieces.delete(sq as Square);
                }
              }
            }
          }
        } else {
          const adj = getAdjacentSquares(to);
          const targets = adj.filter(s => {
            const p = chess.get(s as any);
            return p && p.color !== victimPiece?.color;
          }).slice(0, explosionSkill.level);
          for (const sq of targets) newPieces.delete(sq);
        }
      }
    }

    newPieces.delete(from);
    const expResult = addExp({ ...movedPiece, experience: movedPiece.experience + expGain }, 0);
    newPieces.set(to, expResult.updated);

    let newGems = new Map(state.gems);
    let newPendingLevelUp = null;
    const gemType = state.gems.get(to);
    if (gemType) {
      newGems.delete(to);
      const gemExp = GEM_EXP[gemType];
      const gemSkillCat = gemType === 'blue' ? 'move' : gemType === 'red' ? 'combat' : gemType === 'green' ? 'defense' : null;
      const newSkill = gemSkillCat ? getRandomSkillByCategory(gemSkillCat) : getRandomSkillAny();

      const pieceAfterMove = expResult.updated;
      let updatedPiece = pieceAfterMove;
      if (pieceAfterMove.skills.length < pieceAfterMove.maxSlots) {
        const armorCharges = newSkill.id === 'armor' ? newSkill.level : pieceAfterMove.armorCharges;
        const mistStepUses = newSkill.id === 'mist-step' ? newSkill.level : pieceAfterMove.mistStepUses;
        updatedPiece = { ...pieceAfterMove, skills: [...pieceAfterMove.skills, newSkill], armorCharges, mistStepUses };
      }
      const expRes2 = addExp(updatedPiece, gemExp);
      newPieces.set(to, expRes2.updated);
      if (expRes2.leveledUp && expRes2.choices.length > 0) {
        newPendingLevelUp = { square: to, choices: expRes2.choices };
      }
    }

    let pendingAbsorb = null;
    if (victimState && victimState.skills.length > 0) {
      const attacker = newPieces.get(to);
      if (attacker && attacker.skills.length < attacker.maxSlots) {
        pendingAbsorb = {
          capturingSquare: to,
          capturedSkills: victimState.skills,
        };
      }
    }

    // Regeneration: victim revives
    let revivingPieces = [...state.revivingPieces];
    if (victimState) {
      const regenSkill = victimState.skills.find(s => s.id === 'regeneration');
      if (regenSkill) {
        const turnsLeft = regenSkill.level === 3 ? 1 : regenSkill.level === 2 ? 2 : 3;
        const revivedSkills = regenSkill.level === 3 ? victimState.skills.slice(0, Math.floor(victimState.skills.length / 2)) : [];
        revivingPieces.push({
          pieceState: { ...victimState, skills: revivedSkills },
          square: to,
          turnsLeft,
        });
      }
    }

    // Tick reviving pieces
    revivingPieces = revivingPieces.map(rp => ({ ...rp, turnsLeft: rp.turnsLeft - 1 }));
    const readyToRevive = revivingPieces.filter(rp => rp.turnsLeft <= 0);
    revivingPieces = revivingPieces.filter(rp => rp.turnsLeft > 0);
    for (const rp of readyToRevive) {
      const targetSq = !chess.get(rp.square as any) ? rp.square : getAdjacentSquares(rp.square).find(s => !chess.get(s as any));
      if (targetSq) newPieces.set(targetSq, rp.pieceState);
    }

    // Tick bound pieces
    for (const [sq, ps] of newPieces) {
      if (ps.isBound && ps.boundTurns > 0) {
        const newBound = ps.boundTurns - 1;
        newPieces.set(sq, { ...ps, boundTurns: newBound, isBound: newBound > 0 });
      }
    }

    const isGameOver = chess.isGameOver();
    const winner = isGameOver && chess.isCheckmate()
      ? (chess.turn() === 'w' ? 'black' : 'white')
      : null;

    const nextTurn: Color = chess.turn() === 'w' ? 'white' : 'black';
    const statusMsg = chess.inCheck()
      ? `チェック！ ${nextTurn === 'white' ? '白' : '黒'}の番`
      : `${nextTurn === 'white' ? '白' : '黒'}の番`;

    set(() => ({
      pieces: newPieces,
      gems: newGems,
      currentTurn: nextTurn,
      turnNumber: state.turnNumber + 1,
      winner,
      phase: isGameOver ? 'ended' : 'playing',
      pendingAbsorb,
      pendingLevelUp: newPendingLevelUp,
      selectedSquare: null,
      statusMessage: winner ? `ゲーム終了！${winner === 'white' ? '白' : '黒'}の勝利！` : statusMsg,
      revivingPieces,
    }));

    if (!isGameOver && !pendingAbsorb && !newPendingLevelUp) {
      const stateAfter = get();
      if (stateAfter.botColor === stateAfter.currentTurn) {
        setTimeout(() => get().doBotMove(), 600);
      }
    }

    return true;
  },

  absorbSkill: (skill) => {
    const state = get();
    if (!state.pendingAbsorb) return;

    const newPieces = new Map(state.pieces);
    if (skill) {
      const sq = state.pendingAbsorb.capturingSquare;
      const attacker = newPieces.get(sq);
      if (attacker && attacker.skills.length < attacker.maxSlots) {
        const expRes = addExp({ ...attacker, skills: [...attacker.skills, { ...skill }] }, 2);
        newPieces.set(sq, expRes.updated);
      }
    }

    set(() => ({
      pieces: newPieces,
      pendingAbsorb: null,
      statusMessage: skill ? `スキル「${skill.name.ja}」を吸収した！` : 'スキル吸収をスキップ',
    }));

    const stateAfter = get();
    if (stateAfter.botColor === stateAfter.currentTurn && !stateAfter.pendingLevelUp) {
      setTimeout(() => get().doBotMove(), 600);
    }
  },

  levelUpChoice: (skillId) => {
    const state = get();
    if (!state.pendingLevelUp) return;
    const { square } = state.pendingLevelUp;
    const newPieces = new Map(state.pieces);
    const piece = newPieces.get(square);
    if (!piece) return;

    if (skillId) {
      const upgraded = piece.skills.map(s =>
        s.id === skillId ? { ...s, level: Math.min(3, s.level + 1) as 1 | 2 | 3 } : s
      );
      newPieces.set(square, { ...piece, skills: upgraded });
    }

    set(() => ({
      pieces: newPieces,
      pendingLevelUp: null,
      statusMessage: skillId ? 'スキルがレベルアップ！' : '',
    }));

    const stateAfter = get();
    if (stateAfter.botColor === stateAfter.currentTurn) {
      setTimeout(() => get().doBotMove(), 600);
    }
  },

  // Bot actions
  doBotDraft: () => {
    const state = get();
    const botColor = state.botColor!;
    const hand = botColor === 'white' ? state.draft.whiteHand : state.draft.blackHand;
    const myPicks: Skill[] = [];
    const remaining = [...hand];

    while (myPicks.length < 5 && remaining.length > 0) {
      const pick = botDraftPick(remaining, myPicks, []);
      myPicks.push(pick);
      const idx = remaining.indexOf(pick);
      if (idx >= 0) remaining.splice(idx, 1);
    }

    const otherColor: Color = botColor === 'white' ? 'black' : 'white';
    const otherPicks = otherColor === 'white' ? state.draft.whitePicks : state.draft.blackPicks;

    if (otherPicks.length === 0) {
      set((s) => ({
        draft: {
          ...s.draft,
          whitePicks: botColor === 'white' ? myPicks : s.draft.whitePicks,
          blackPicks: botColor === 'black' ? myPicks : s.draft.blackPicks,
          currentPicker: otherColor,
        },
        statusMessage: 'ドラフトフェーズ: スキルを5枚選んでください',
      }));
    } else {
      set((s) => ({
        draft: {
          ...s.draft,
          whitePicks: botColor === 'white' ? myPicks : s.draft.whitePicks,
          blackPicks: botColor === 'black' ? myPicks : s.draft.blackPicks,
          phase: 'assigning',
        },
        statusMessage: 'スキルを駒に割り当ててください',
      }));
      setTimeout(() => get().doBotAssign(), 300);
    }
  },

  doBotAssign: () => {
    const state = get();
    const botColor = state.botColor!;
    const picks = botColor === 'white' ? state.draft.whitePicks : state.draft.blackPicks;

    const chess = state.chess;
    const board = chess.board();
    const pieceTypes: Array<{ key: string; type: PieceType; maxSlots: number }> = [];
    const chessColor = botColor === 'white' ? 'w' : 'b';

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.color === chessColor) {
          const key = getPieceKey(piece.type as PieceType, c, botColor);
          pieceTypes.push({ key, type: piece.type as PieceType, maxSlots: PIECE_MAX_SLOTS[piece.type as PieceType] });
        }
      }
    }

    const assignments = botAssignSkills(picks, pieceTypes);
    set((s) => ({
      draft: {
        ...s.draft,
        whiteAssignments: botColor === 'white' ? assignments : s.draft.whiteAssignments,
        blackAssignments: botColor === 'black' ? assignments : s.draft.blackAssignments,
      },
    }));
  },

  doBotMove: () => {
    const state = get();
    if (state.phase !== 'playing') return;
    if (state.pendingAbsorb || state.pendingLevelUp) return;
    if (state.currentTurn !== state.botColor) return;

    const chess = state.chess;
    const moveStr = getBotMove(chess, state, state.botDifficulty);
    if (!moveStr) return;

    const moves = chess.moves({ verbose: true });
    const move = moves.find(m => m.san === moveStr);
    if (!move) return;

    get().makeMove(move.from as Square, move.to as Square);
  },

  startSkillActivation: (skillId) => {
    const state = get();
    if (state.phase !== 'playing') return;
    if (state.pendingAbsorb || state.pendingLevelUp || state.pendingSkillActivation) return;
    const humanColor: Color = state.botColor === 'white' ? 'black' : 'white';
    if (state.currentTurn !== humanColor) return;
    if (!state.selectedSquare) return;

    const skill = state.pieces.get(state.selectedSquare)?.skills.find(s => s.id === skillId);
    if (!skill) return;

    // Check usage limits
    if (skillId === 'mist-step') {
      const uses = state.pieces.get(state.selectedSquare)?.mistStepUses ?? 0;
      if (uses <= 0) { set(() => ({ statusMessage: '霞歩の使用回数が残っていません' })); return; }
    }

    const hints: Record<string, string> = {
      'mist-step': '霞歩: ワープ先のマスをクリック',
      'bind': '呪縛: 隣接する敵駒をクリック',
      'shield-wall': '盾壁: 任意のマスをクリックして発動',
      'curse-mark': '呪印: 呪いをかける敵駒をクリック',
      'phantom': '幻影: 隣接する空きマスをクリック',
      'shadow-clone': '影分身: 隣接する空きマスをクリック',
    };
    set(() => ({
      pendingSkillActivation: { pieceSquare: state.selectedSquare!, skillId },
      statusMessage: hints[skillId] ?? 'スキル発動中',
    }));
  },

  cancelSkillActivation: () => {
    set(() => ({ pendingSkillActivation: null, statusMessage: '' }));
  },

  executeSkillTarget: (targetSquare) => {
    const state = get();
    if (!state.pendingSkillActivation) return;
    const { pieceSquare, skillId } = state.pendingSkillActivation;
    const chess = state.chess;
    const piece = state.pieces.get(pieceSquare);
    const chessPiece = chess.get(pieceSquare as any);
    if (!piece || !chessPiece) return;

    const chessColor = piece.color === 'white' ? 'w' : 'b';
    const newPieces = new Map(state.pieces);
    let success = false;
    let msg = '';

    if (skillId === 'mist-step') {
      const skill = piece.skills.find(s => s.id === 'mist-step');
      const uses = piece.mistStepUses ?? 0;
      if (!skill || uses <= 0) return;
      const targetChessPiece = chess.get(targetSquare as any);
      const canTargetEnemy = skill.level >= 3;
      const isEmpty = !targetChessPiece;
      const isEnemy = targetChessPiece && targetChessPiece.color !== chessColor;
      if (targetSquare !== pieceSquare && (isEmpty || (canTargetEnemy && isEnemy))) {
        chess.remove(pieceSquare as any);
        if (isEnemy) { chess.remove(targetSquare as any); newPieces.delete(targetSquare); }
        chess.put({ type: chessPiece.type, color: chessPiece.color }, targetSquare as any);
        newPieces.delete(pieceSquare);
        newPieces.set(targetSquare, { ...piece, mistStepUses: uses - 1 });
        flipChessTurn(chess);
        success = true; msg = '✦ 霞歩で瞬間移動！';
      }
    }

    else if (skillId === 'bind') {
      const skill = piece.skills.find(s => s.id === 'bind');
      if (!skill) return;
      const adj = getAdjacentSquares(pieceSquare);
      const targetPiece = state.pieces.get(targetSquare);
      const targetChess = chess.get(targetSquare as any);
      if (adj.includes(targetSquare) && targetPiece && targetChess && targetChess.color !== chessColor) {
        const turns = skill.level === 1 ? 2 : skill.level === 2 ? 3 : 3;
        newPieces.set(targetSquare, { ...targetPiece, isBound: true, boundTurns: turns });
        flipChessTurn(chess);
        success = true; msg = `⛓ ${targetPiece.type.toUpperCase()}を${turns}ターン拘束！`;
      }
    }

    else if (skillId === 'curse-mark') {
      const targetPiece = state.pieces.get(targetSquare);
      const targetChess = chess.get(targetSquare as any);
      if (targetPiece && targetChess && targetChess.color !== chessColor) {
        // Apply curse: next moves will degrade skills (handled in makeMove)
        newPieces.set(targetSquare, { ...targetPiece, isBound: false, boundTurns: 0 });
        flipChessTurn(chess);
        success = true; msg = '呪印を付与した！';
      }
    }

    else if (skillId === 'shield-wall') {
      // Protect adjacent allies (give them 1 virtual armor charge via shielded field)
      const adj = getAdjacentSquares(pieceSquare);
      const skill = piece.skills.find(s => s.id === 'shield-wall');
      if (!skill) return;
      let count = 0;
      for (const sq of adj) {
        const ally = newPieces.get(sq);
        const allyChess = chess.get(sq as any);
        if (ally && allyChess && allyChess.color === chessColor) {
          const charges = skill.level === 3 ? 999 : skill.level;
          newPieces.set(sq, { ...ally, armorCharges: (ally.armorCharges ?? 0) + charges });
          count++;
        }
      }
      flipChessTurn(chess);
      success = true; msg = `盾壁: ${count}体の駒を保護！`;
    }

    else if (skillId === 'phantom' || skillId === 'shadow-clone') {
      const targetChessPiece = chess.get(targetSquare as any);
      const adj = getAdjacentSquares(pieceSquare);
      if (adj.includes(targetSquare) && !targetChessPiece && !newPieces.get(targetSquare)) {
        chess.put({ type: chessPiece.type, color: chessPiece.color }, targetSquare as any);
        const skill = piece.skills.find(s => s.id === skillId);
        const cloneSkills = (skill && skill.level >= 2) ? [...piece.skills] : [];
        newPieces.set(targetSquare, { ...piece, isPhantom: true, skills: cloneSkills, experience: 0, level: 1 });
        flipChessTurn(chess);
        success = true; msg = `${skillId === 'phantom' ? '幻影' : '影分身'}を生成！`;
      }
    }

    if (success) {
      const nextTurn: Color = chess.turn() === 'w' ? 'white' : 'black';
      set(() => ({
        pieces: newPieces,
        pendingSkillActivation: null,
        currentTurn: nextTurn,
        turnNumber: state.turnNumber + 1,
        statusMessage: msg,
        selectedSquare: null,
      }));
      if (state.botColor === nextTurn) {
        setTimeout(() => get().doBotMove(), 600);
      }
    } else {
      set(() => ({ statusMessage: 'そのマスには使用できません' }));
    }
  },

}));
