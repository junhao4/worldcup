import { PredictionWorkspace } from './features/predictions/PredictionWorkspace';
import { tournament2026 } from './data/tournament2026';

export function App() {
  return (
    <div className="app">
      <PredictionWorkspace tournament={tournament2026} />
    </div>
  );
}
