import { PredictionWorkspace } from './features/predictions/PredictionWorkspace';
import { tournament2026 } from './data/tournament2026';
import { useAppAuth } from './hooks/useAppAuth';

export function App() {
  const auth = useAppAuth();

  return (
    <div className="app">
      <PredictionWorkspace tournament={tournament2026} auth={auth} />
    </div>
  );
}
