import { useState } from 'react';
import type { Skill, PieceType, Color } from '../types';
import { useGameStore } from '../store';
import SkillCard from './SkillCard';
import { PIECE_MAX_SLOTS } from '../constants';
import { getPieceKey } from '../gameLogic';

const PIECE_LABELS: Record<PieceType, string> = {
  p: 'ポーン', n: 'ナイト', b: 'ビショップ', r: 'ルーク', q: 'クイーン', k: 'キング',
};

function getPieceIconsForColor(color: Color) {
  return {
    'p': color === 'white' ? '♙' : '♟',
    'n': color === 'white' ? '♘' : '♞',
    'b': color === 'white' ? '♗' : '♝',
    'r': color === 'white' ? '♖' : '♜',
    'q': color === 'white' ? '♕' : '♛',
    'k': color === 'white' ? '♔' : '♚',
  };
}

export default function DraftScreen() {
  const draft = useGameStore(s => s.draft);
  const botColor = useGameStore(s => s.botColor);
  const chess = useGameStore(s => s.chess);
  const statusMessage = useGameStore(s => s.statusMessage);
  const selectSkillForDraft = useGameStore(s => s.selectSkillForDraft);
  const confirmDraftPicks = useGameStore(s => s.confirmDraftPicks);
  const assignSkillToPiece = useGameStore(s => s.assignSkillToPiece);
  const confirmAssignments = useGameStore(s => s.confirmAssignments);

  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const humanColor = botColor === 'white' ? 'black' : 'white';
  const isPickingPhase = draft.phase === 'picking';
  const isAssigningPhase = draft.phase === 'assigning';
  const isHumanTurn = draft.currentPicker === humanColor;

  const humanHand = humanColor === 'white' ? draft.whiteHand : draft.blackHand;
  const humanPicks = humanColor === 'white' ? draft.whitePicks : draft.blackPicks;
  const humanAssignments = humanColor === 'white' ? draft.whiteAssignments : draft.blackAssignments;

  // Build piece list for assignment
  const board = chess.board();
  const humanPieces: Array<{ key: string; type: PieceType; colIndex: number; label: string }> = [];
  const seen = new Map<string, number>();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      if (piece.color !== (humanColor === 'white' ? 'w' : 'b')) continue;
      const key = getPieceKey(piece.type as PieceType, c, humanColor);
      const count = (seen.get(piece.type) || 0) + 1;
      seen.set(piece.type, count);
      const label = `${PIECE_LABELS[piece.type as PieceType]}${count > 1 ? count : ''}`;
      humanPieces.push({ key, type: piece.type as PieceType, colIndex: c, label });
    }
  }

  const icons = getPieceIconsForColor(humanColor);
  const assignedSkills = Array.from(humanAssignments.values()).flat();
  const unassignedPicks = humanPicks.filter(s => !assignedSkills.includes(s));

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-yellow-400 mb-1">ドラフトフェーズ</h1>
          <p className="text-gray-400">{statusMessage}</p>
        </div>

        {isPickingPhase && (
          <div className="space-y-6">
            {isHumanTurn ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">手札（{humanPicks.length}/5枚選択）</h2>
                  <button
                    onClick={confirmDraftPicks}
                    disabled={humanPicks.length !== 5}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      humanPicks.length === 5
                        ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    決定 ({humanPicks.length}/5)
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {humanHand.map((skill, i) => {
                    const isPicked = humanPicks.includes(skill);
                    return (
                      <SkillCard
                        key={`${skill.id}-${i}`}
                        skill={skill}
                        selected={isPicked}
                        disabled={!isPicked && humanPicks.length >= 5}
                        onClick={() => {
                          if (isPicked) return;
                          selectSkillForDraft(skill);
                        }}
                      />
                    );
                  })}
                </div>

                {humanPicks.length > 0 && (
                  <div>
                    <h3 className="text-sm text-gray-400 mb-2">選択中のスキル</h3>
                    <div className="flex flex-wrap gap-2">
                      {humanPicks.map((s, i) => (
                        <SkillCard key={i} skill={s} compact />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <div className="text-4xl mb-4 animate-pulse">🤖</div>
                  <p className="text-gray-400">Botがスキルを選んでいます...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {isAssigningPhase && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">スキルを駒に割り当て</h2>
              <button
                onClick={confirmAssignments}
                className="px-4 py-2 rounded-lg font-medium bg-yellow-500 text-black hover:bg-yellow-400 transition-all"
              >
                ゲーム開始！
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Unassigned skills */}
              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">未割り当てスキル（クリックして選択）</h3>
                <div className="space-y-2">
                  {unassignedPicks.map((skill, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedSkill(selectedSkill === skill ? null : skill)}
                      className={`cursor-pointer rounded-lg p-2 transition-all ${selectedSkill === skill ? 'ring-2 ring-yellow-400 bg-gray-700' : 'bg-gray-750 hover:bg-gray-700'}`}
                    >
                      <SkillCard skill={skill} compact />
                    </div>
                  ))}
                  {unassignedPicks.length === 0 && (
                    <p className="text-gray-500 text-sm">全スキルが割り当て済みです</p>
                  )}
                </div>
              </div>

              {/* Piece assignment */}
              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">
                  駒スロット{selectedSkill ? `（${selectedSkill.name.ja}を割り当て先を選択）` : ''}
                </h3>
                <div className="space-y-2">
                  {humanPieces.map(piece => {
                    const assigned = humanAssignments.get(piece.key) || [];
                    const maxSlots = PIECE_MAX_SLOTS[piece.type];
                    const canAssign = selectedSkill && assigned.length < maxSlots &&
                      (piece.type !== 'k' || selectedSkill.category === 'defense');
                    return (
                      <div
                        key={piece.key}
                        className={`rounded-lg p-3 flex items-center gap-3 transition-all ${
                          canAssign ? 'bg-gray-700 cursor-pointer hover:bg-gray-600 ring-1 ring-yellow-500' : 'bg-gray-750'
                        }`}
                        onClick={() => {
                          if (canAssign && selectedSkill) {
                            assignSkillToPiece(piece.key, selectedSkill);
                            setSelectedSkill(null);
                          }
                        }}
                      >
                        <span className="text-2xl">{icons[piece.type]}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{piece.label}</span>
                            <span className="text-xs text-gray-400">({assigned.length}/{maxSlots}スロット)</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {assigned.map((s, i) => (
                              <SkillCard key={i} skill={s} compact />
                            ))}
                            {Array(maxSlots - assigned.length).fill(0).map((_, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded-full border border-dashed border-gray-600 text-gray-500">
                                空きスロット
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
