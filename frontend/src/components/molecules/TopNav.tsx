import type { NavigationItem } from '../../data/mockData';
import { Button } from '../ui/button';

export interface TopNavProps extends Readonly<{
  activeItem: string;
  items: NavigationItem[];
  primaryActionLabel: string;
}> {}

export function TopNav({ activeItem, items, primaryActionLabel }: TopNavProps) {
  return (
    <header className="top-nav">
      <div className="top-nav__brand">CupCast</div>
      <nav aria-label="Primary" className="top-nav__links">
        {items.map((item) => (
          <a className={item.label === activeItem ? 'top-nav__link top-nav__link--active' : 'top-nav__link'} href={item.href} key={item.label}>
            {item.label}
          </a>
        ))}
      </nav>
      <div className="top-nav__actions">
        <Button variant="secondary">Save Draft</Button>
        <Button>{primaryActionLabel}</Button>
      </div>
    </header>
  );
}
