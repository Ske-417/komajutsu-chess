import { useMemo, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import type { Square } from '../types';
import { useGameStore } from '../store';
import { CATEGORY_COLORS } from '../constants';
import { getAdjacentSquares } from '../gameLogic';

const GEM_COLORS: Record<string, string> = {
  blue: 'var(--skill-move)',
  red: 'var(--skill-combat)',
  green: 'var(--skill-defense)',
  gold: 'var(--accent)',
};

const GEM_GLOW: Record<string, string> = {
  blue: 'rgba(91,156,246,0.7)',
  red: 'rgba(240,112,112,0.7)',
  green: 'rgba(61,201,180,0.7)',
  gold: 'rgba(228,184,75,0.9)',
};

export default function ChessBoard() {
  const chess = useGameStore(s => s.chess);
  const pieces = useGameStore(s => s.pieces);
  const gems = useGameStore(s => s.gems);
  const selectedSquare = useGameStore(s => s.selectedSquare);
  const currentTurn = useGameStore(s => s.currentTurn);
  const botColor = useGameStore(s => s.botColor);
  const makeMove = useGameStore(s => s.makeMove);
  const setSelectedSquare = useGameStore(s => s.setSelectedSquare);
  const phase = useGameStore(s => s.phase);
  const pendingAbsorb = useGameStore(s => s.pendingAbsorb);
  const pendingLevelUp = useGameStore(s => s.pendingLevelUp);
  const pendingSkillActivation = useGameStore(s => s.pendingSkillActivation);
  const executeSkillTarget = useGameStore(s => s.executeSkillTarget);
  const cancelSkillActivation = useGameStore(s => s.cancelSkillActivation);

  const humanColor = botColor === 'white' ? 'black' : 'white';
  const isHumanTurn = currentTurn === humanColor;
  const isSkillMode = !!pendingSkillActivation;
  const canInteract = phase === 'playing' && isHumanTurn && !pendingAbsorb && !pendingLevelUp && !isSkillMode;

  const legalMoves = useMemo(() => {
    if (!selectedSquare || !canInteract) return [];
    return chess.moves({ square: selectedSquare as any, verbose: true }).map(m => m.to);
  }, [selectedSquare, chess, canInteract]);

  // Highlight valid targets when in skill activation mode
  const skillTargetSquares = useMemo(() => {
    if (!isSkillMode || !pendingSkillActivation) return new Set<string>();
    const { pieceSquare, skillId } = pendingSkillActivation;
    const piece = pieces.get(pieceSquare);
    if (!piece) return new Set<string>();
    const chessColor = piece.color === 'white' ? 'w' : 'b';
    const targets = new Set<string>();

    if (skillId === 'mist-step') {
      const skill = piece.skills.find(s => s.id === 'mist-step');
      for (let f = 0; f < 8; f++) {
        for (let r = 1; r <= 8; r++) {
          const sq = String.fromCharCode('a'.charCodeAt(0) + f) + r;
          const p = chess.get(sq as any);
          if (!p) targets.add(sq);
          else if (skill && skill.level >= 3 && p.color !== chessColor) targets.add(sq);
        }
      }
    } else if (skillId === 'bind' || skillId === 'phantom' || skillId === 'shadow-clone') {
      const adj = getAdjacentSquares(pieceSquare);
      for (const sq of adj) {
        const p = chess.get(sq as any);
        if (skillId === 'bind' && p && p.color !== chessColor) targets.add(sq);
        if ((skillId === 'phantom' || skillId === 'shadow-clone') && !p) targets.add(sq);
      }
    } else if (skillId === 'curse-mark') {
      for (let f = 0; f < 8; f++) {
        for (let r = 1; r <= 8; r++) {
          const sq = String.fromCharCode('a'.charCodeAt(0) + f) + r;
          const p = chess.get(sq as any);
          if (p && p.color !== chessColor) targets.add(sq);
        }
      }
    } else if (skillId === 'shield-wall') {
      // Any square triggers it (auto-applies)
      targets.add(pieceSquare);
    }
    return targets;
  }, [isSkillMode, pendingSkillActivation, pieces, chess]);

  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    if (isSkillMode && pendingSkillActivation) {
      styles[pendingSkillActivation.pieceSquare] = { backgroundColor: 'rgba(228,184,75,0.45)' };
      for (const sq of skillTargetSquares) {
        const hasPiece = chess.get(sq as any);
        styles[sq] = {
          background: hasPiece
            ? 'radial-gradient(circle, rgba(184,125,232,0.65) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(184,125,232,0.4) 22%, transparent 70%)',
        };
      }
      return styles;
    }

    if (selectedSquare) {
      styles[selectedSquare] = { backgroundColor: 'rgba(228,184,75,0.35)' };
    }
    for (const sq of legalMoves) {
      const hasPiece = chess.get(sq as any);
      styles[sq] = {
        background: hasPiece
          ? 'radial-gradient(circle, rgba(240,112,112,0.55) 0%, transparent 65%)'
          : 'radial-gradient(circle, rgba(228,184,75,0.35) 22%, transparent 70%)',
      };
    }
    return styles;
  }, [selectedSquare, legalMoves, chess, isSkillMode, pendingSkillActivation, skillTargetSquares]);

  const onSquareClick = useCallback(({ square }: { square: string; piece: unknown }) => {
    if (isSkillMode) {
      if (skillTargetSquares.has(square) || pendingSkillActivation?.skillId === 'shield-wall') {
        executeSkillTarget(square as Square);
      } else {
        cancelSkillActivation();
      }
      return;
    }
    if (!canInteract) return;
    const sq = square as Square;
    if (selectedSquare && (legalMoves as string[]).includes(square)) {
      makeMove(selectedSquare, sq);
      setSelectedSquare(null);
      return;
    }
    const piece = chess.get(square as any);
    if (piece && piece.color === (humanColor === 'white' ? 'w' : 'b')) {
      setSelectedSquare(sq === selectedSquare ? null : sq);
    } else {
      setSelectedSquare(null);
    }
  }, [isSkillMode, skillTargetSquares, pendingSkillActivation, executeSkillTarget, cancelSkillActivation,
      canInteract, selectedSquare, legalMoves, makeMove, chess, humanColor, setSelectedSquare]);

  const onPieceDrop = useCallback(({ sourceSquare, targetSquare }: { piece: unknown; sourceSquare: string; targetSquare: string | null }) => {
    if (!canInteract || !targetSquare) return false;
    const piece = chess.get(sourceSquare as any);
    if (!piece || piece.color !== (humanColor === 'white' ? 'w' : 'b')) return false;
    return makeMove(sourceSquare as Square, targetSquare as Square);
  }, [canInteract, chess, humanColor, makeMove]);

  return (
    <div className="relative rounded-xl overflow-hidden"
      style={{ boxShadow: '0 0 0 1px var(--border), 0 8px 32px rgba(0,0,0,0.5)' }}>
      <Chessboard
        options={{
          position: chess.fen(),
          onSquareClick,
          onPieceDrop,
          boardOrientation: humanColor as 'white' | 'black',
          squareStyles,
          animationDurationInMs: 150,
          allowDrawingArrows: false,
        }}
      />
      <GemOverlay gems={gems} boardOrientation={humanColor} />
      <SkillDotOverlay pieces={pieces} boardOrientation={humanColor} />
    </div>
  );
}

function GemOverlay({ gems, boardOrientation }: { gems: Map<string, any>; boardOrientation: string }) {
  if (gems.size === 0) return null;
  return (
    <div className="absolute inset-0 pointer-events-none"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gridTemplateRows: 'repeat(8, 1fr)' }}>
      {Array(8).fill(0).map((_, rowIdx) =>
        Array(8).fill(0).map((_, colIdx) => {
          const rank = boardOrientation === 'white' ? 8 - rowIdx : rowIdx + 1;
          const file = boardOrientation === 'white' ? colIdx : 7 - colIdx;
          const sq = String.fromCharCode('a'.charCodeAt(0) + file) + rank;
          const gemType = gems.get(sq) as string | undefined;
          return (
            <div key={sq} className="relative flex items-end justify-end" style={{ padding: '3px' }}>
              {gemType && (
                <div
                  className="rounded-full animate-pulse"
                  style={{
                    width: '10px', height: '10px',
                    background: GEM_COLORS[gemType],
                    boxShadow: `0 0 6px 2px ${GEM_GLOW[gemType]}`,
                  }}
                  title={`${gemType}宝石`}
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function SkillDotOverlay({ pieces, boardOrientation }: { pieces: Map<string, any>; boardOrientation: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gridTemplateRows: 'repeat(8, 1fr)' }}>
      {Array(8).fill(0).map((_, rowIdx) =>
        Array(8).fill(0).map((_, colIdx) => {
          const rank = boardOrientation === 'white' ? 8 - rowIdx : rowIdx + 1;
          const file = boardOrientation === 'white' ? colIdx : 7 - colIdx;
          const sq = String.fromCharCode('a'.charCodeAt(0) + file) + rank;
          const pieceState = pieces.get(sq);
          const skills: any[] = pieceState?.skills || [];
          return (
            <div key={sq} className="relative flex items-start justify-start" style={{ padding: '3px' }}>
              <div className="flex gap-0.5">
                {skills.slice(0, 3).map((s, i) => (
                  <div
                    key={i}
                    className="rounded-full"
                    style={{
                      width: '6px', height: '6px',
                      background: CATEGORY_COLORS[s.category as keyof typeof CATEGORY_COLORS],
                      boxShadow: `0 0 3px ${CATEGORY_COLORS[s.category as keyof typeof CATEGORY_COLORS]}`,
                    }}
                    title={`${s.name.ja} Lv${s.level}`}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
