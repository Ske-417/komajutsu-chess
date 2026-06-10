import { useGameStore } from './store';
import TitleScreen from './components/TitleScreen';
import DraftScreen from './components/DraftScreen';
import GameScreen from './components/GameScreen';

export default function App() {
  const phase = useGameStore(s => s.phase);

  if (phase === 'title') return <TitleScreen />;
  if (phase === 'draft') return <DraftScreen />;
  return <GameScreen />;
}
