import { useGameStore } from '../store';
import SkillCard from './SkillCard';

export default function AbsorbModal() {
  const pendingAbsorb = useGameStore(s => s.pendingAbsorb);
  const pieces = useGameStore(s => s.pieces);
  const absorbSkill = useGameStore(s => s.absorbSkill);

  if (!pendingAbsorb) return null;

  const attacker = pieces.get(pendingAbsorb.capturingSquare);
  const availableSlots = attacker ? attacker.maxSlots - attacker.skills.length : 0;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(8,8,18,0.80)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', boxShadow: '0 0 40px rgba(228,184,75,0.08)' }}>

        {/* Header */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>
            スキル吸収
          </p>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>
            スキルを1つ吸収できます
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
            残りスロット: {availableSlots}
          </p>
        </div>

        {/* Skills list */}
        <div className="p-4 space-y-2">
          {pendingAbsorb.capturedSkills.map((skill, i) => (
            <div
              key={i}
              className="cursor-pointer rounded-xl transition-all hover:scale-[1.01]"
              onClick={() => absorbSkill(skill)}
              style={{ outline: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.outline = '2px solid var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.outline = 'none')}
            >
              <SkillCard skill={skill} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <button
            onClick={() => absorbSkill(null)}
            className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
          >
            スキップ（吸収しない）
          </button>
        </div>
      </div>
    </div>
  );
}
