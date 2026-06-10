import { useState } from 'react';
import type { Color, Difficulty } from '../types';
import { useGameStore } from '../store';

export default function TitleScreen() {
  const startGame = useGameStore(s => s.startGame);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [botColor, setBotColor] = useState<Color>('black');

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Background chess grid */}
      <div className="absolute inset-0 chess-grid-bg opacity-60" />

      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(228,184,75,0.06) 0%, transparent 70%)' }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-10 p-6 w-full max-w-md">

        {/* Hero */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl opacity-40">♟</span>
            <span className="text-4xl opacity-40">♝</span>
            <span className="text-4xl opacity-70">♛</span>
            <span className="text-4xl opacity-40">♞</span>
            <span className="text-4xl opacity-40">♜</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-2" style={{ color: 'var(--accent)', fontFamily: "'Noto Sans JP', sans-serif" }}>
            駒術チェス
          </h1>
          <p className="text-base tracking-widest uppercase" style={{ color: 'var(--text-2)', letterSpacing: '0.25em', fontSize: '0.75rem' }}>
            Komajutsu Chess
          </p>
          <p className="mt-3 text-sm" style={{ color: 'var(--text-3)' }}>
            スキルカードで駒を育てる戦略チェス
          </p>
        </div>

        {/* Settings card */}
        <div className="w-full rounded-2xl p-6 space-y-6"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>

          {/* Difficulty */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>
              Bot 難易度
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className="py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                  style={difficulty === d ? {
                    background: 'var(--accent)',
                    color: '#0a0a14',
                  } : {
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-2)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {d === 'easy' ? 'Easy' : d === 'medium' ? 'Medium' : 'Hard'}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>
              プレイヤーの色
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setBotColor('black')}
                className="py-3 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2"
                style={botColor === 'black' ? {
                  background: 'rgba(255,255,255,0.12)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.25)',
                } : {
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-2)',
                  border: '1px solid var(--border)',
                }}
              >
                <span>♔</span>
                <span>白（先手）</span>
              </button>
              <button
                onClick={() => setBotColor('white')}
                className="py-3 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2"
                style={botColor === 'white' ? {
                  background: 'rgba(255,255,255,0.08)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.2)',
                } : {
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-2)',
                  border: '1px solid var(--border)',
                }}
              >
                <span>♚</span>
                <span>黒（後手）</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => startGame(difficulty, botColor)}
            className="w-full py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-150 hover:translate-y-px"
            style={{ background: 'var(--accent)', color: '#0a0a14' }}
          >
            ゲームを開始する
          </button>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>
          ドラフトで5枚のスキルを選び、駒に装備してから対戦。<br />
          相手の駒を取るとスキルを吸収できます。
        </p>
      </div>
    </div>
  );
}
