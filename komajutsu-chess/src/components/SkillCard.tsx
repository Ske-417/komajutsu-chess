import type { Skill } from '../types';
import { CATEGORY_LABELS } from '../constants';

const SKILL_COLORS: Record<string, string> = {
  move: 'var(--skill-move)',
  combat: 'var(--skill-combat)',
  curse: 'var(--skill-curse)',
  defense: 'var(--skill-defense)',
};

interface Props {
  skill: Skill;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
  disabled?: boolean;
}

export default function SkillCard({ skill, selected, onClick, compact, disabled }: Props) {
  const color = SKILL_COLORS[skill.category];
  const label = CATEGORY_LABELS[skill.category];

  if (compact) {
    return (
      <div
        onClick={!disabled ? onClick : undefined}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold select-none transition-opacity"
        style={{
          background: `color-mix(in srgb, ${color} 15%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
          color,
          opacity: disabled ? 0.4 : 1,
          cursor: disabled ? 'not-allowed' : onClick ? 'pointer' : 'default',
        }}
        title={skill.descriptions[skill.level]}
      >
        <span className="opacity-70">Lv{skill.level}</span>
        <span>{skill.name.ja}</span>
      </div>
    );
  }

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className="rounded-xl overflow-hidden select-none transition-all duration-150"
      style={{
        background: 'var(--bg-elevated)',
        border: selected
          ? `2px solid var(--accent)`
          : `1px solid color-mix(in srgb, ${color} 30%, var(--border))`,
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? 'not-allowed' : onClick ? 'pointer' : 'default',
        transform: selected ? 'scale(1.02)' : undefined,
        boxShadow: selected ? '0 0 16px rgba(228,184,75,0.2)' : undefined,
      }}
    >
      {/* Header band */}
      <div
        className="px-3 py-1.5 flex items-center justify-between"
        style={{ background: `color-mix(in srgb, ${color} 20%, transparent)`, borderBottom: `1px solid color-mix(in srgb, ${color} 20%, transparent)` }}
      >
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color, fontSize: '0.65rem' }}>
          {label}
        </span>
        <span className="text-xs opacity-60" style={{ color, fontSize: '0.65rem' }}>
          {skill.name.en}
        </span>
      </div>

      {/* Body */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>{skill.name.ja}</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}
          >
            Lv{skill.level}
          </span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
          {skill.descriptions[skill.level]}
        </p>
        {/* Level progress pips */}
        <div className="flex gap-1.5 mt-3">
          {([1, 2, 3] as const).map(lv => (
            <div
              key={lv}
              className="flex-1 h-0.5 rounded-full transition-colors"
              style={{ background: lv <= skill.level ? color : 'var(--bg-hover)' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
