import type { ReactNode } from 'react';
import type { NavigationItem } from '../../data/mockData';
import { SidebarNav } from '../molecules/SidebarNav';
import { TopNav } from '../molecules/TopNav';

export interface AppShellProps extends Readonly<{
  activeItem: string;
  children: ReactNode;
  completion: number;
  navItems: NavigationItem[];
  primaryActionLabel: string;
}> {}

export function AppShell({ activeItem, children, completion, navItems, primaryActionLabel }: AppShellProps) {
  return (
    <div className="app-shell">
      <TopNav activeItem={activeItem} items={navItems} primaryActionLabel={primaryActionLabel} />
      <div className="layout">
        <SidebarNav activeItem={activeItem} completion={completion} items={navItems} />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
