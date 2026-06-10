import { useState } from 'react';
import type { Color, Difficulty } from '../types';
import { useGameStore } from '../store';

export default function TitleScreen() {
  const startGame = useGameStore(s => s.startGame);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [botColor, setBotColor] = useState<Color>('black');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-2 text-yellow-400">駒術チェス</h1>
        <p className="text-xl text-gray-400">Komajutsu Chess</p>
        <p className="text-sm text-gray-500 mt-2">スキルカードで駒を育てるチェス</p>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-200 mb-3">Bot難易度</h2>
          <div className="flex gap-2">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                  difficulty === d
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {d === 'easy' ? 'Easy' : d === 'medium' ? 'Medium' : 'Hard'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-200 mb-3">自分の色</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setBotColor('black')}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                botColor === 'black'
                  ? 'bg-white text-black'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              ♔ 白（先手）
            </button>
            <button
              onClick={() => setBotColor('white')}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                botColor === 'white'
                  ? 'bg-gray-900 text-white border border-gray-400'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              ♚ 黒（後手）
            </button>
          </div>
        </div>

        <button
          onClick={() => startGame(difficulty, botColor)}
          className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl text-lg transition-all"
        >
          ゲーム開始
        </button>
      </div>

      <div className="text-center text-gray-500 text-sm max-w-md">
        <p>ドラフトでスキルカードを5枚選び、駒に装備してからチェスを戦います。</p>
        <p className="mt-1">相手の駒を取るとスキルを吸収できます。</p>
      </div>
    </div>
  );
}
