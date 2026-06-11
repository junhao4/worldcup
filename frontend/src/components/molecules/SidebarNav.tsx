import type { NavigationItem } from '../../data/mockData';
import { ProgressSummary } from './ProgressSummary';

export interface SidebarNavProps extends Readonly<{
  activeItem: string;
  completion: number;
  items: NavigationItem[];
}> {}

export function SidebarNav({ activeItem, completion, items }: SidebarNavProps) {
  return (
    <aside className="side-panel">
      <div className="side-panel__title">Tournament Builder</div>
      <p className="side-panel__meta">Scores, standings, bracket, and export.</p>
      <ProgressSummary label="Prediction progress" value={completion} />
      <nav aria-label="Prediction sections" className="side-panel__nav">
        {items.map((item) => (
          <a className={item.label === activeItem ? 'side-panel__nav-item side-panel__nav-item--active' : 'side-panel__nav-item'} href={item.href} key={item.label}>
            <span>{item.isComplete ? 'Done' : 'Next'}</span>
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
