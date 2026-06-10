import { useGameStore } from '../store';
import ChessBoard from './ChessBoard';
import PiecePanel from './PiecePanel';
import AbsorbModal from './AbsorbModal';
import LevelUpModal from './LevelUpModal';
import { GEM_COLORS, CATEGORY_COLORS, CATEGORY_LABELS } from '../constants';

export default function GameScreen() {
  const phase = useGameStore(s => s.phase);
  const winner = useGameStore(s => s.winner);
  const resetGame = useGameStore(s => s.resetGame);
  const gems = useGameStore(s => s.gems);
  const botColor = useGameStore(s => s.botColor);
  const botDifficulty = useGameStore(s => s.botDifficulty);
  const pieces = useGameStore(s => s.pieces);

  const humanColor = botColor === 'white' ? 'black' : 'white';

  // Collect all pieces info for the captures panel
  const allPiecesList = Array.from(pieces.values());
  const humanPieces = allPiecesList.filter(p => p.color === humanColor);
  const totalHumanSkills = humanPieces.reduce((sum, p) => sum + p.skills.length, 0);
  const totalHumanExp = humanPieces.reduce((sum, p) => sum + p.experience, 0);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-yellow-400">駒術チェス</h1>
          <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded">
            Bot: {botDifficulty.toUpperCase()}
          </span>
          <span className="text-xs text-gray-500">
            自分: {humanColor === 'white' ? '白' : '黒'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Gem legend */}
          <div className="hidden sm:flex gap-2">
            {Object.entries(GEM_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-400">{type === 'gold' ? '金' : type === 'blue' ? '移動' : type === 'red' ? '戦闘' : '防御'}</span>
              </div>
            ))}
          </div>
          <button
            onClick={resetGame}
            className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700 transition-all"
          >
            タイトルへ
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-6xl mx-auto w-full">
        {/* Board area */}
        <div className="flex-1 flex items-start justify-center">
          <div className="w-full max-w-lg">
            <ChessBoard />
            {/* Skill category legend */}
            <div className="mt-2 flex flex-wrap gap-2 justify-center">
              {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
                <div key={cat} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] }} />
                  <span className="text-xs text-gray-500">{label}</span>
                </div>
              ))}
              <span className="text-xs text-gray-600">← 駒の左上ドット</span>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="w-full lg:w-72 flex flex-col gap-4">
          <PiecePanel />

          {/* Quick stats */}
          <div className="bg-gray-800 rounded-xl p-3">
            <h3 className="text-xs font-semibold text-gray-400 mb-2">あなたの駒</h3>
            <div className="text-xs text-gray-300 space-y-1">
              <div className="flex justify-between">
                <span>総スキル数</span>
                <span className="text-yellow-400">{totalHumanSkills}</span>
              </div>
              <div className="flex justify-between">
                <span>総EXP</span>
                <span className="text-blue-400">{totalHumanExp}</span>
              </div>
              <div className="flex justify-between">
                <span>残り宝石</span>
                <span className="text-green-400">{gems.size}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AbsorbModal />
      <LevelUpModal />

      {/* Game over overlay */}
      {phase === 'ended' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-8 text-center max-w-sm w-full border border-gray-600">
            <div className="text-5xl mb-4">{winner === humanColor ? '🎉' : '😢'}</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {winner === humanColor ? 'あなたの勝利！' : winner ? 'Botの勝利' : '引き分け'}
            </h2>
            <p className="text-gray-400 mb-6">
              {winner === humanColor
                ? 'おめでとうございます！相手キングをチェックメイト！'
                : winner
                ? 'あなたのキングがチェックメイトされました'
                : 'ゲームは引き分けです'}
            </p>
            <button
              onClick={resetGame}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-all"
            >
              もう一度プレイ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
