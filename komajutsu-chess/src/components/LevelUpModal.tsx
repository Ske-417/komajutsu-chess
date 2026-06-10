import { useGameStore } from '../store';
import SkillCard from './SkillCard';

export default function LevelUpModal() {
  const pendingLevelUp = useGameStore(s => s.pendingLevelUp);
  const levelUpChoice = useGameStore(s => s.levelUpChoice);

  if (!pendingLevelUp) return null;

  if (pendingLevelUp.choices.length === 0) {
    // Auto level up happened, dismiss
    levelUpChoice('');
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-yellow-500">
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">⬆️</div>
          <h2 className="text-xl font-bold text-yellow-400">レベルアップ！</h2>
          <p className="text-sm text-gray-400 mt-1">レベルアップするスキルを選んでください</p>
        </div>

        <div className="space-y-3">
          {pendingLevelUp.choices.map((skill, i) => (
            <div
              key={i}
              className="cursor-pointer rounded-xl transition-all hover:scale-102 hover:ring-2 hover:ring-yellow-400"
              onClick={() => levelUpChoice(skill.id)}
            >
              <SkillCard skill={skill} />
              <div className="text-center text-xs text-yellow-400 mt-1">
                → Lv{Math.min(3, skill.level + 1)}にアップ
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
