import { useGameStore } from '../store';
import SkillCard from './SkillCard';

export default function LevelUpModal() {
  const pendingLevelUp = useGameStore(s => s.pendingLevelUp);
  const levelUpChoice = useGameStore(s => s.levelUpChoice);

  if (!pendingLevelUp) return null;
  if (pendingLevelUp.choices.length === 0) {
    levelUpChoice('');
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(8,8,18,0.80)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', boxShadow: '0 0 40px rgba(228,184,75,0.12)' }}>

        {/* Header */}
        <div className="px-5 py-4 text-center" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="text-2xl mb-2" style={{ color: 'var(--accent)' }}>▲</div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--accent)' }}>Level Up</h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>
            レベルアップするスキルを選んでください
          </p>
        </div>

        <div className="p-4 space-y-3">
          {pendingLevelUp.choices.map((skill, i) => (
            <div key={i}>
              <div
                className="cursor-pointer rounded-xl transition-all hover:scale-[1.01]"
                onClick={() => levelUpChoice(skill.id)}
                onMouseEnter={e => (e.currentTarget.style.outline = '2px solid var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.outline = 'none')}
                style={{ outline: 'none' }}
              >
                <SkillCard skill={skill} />
              </div>
              <p className="text-xs text-center mt-1" style={{ color: 'var(--accent)' }}>
                → Lv{Math.min(3, skill.level + 1)} にアップ
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
