import { useGameStore } from '../store';
import type { PieceType, Color } from '../types';
import SkillCard from './SkillCard';
import { ACTIVE_SKILL_IDS } from '../gameLogic';

const PIECE_LABELS: Record<PieceType, string> = {
  p: 'ポーン', n: 'ナイト', b: 'ビショップ', r: 'ルーク', q: 'クイーン', k: 'キング',
};

const EXP_COLORS = ['var(--skill-move)', 'var(--accent)', 'var(--skill-combat)'];

export default function PiecePanel() {
  const selectedSquare = useGameStore(s => s.selectedSquare);
  const pieces = useGameStore(s => s.pieces);
  const botColor = useGameStore(s => s.botColor);
  const currentTurn = useGameStore(s => s.currentTurn);
  const statusMessage = useGameStore(s => s.statusMessage);
  const turnNumber = useGameStore(s => s.turnNumber);

  const pendingSkillActivation = useGameStore(s => s.pendingSkillActivation);
  const startSkillActivation = useGameStore(s => s.startSkillActivation);
  const cancelSkillActivation = useGameStore(s => s.cancelSkillActivation);

  const humanColor = botColor === 'white' ? 'black' : 'white';
  const pieceState = selectedSquare ? pieces.get(selectedSquare) : null;
  const isMyPiece = pieceState?.color === humanColor;
  const isMyTurn = currentTurn === humanColor;
  const canUseSkill = isMyPiece && isMyTurn && !pendingSkillActivation;

  const expThreshold = pieceState ? (pieceState.level === 1 ? 10 : 30) : 10;
  const expBase = pieceState ? (pieceState.level === 1 ? 0 : pieceState.level === 2 ? 10 : 30) : 0;
  const expProgress = pieceState
    ? Math.min(1, (pieceState.experience - expBase) / (expThreshold - expBase))
    : 0;

  const isHumanTurn = currentTurn === humanColor;

  return (
    <div className="flex flex-col gap-3">
      {/* Turn status */}
      <div className="rounded-xl p-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>ターン {turnNumber}</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={isHumanTurn ? {
              background: 'rgba(61,201,180,0.12)',
              color: 'var(--skill-defense)',
              border: '1px solid rgba(61,201,180,0.25)',
            } : {
              background: 'rgba(240,112,112,0.12)',
              color: 'var(--skill-combat)',
              border: '1px solid rgba(240,112,112,0.25)',
            }}>
            {currentTurn === 'white' ? '♔ 白' : '♚ 黒'}の番
          </span>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-2)' }}>{statusMessage}</p>
      </div>

      {/* Selected piece */}
      <div className="rounded-xl overflow-hidden flex-1"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        {pieceState ? (
          <div className="p-4">
            {/* Piece header */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{getPieceIcon(pieceState.type, pieceState.color)}</span>
              <div>
                <div className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>
                  {PIECE_LABELS[pieceState.type]}
                  {pieceState.isBound && (
                    <span className="ml-2 text-xs font-medium px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(184,125,232,0.15)', color: 'var(--skill-curse)' }}>
                      呪縛 {pieceState.boundTurns}T
                    </span>
                  )}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                  {pieceState.color === 'white' ? '白' : '黒'} · Lv{pieceState.level}
                </div>
              </div>
            </div>

            {/* EXP bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>
                <span>EXP</span>
                <span>{pieceState.experience} / {expThreshold}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${expProgress * 100}%`, background: EXP_COLORS[Math.min(pieceState.level - 1, 2)] }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span style={{ color: 'var(--text-3)' }}>Lv{pieceState.level}</span>
                {pieceState.level < 3 && (
                  <span style={{ color: 'var(--text-3)' }}>Lv{pieceState.level + 1}</span>
                )}
              </div>
            </div>

            {/* Skills */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: 'var(--text-3)' }}>
                スキル {pieceState.skills.length}/{pieceState.maxSlots}
              </p>

              {/* Skill activation mode banner */}
              {pendingSkillActivation && selectedSquare === pendingSkillActivation.pieceSquare && (
                <div className="mb-2 rounded-lg px-3 py-2 flex items-center justify-between"
                  style={{ background: 'rgba(184,125,232,0.12)', border: '1px solid rgba(184,125,232,0.3)' }}>
                  <span className="text-xs" style={{ color: 'var(--skill-curse)' }}>対象マスをクリック</span>
                  <button onClick={cancelSkillActivation}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                    キャンセル
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {pieceState.skills.map((skill, i) => {
                  const isActive = ACTIVE_SKILL_IDS.has(skill.id);
                  const isActivating = pendingSkillActivation?.skillId === skill.id;
                  const usesLeft = skill.id === 'mist-step' ? (pieceState.mistStepUses ?? 0) : null;
                  const hasUses = usesLeft === null || usesLeft > 0;
                  return (
                    <div key={i}>
                      <SkillCard skill={skill} />
                      {isActive && (
                        <button
                          onClick={() => isActivating ? cancelSkillActivation() : startSkillActivation(skill.id)}
                          disabled={!isActivating && (!canUseSkill || !hasUses)}
                          className="mt-1 w-full py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={isActivating ? {
                            background: 'rgba(184,125,232,0.2)',
                            color: 'var(--skill-curse)',
                            border: '1px solid rgba(184,125,232,0.5)',
                          } : (canUseSkill && hasUses) ? {
                            background: 'rgba(228,184,75,0.1)',
                            color: 'var(--accent)',
                            border: '1px solid var(--border-accent)',
                            cursor: 'pointer',
                          } : {
                            background: 'var(--bg-elevated)',
                            color: 'var(--text-3)',
                            border: '1px solid var(--border)',
                            cursor: 'not-allowed',
                          }}
                        >
                          {isActivating
                            ? 'キャンセル'
                            : usesLeft !== null
                              ? `使用する（残${usesLeft}回）`
                              : '使用する'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {Array(pieceState.maxSlots - pieceState.skills.length).fill(0).map((_, i) => (
                <div key={i} className="mt-2 rounded-xl p-3 text-center text-xs"
                  style={{ border: '1px dashed var(--border)', color: 'var(--text-3)' }}>
                  空きスロット
                </div>
              ))}
            </div>

            {/* Special states */}
            {(pieceState.armorCharges || pieceState.mistStepUses) ? (
              <div className="mt-3 space-y-1">
                {pieceState.armorCharges ? (
                  <div className="text-xs px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(61,201,180,0.1)', color: 'var(--skill-defense)' }}>
                    🛡 鎧: {pieceState.armorCharges}回残り
                  </div>
                ) : null}
                {pieceState.mistStepUses ? (
                  <div className="text-xs px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(91,156,246,0.1)', color: 'var(--skill-move)' }}>
                    ✦ 霞歩: {pieceState.mistStepUses}回残り
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="p-6 flex flex-col items-center justify-center text-center gap-2" style={{ minHeight: '140px' }}>
            <span className="text-2xl" style={{ color: 'var(--text-3)' }}>♟</span>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>駒をクリックして詳細表示</p>
          </div>
        )}
      </div>
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
