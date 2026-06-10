import { useMemo, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import type { Square } from '../types';
import { useGameStore } from '../store';
import { GEM_COLORS, CATEGORY_COLORS } from '../constants';

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

  const humanColor = botColor === 'white' ? 'black' : 'white';
  const isHumanTurn = currentTurn === humanColor;
  const canInteract = phase === 'playing' && isHumanTurn && !pendingAbsorb && !pendingLevelUp;

  const legalMoves = useMemo(() => {
    if (!selectedSquare || !canInteract) return [];
    return chess.moves({ square: selectedSquare as any, verbose: true }).map(m => m.to);
  }, [selectedSquare, chess, canInteract]);

  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    if (selectedSquare) {
      styles[selectedSquare] = { backgroundColor: 'rgba(255, 204, 0, 0.5)' };
    }

    for (const sq of legalMoves) {
      const hasPiece = chess.get(sq as any);
      styles[sq] = {
        background: hasPiece
          ? 'radial-gradient(circle, rgba(255,80,80,0.6) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(100,255,100,0.5) 20%, transparent 80%)',
      };
    }

    return styles;
  }, [selectedSquare, legalMoves, chess]);

  const onSquareClick = useCallback(({ square }: { square: string; piece: unknown }) => {
    if (!canInteract) return;
    const sq = square as Square;

    if (selectedSquare) {
      if ((legalMoves as string[]).includes(square)) {
        makeMove(selectedSquare, sq);
        setSelectedSquare(null);
        return;
      }
    }

    const piece = chess.get(square as any);
    if (piece && piece.color === (humanColor === 'white' ? 'w' : 'b')) {
      setSelectedSquare(sq === selectedSquare ? null : sq);
    } else {
      setSelectedSquare(null);
    }
  }, [canInteract, selectedSquare, legalMoves, makeMove, chess, humanColor, setSelectedSquare]);

  const onPieceDrop = useCallback(({ sourceSquare, targetSquare }: { piece: unknown; sourceSquare: string; targetSquare: string | null }) => {
    if (!canInteract || !targetSquare) return false;
    const piece = chess.get(sourceSquare as any);
    if (!piece || piece.color !== (humanColor === 'white' ? 'w' : 'b')) return false;
    return makeMove(sourceSquare as Square, targetSquare as Square);
  }, [canInteract, chess, humanColor, makeMove]);

  return (
    <div className="relative">
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
      {/* Gem overlays */}
      <GemOverlay gems={gems} boardOrientation={humanColor} />
      {/* Skill dot overlays */}
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
          const gemType = gems.get(sq) as keyof typeof GEM_COLORS | undefined;
          return (
            <div key={sq} className="relative flex items-end justify-end p-0.5">
              {gemType && (
                <div
                  className="w-3 h-3 rounded-full opacity-90 shadow-lg animate-pulse"
                  style={{
                    backgroundColor: GEM_COLORS[gemType],
                    boxShadow: `0 0 6px ${GEM_COLORS[gemType]}`,
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
            <div key={sq} className="relative flex items-start justify-start p-0.5">
              <div className="flex gap-0.5">
                {skills.slice(0, 3).map((s, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full border border-gray-900"
                    style={{ backgroundColor: CATEGORY_COLORS[s.category as keyof typeof CATEGORY_COLORS] }}
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
