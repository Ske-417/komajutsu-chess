import { useGameStore } from '../store';
import ChessBoard from './ChessBoard';
import PiecePanel from './PiecePanel';
import AbsorbModal from './AbsorbModal';
import LevelUpModal from './LevelUpModal';

const GEM_LABELS: Record<string, string> = {
  blue: '移動', red: '戦闘', green: '防御', gold: 'レア',
};
const GEM_COLORS: Record<string, string> = {
  blue: 'var(--skill-move)', red: 'var(--skill-combat)',
  green: 'var(--skill-defense)', gold: 'var(--accent)',
};

export default function GameScreen() {
  const phase = useGameStore(s => s.phase);
  const winner = useGameStore(s => s.winner);
  const resetGame = useGameStore(s => s.resetGame);
  const gems = useGameStore(s => s.gems);
  const botColor = useGameStore(s => s.botColor);
  const botDifficulty = useGameStore(s => s.botDifficulty);

  const humanColor = botColor === 'white' ? 'black' : 'white';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>

      {/* Header */}
      <header style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}
        className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-base" style={{ color: 'var(--accent)' }}>駒術チェス</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
            Bot {botDifficulty.toUpperCase()}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>
            {humanColor === 'white' ? '♔ 白' : '♚ 黒'}
          </span>
        </div>

        {/* Gem legend */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex gap-3">
            {Object.entries(GEM_LABELS).map(([type, label]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: GEM_COLORS[type] }} />
                <span className="text-xs" style={{ color: 'var(--text-3)' }}>{label}</span>
              </div>
            ))}
          </div>
          <button
            onClick={resetGame}
            className="text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{ color: 'var(--text-2)', border: '1px solid var(--border)' }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color = 'var(--text-1)'; (e.target as HTMLElement).style.background = 'var(--bg-elevated)'; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--text-2)'; (e.target as HTMLElement).style.background = 'transparent'; }}
          >
            タイトルへ
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-6xl mx-auto w-full">
        {/* Board */}
        <div className="flex-1 flex items-start justify-center">
          <div className="w-full max-w-lg">
            <ChessBoard />
            {/* Gem legend mobile */}
            <div className="mt-3 flex flex-wrap gap-3 justify-center sm:hidden">
              {Object.entries(GEM_LABELS).map(([type, label]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: GEM_COLORS[type] }} />
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>{label}宝石</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="w-full lg:w-72 flex flex-col gap-3">
          <PiecePanel />

          {/* Stats */}
          <div className="rounded-xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>
              残り宝石
            </p>
            <div className="flex flex-wrap gap-2">
              {['blue', 'red', 'green', 'gold'].map(type => {
                const count = Array.from(gems.values()).filter(g => g === type).length;
                return (
                  <div key={type} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                    style={{ background: `color-mix(in srgb, ${GEM_COLORS[type]} 12%, transparent)`, color: GEM_COLORS[type], border: `1px solid color-mix(in srgb, ${GEM_COLORS[type]} 30%, transparent)` }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: GEM_COLORS[type] }} />
                    <span>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <AbsorbModal />
      <LevelUpModal />

      {/* Game over */}
      {phase === 'ended' && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(8,8,18,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="rounded-2xl p-8 text-center w-full max-w-sm"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', boxShadow: '0 0 40px rgba(228,184,75,0.1)' }}>
            <div className="text-5xl mb-5">
              {winner === humanColor ? '♛' : winner ? '♟' : '⚖'}
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: winner === humanColor ? 'var(--accent)' : 'var(--text-1)' }}>
              {winner === humanColor ? 'Victory' : winner ? 'Defeat' : 'Draw'}
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>
              {winner === humanColor
                ? 'おめでとうございます。チェックメイト成功！'
                : winner
                ? 'あなたのキングがチェックメイトされました。'
                : 'ゲームは引き分けです。'}
            </p>
            <button
              onClick={resetGame}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all"
              style={{ background: 'var(--accent)', color: '#0a0a14' }}
            >
              もう一度プレイ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
