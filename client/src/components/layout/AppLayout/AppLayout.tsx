import { Outlet } from 'react-router';
import { Sidebar } from '@/components/layout/Sidebar';
import { useSidebarStore } from '@/stores/sidebarStore';
import { SettingsModal } from '@/components/features/Settings/SettingsModal';
import { cn } from '@/utils/cn';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const { collapsed } = useSidebarStore();

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={cn(styles.main, collapsed && styles.sidebarCollapsed)}>
        <Outlet />
      </main>
      <SettingsModal />
    </div>
  );
}
