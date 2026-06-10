import type { Skill } from '../types';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../constants';

interface Props {
  skill: Skill;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
  disabled?: boolean;
}

export default function SkillCard({ skill, selected, onClick, compact, disabled }: Props) {
  const color = CATEGORY_COLORS[skill.category];
  const label = CATEGORY_LABELS[skill.category];

  if (compact) {
    return (
      <div
        onClick={!disabled ? onClick : undefined}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
        style={{ backgroundColor: color + '33', border: `1px solid ${color}`, color }}
        title={skill.descriptions[skill.level]}
      >
        <span style={{ color }}>Lv{skill.level}</span>
        <span>{skill.name.ja}</span>
      </div>
    );
  }

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`rounded-xl overflow-hidden select-none transition-all ${onClick && !disabled ? 'cursor-pointer hover:scale-105' : ''} ${selected ? 'ring-2 ring-yellow-400 scale-105' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{ border: `2px solid ${selected ? '#facc15' : color}` }}
    >
      <div className="px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: color }}>
        {label} · {skill.name.en}
      </div>
      <div className="bg-gray-800 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-white">{skill.name.ja}</span>
          <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: color + '44', color }}>
            Lv{skill.level}
          </span>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">{skill.descriptions[skill.level]}</p>
        <div className="mt-2 flex gap-1">
          {([1, 2, 3] as const).map(lv => (
            <div
              key={lv}
              className="flex-1 h-1 rounded-full"
              style={{ backgroundColor: lv <= skill.level ? color : '#374151' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
