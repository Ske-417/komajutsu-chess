import { useGameStore } from '../store';
import type { PieceType, Color } from '../types';
import SkillCard from './SkillCard';

const PIECE_LABELS: Record<PieceType, string> = {
  p: 'ポーン', n: 'ナイト', b: 'ビショップ', r: 'ルーク', q: 'クイーン', k: 'キング',
};

export default function PiecePanel() {
  const selectedSquare = useGameStore(s => s.selectedSquare);
  const pieces = useGameStore(s => s.pieces);
  const botColor = useGameStore(s => s.botColor);
  const currentTurn = useGameStore(s => s.currentTurn);
  const statusMessage = useGameStore(s => s.statusMessage);
  const turnNumber = useGameStore(s => s.turnNumber);

  const humanColor = botColor === 'white' ? 'black' : 'white';
  const pieceState = selectedSquare ? pieces.get(selectedSquare) : null;

  const expThreshold = pieceState ? (pieceState.level === 1 ? 10 : pieceState.level === 2 ? 30 : 30) : 10;
  const expBase = pieceState ? (pieceState.level === 1 ? 0 : pieceState.level === 2 ? 10 : 30) : 0;
  const expProgress = pieceState ? Math.min(1, (pieceState.experience - expBase) / (expThreshold - expBase)) : 0;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Status */}
      <div className="bg-gray-800 rounded-xl p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-400">ターン {turnNumber}</span>
          <span className={`text-sm font-medium ${currentTurn === humanColor ? 'text-green-400' : 'text-red-400'}`}>
            {currentTurn === 'white' ? '⬜ 白' : '⬛ 黒'}の番
          </span>
        </div>
        <p className="text-xs text-gray-300">{statusMessage}</p>
      </div>

      {/* Selected piece info */}
      {pieceState ? (
        <div className="bg-gray-800 rounded-xl p-4 flex-1 overflow-y-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{getPieceIcon(pieceState.type, pieceState.color)}</span>
            <div>
              <div className="font-bold text-white">{PIECE_LABELS[pieceState.type]}</div>
              <div className="text-xs text-gray-400">
                {pieceState.color === 'white' ? '白' : '黒'} ·
                Lv{pieceState.level} ·
                {pieceState.isBound && <span className="text-purple-400 ml-1">呪縛中({pieceState.boundTurns}T)</span>}
              </div>
            </div>
          </div>

          {/* EXP bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>EXP</span>
              <span>{pieceState.experience} / {expThreshold}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${expProgress * 100}%`,
                  backgroundColor: pieceState.level === 1 ? '#3b82f6' : pieceState.level === 2 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500">Lv{pieceState.level}</span>
              {pieceState.level < 3 && <span className="text-gray-500">Lv{pieceState.level + 1}</span>}
            </div>
          </div>

          {/* Slots */}
          <div className="mb-2">
            <div className="text-xs text-gray-400 mb-2">
              スキルスロット ({pieceState.skills.length}/{pieceState.maxSlots})
            </div>
            {pieceState.skills.length > 0 ? (
              <div className="space-y-2">
                {pieceState.skills.map((skill, i) => (
                  <SkillCard key={i} skill={skill} compact={false} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-xs">スキルなし</p>
            )}
            {/* Empty slots */}
            {Array(pieceState.maxSlots - pieceState.skills.length).fill(0).map((_, i) => (
              <div key={i} className="mt-2 border border-dashed border-gray-600 rounded-lg p-3 text-center text-gray-600 text-xs">
                空きスロット
              </div>
            ))}
          </div>

          {/* Special states */}
          {pieceState.armorCharges ? (
            <div className="mt-2 text-xs text-teal-400">🛡 鎧: {pieceState.armorCharges}回残</div>
          ) : null}
          {pieceState.mistStepUses ? (
            <div className="mt-1 text-xs text-blue-400">✨ 霞歩: {pieceState.mistStepUses}回残</div>
          ) : null}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl p-4 flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-sm text-center">駒をクリックして詳細を表示</p>
        </div>
      )}
    </div>
  );
}

function getPieceIcon(type: PieceType, color: Color): string {
  const icons: Record<string, string> = {
    'p-white': '♙', 'n-white': '♘', 'b-white': '♗', 'r-white': '♖', 'q-white': '♕', 'k-white': '♔',
    'p-black': '♟', 'n-black': '♞', 'b-black': '♝', 'r-black': '♜', 'q-black': '♛', 'k-black': '♚',
  };
  return icons[`${type}-${color}`] || '?';
}
