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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-600">
        <h2 className="text-xl font-bold text-white mb-2">スキル吸収</h2>
        <p className="text-sm text-gray-400 mb-4">
          取った駒のスキルを1つ吸収できます。（残りスロット: {availableSlots}）
        </p>

        <div className="space-y-3 mb-4">
          {pendingAbsorb.capturedSkills.map((skill, i) => (
            <div
              key={i}
              className="cursor-pointer rounded-xl transition-all hover:scale-102 hover:ring-2 hover:ring-yellow-400"
              onClick={() => absorbSkill(skill)}
            >
              <SkillCard skill={skill} />
            </div>
          ))}
        </div>

        <button
          onClick={() => absorbSkill(null)}
          className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-sm transition-all"
        >
          スキップ（吸収しない）
        </button>
      </div>
    </div>
  );
}
