import { useState } from 'react';
import type { Skill, PieceType, Color } from '../types';
import { useGameStore } from '../store';
import SkillCard from './SkillCard';
import { PIECE_MAX_SLOTS, CATEGORY_LABELS } from '../constants';
import { getPieceKey } from '../gameLogic';

const PIECE_LABELS: Record<PieceType, string> = {
  p: 'ポーン', n: 'ナイト', b: 'ビショップ', r: 'ルーク', q: 'クイーン', k: 'キング',
};
const SKILL_COLORS: Record<string, string> = {
  move: 'var(--skill-move)',
  combat: 'var(--skill-combat)',
  curse: 'var(--skill-curse)',
  defense: 'var(--skill-defense)',
};

function getPieceIconsForColor(color: Color) {
  return {
    p: color === 'white' ? '♙' : '♟',
    n: color === 'white' ? '♘' : '♞',
    b: color === 'white' ? '♗' : '♝',
    r: color === 'white' ? '♖' : '♜',
    q: color === 'white' ? '♕' : '♛',
    k: color === 'white' ? '♔' : '♚',
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
  const humanPieces: Array<{ key: string; type: PieceType; label: string }> = [];
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
      humanPieces.push({ key, type: piece.type as PieceType, label });
    }
  }

  const icons = getPieceIconsForColor(humanColor);
  const assignedSkills = Array.from(humanAssignments.values()).flat();
  const unassignedPicks = humanPicks.filter(s => !assignedSkills.includes(s));

  return (
    <div className="chess-grid-bg flex flex-col" style={{ background: 'var(--bg-base)', minHeight: '100dvh' }}>
      {/* Header */}
      <div className="px-6 pt-8 pb-4 text-center flex-shrink-0">
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>
          {isPickingPhase ? 'PHASE 1' : 'PHASE 2'}
        </p>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>
          {isPickingPhase ? 'スキル選択' : 'スキル割り当て'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>{statusMessage}</p>
      </div>

      {/* ── PICKING PHASE ── */}
      {isPickingPhase && (
        isHumanTurn ? (
          <div className="flex-1 flex flex-col px-4 pb-6 gap-4 max-w-4xl mx-auto w-full">
            {/* Progress + confirm */}
            <div className="flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--text-3)' }}>選択中</span>
                <div className="flex gap-1">
                  {[0,1,2,3,4].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full transition-colors"
                      style={{ background: i < humanPicks.length ? 'var(--accent)' : 'var(--bg-hover)' }} />
                  ))}
                </div>
                <span className="text-xs" style={{ color: 'var(--text-3)' }}>{humanPicks.length} / 5</span>
                {humanPicks.length > 0 && (
                  <span className="text-xs ml-1" style={{ color: 'var(--text-3)' }}>
                    （選択済みをクリックで解除）
                  </span>
                )}
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

            {/* Cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {humanHand.map((skill, i) => {
                const isPicked = humanPicks.includes(skill);
                return (
                  <SkillCard
                    key={`${skill.id}-${i}`}
                    skill={skill}
                    selected={isPicked}
                    disabled={false}
                    onClick={() => selectSkillForDraft(skill)}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="rounded-2xl p-10 text-center"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="text-3xl mb-3 animate-pulse" style={{ color: 'var(--text-3)' }}>◌</div>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>Botがスキルを選んでいます…</p>
            </div>
          </div>
        )
      )}

      {/* ── ASSIGNING PHASE ── */}
      {isAssigningPhase && (
        <div className="flex-1 flex flex-col px-4 pb-4 gap-3 max-w-4xl mx-auto w-full min-h-0">
          {/* Top bar */}
          <div className="flex items-center justify-between flex-shrink-0">
            <p className="text-sm" style={{ color: selectedSkill ? 'var(--text-1)' : 'var(--text-2)' }}>
              {selectedSkill
                ? <><span style={{ color: 'var(--accent)' }}>{selectedSkill.name.ja}</span> を割り当てる駒を選択</>
                : 'スキルを選択 → 駒に割り当て'}
            </p>
            <button
              onClick={confirmAssignments}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0"
              style={{ background: 'var(--accent)', color: '#0a0a14' }}
            >
              対戦開始
            </button>
          </div>

          {/* Two columns */}
          <div className="flex gap-3 flex-1 min-h-0">

            {/* Left: Skill selector */}
            <div className="flex flex-col gap-2 w-52 flex-shrink-0 overflow-y-auto">
              <p className="text-xs font-semibold uppercase tracking-widest flex-shrink-0"
                style={{ color: 'var(--text-3)' }}>未割り当て</p>
              {unassignedPicks.map((skill, i) => {
                const color = SKILL_COLORS[skill.category];
                const isSelected = selectedSkill === skill;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedSkill(isSelected ? null : skill)}
                    className="rounded-xl text-left transition-all flex-shrink-0"
                    style={{
                      background: isSelected ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      borderLeft: `3px solid ${color}`,
                      boxShadow: isSelected ? '0 0 0 1px var(--accent)' : 'none',
                      padding: '10px 12px',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
                        style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}>
                        Lv{skill.level}
                      </span>
                      <span className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>
                        {skill.name.ja}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-3)' }}>
                      {CATEGORY_LABELS[skill.category]}
                    </p>
                  </button>
                );
              })}
              {/* Already assigned (greyed out) */}
              {assignedSkills.length > 0 && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-widest mt-1 flex-shrink-0"
                    style={{ color: 'var(--text-3)' }}>割り当て済み</p>
                  {assignedSkills.map((skill, i) => {
                    const color = SKILL_COLORS[skill.category];
                    return (
                      <div key={i} className="rounded-xl flex-shrink-0"
                        style={{
                          background: 'var(--bg-surface)',
                          border: `1px solid var(--border)`,
                          borderLeft: `3px solid ${color}`,
                          padding: '10px 12px',
                          opacity: 0.45,
                        }}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-1.5 py-0.5 rounded"
                            style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}>
                            Lv{skill.level}
                          </span>
                          <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
                            {skill.name.ja}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                          {CATEGORY_LABELS[skill.category]}
                        </p>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Right: Piece grid (2 columns) */}
            <div className="flex-1 min-h-0 flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest flex-shrink-0"
                style={{ color: 'var(--text-3)' }}>駒スロット</p>
              <div className="grid grid-cols-2 gap-1.5 overflow-y-auto">
                {humanPieces.map(piece => {
                  const assigned = humanAssignments.get(piece.key) || [];
                  const maxSlots = PIECE_MAX_SLOTS[piece.type];
                  const canAssign = !!selectedSkill
                    && assigned.length < maxSlots
                    && (piece.type !== 'k' || selectedSkill.category === 'defense');
                  return (
                    <div
                      key={piece.key}
                      className="rounded-xl flex items-center gap-2 transition-all"
                      style={{
                        padding: '7px 10px',
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
                      <span className="text-base flex-shrink-0">{icons[piece.type]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium truncate" style={{ color: 'var(--text-1)' }}>{piece.label}</span>
                          <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-3)' }}>{assigned.length}/{maxSlots}</span>
                        </div>
                      </div>
                      <div className="flex gap-0.5 flex-shrink-0">
                        {assigned.map((s, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: SKILL_COLORS[s.category] }} title={s.name.ja} />
                        ))}
                        {Array(maxSlots - assigned.length).fill(0).map((_, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full"
                            style={{ background: canAssign ? 'rgba(228,184,75,0.35)' : 'transparent', border: '1px dashed var(--text-3)' }} />
                        ))}
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
  );
}
