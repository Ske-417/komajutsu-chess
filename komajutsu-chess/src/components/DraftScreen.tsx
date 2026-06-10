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
    <div className="min-h-screen chess-grid-bg" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
            {isPickingPhase ? 'PHASE 1' : 'PHASE 2'}
          </p>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-1)' }}>
            {isPickingPhase ? 'スキル選択' : 'スキル割り当て'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>{statusMessage}</p>
        </div>

        {/* Picking Phase */}
        {isPickingPhase && (
          isHumanTurn ? (
            <div className="space-y-6">
              {/* Progress + confirm */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>選択中</span>
                  <div className="flex gap-1">
                    {[0,1,2,3,4].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full transition-colors"
                        style={{ background: i < humanPicks.length ? 'var(--accent)' : 'var(--bg-hover)' }} />
                    ))}
                  </div>
                  <span className="text-sm" style={{ color: 'var(--text-3)' }}>{humanPicks.length} / 5</span>
                </div>
                <button
                  onClick={confirmDraftPicks}
                  disabled={humanPicks.length !== 5}
                  className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={humanPicks.length === 5 ? {
                    background: 'var(--accent)', color: '#0a0a14',
                  } : {
                    background: 'var(--bg-elevated)', color: 'var(--text-3)',
                    border: '1px solid var(--border)', cursor: 'not-allowed',
                  }}
                >
                  決定する
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
                      onClick={() => { if (!isPicked) selectSkillForDraft(skill); }}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 rounded-2xl"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="text-center">
                <div className="text-3xl mb-3 animate-pulse" style={{ color: 'var(--text-3)' }}>◌</div>
                <p className="text-sm" style={{ color: 'var(--text-2)' }}>Botがスキルを選んでいます…</p>
              </div>
            </div>
          )
        )}

        {/* Assigning Phase */}
        {isAssigningPhase && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                {selectedSkill
                  ? <><span style={{ color: 'var(--accent)' }}>{selectedSkill.name.ja}</span> を割り当てる駒を選択してください</>
                  : '割り当てるスキルをクリックして選択'}
              </p>
              <button
                onClick={confirmAssignments}
                className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'var(--accent)', color: '#0a0a14' }}
              >
                対戦開始
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Unassigned */}
              <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>
                  未割り当てスキル
                </p>
                <div className="space-y-2">
                  {unassignedPicks.map((skill, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedSkill(selectedSkill === skill ? null : skill)}
                      className="cursor-pointer rounded-xl transition-all"
                      style={selectedSkill === skill ? {
                        outline: '2px solid var(--accent)',
                        outlineOffset: '2px',
                      } : undefined}
                    >
                      <SkillCard skill={skill} compact={false} />
                    </div>
                  ))}
                  {unassignedPicks.length === 0 && (
                    <p className="text-sm text-center py-4" style={{ color: 'var(--text-3)' }}>
                      全スキルが割り当て済みです ✓
                    </p>
                  )}
                </div>
              </div>

              {/* Piece slots */}
              <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>
                  駒スロット
                </p>
                <div className="space-y-2">
                  {humanPieces.map(piece => {
                    const assigned = humanAssignments.get(piece.key) || [];
                    const maxSlots = PIECE_MAX_SLOTS[piece.type];
                    const canAssign = selectedSkill && assigned.length < maxSlots &&
                      (piece.type !== 'k' || selectedSkill.category === 'defense');
                    return (
                      <div
                        key={piece.key}
                        className="rounded-xl p-3 flex items-center gap-3 transition-all"
                        style={{
                          background: canAssign ? 'var(--bg-hover)' : 'var(--bg-elevated)',
                          border: canAssign ? '1px solid var(--border-accent)' : '1px solid var(--border)',
                          cursor: canAssign ? 'pointer' : 'default',
                        }}
                        onClick={() => {
                          if (canAssign && selectedSkill) {
                            assignSkillToPiece(piece.key, selectedSkill);
                            setSelectedSkill(null);
                          }
                        }}
                      >
                        <span className="text-2xl w-8 text-center">{icons[piece.type]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{piece.label}</span>
                            <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                              {assigned.length}/{maxSlots}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {assigned.map((s, i) => <SkillCard key={i} skill={s} compact />)}
                            {Array(maxSlots - assigned.length).fill(0).map((_, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                                style={{ border: '1px dashed var(--border)', color: 'var(--text-3)' }}>
                                空き
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
