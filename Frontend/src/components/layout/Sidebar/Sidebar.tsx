import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import {
  FileText,
  GitCompareArrows,
  HelpCircle,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';

import { Tooltip } from '@/components/ui/Tooltip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog/ConfirmDialog';
import logoUrl from '@/assets/logo.png';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Documents', icon: FileText },
  { to: '/compare', label: 'Compare', icon: GitCompareArrows },
];

const BOTTOM_ITEMS = [
  { to: '/help', label: 'Help', icon: HelpCircle },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { collapsed, toggleSidebar } = useSidebarStore();
  const { user, logout } = useAuthStore();
  const { openSettings } = useSettingsStore();
  const navigate = useNavigate();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutToggle = () => {
    setShowLogoutConfirm(true);
  };

  const executeLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '??';

  return (
    <aside className={cn(styles.sidebar, collapsed && styles.collapsed)}>
      {}
      <div className={styles.header}>
        {!collapsed && (
          <div className={styles.logo}>
            <img src={logoUrl} alt="Wayne AI Logo" className={styles.logoImage} />
            <span className={styles.logoText}>Wayne AI</span>
          </div>
        )}
        <button
          className={styles.collapseButton}
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={24} /> : <PanelLeftClose size={24} />}
        </button>
      </div>

      {}

      {}
      <nav className={styles.nav}>
        <span className={cn(styles.sectionLabel, collapsed && styles.hiddenLabel)}>Navigation</span>
        <ul className={styles.navList}>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              {collapsed ? (
                <Tooltip content={label} side="right">
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      cn(styles.navItem, isActive && styles.active)
                    }
                  >
                    <Icon size={24} />
                  </NavLink>
                </Tooltip>
              ) : (
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    cn(styles.navItem, isActive && styles.active)
                  }
                >
                  <Icon size={24} />
                  <span>{label}</span>
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {}
      <div className={styles.spacer} />

      {}
      <div className={styles.bottom}>
        <ul className={styles.navList}>
          {BOTTOM_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              {to === '/settings' ? (
                collapsed ? (
                  <Tooltip content={label} side="right">
                    <button
                      className={styles.navItem}
                      onClick={openSettings}
                      style={{ width: '100%', border: 'none', background: 'transparent' }}
                    >
                      <Icon size={24} />
                    </button>
                  </Tooltip>
                ) : (
                  <button
                    className={styles.navItem}
                    onClick={openSettings}
                    style={{ width: '100%', border: 'none', background: 'transparent' }}
                  >
                    <Icon size={24} />
                    <span>{label}</span>
                  </button>
                )
              ) : (
                collapsed ? (
                  <Tooltip content={label} side="right">
                    <NavLink
                      to={to}
                      className={({ isActive }) =>
                        cn(styles.navItem, isActive && styles.active)
                      }
                    >
                      <Icon size={24} />
                    </NavLink>
                  </Tooltip>
                ) : (
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      cn(styles.navItem, isActive && styles.active)
                    }
                  >
                    <Icon size={24} />
                    <span>{label}</span>
                  </NavLink>
                )
              )}
            </li>
          ))}
        </ul>



        {}
        <div className={styles.userSection}>
          {collapsed ? (
            <Tooltip content="Logout" side="right">
              <button
                className={styles.logoutButton}
                onClick={handleLogoutToggle}
                aria-label="Logout"
              >
                <LogOut size={24} />
              </button>
            </Tooltip>
          ) : (
            <>
              <div className={styles.avatar}>{initials}</div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>
                  {user?.firstName} {user?.lastName}
                </span>
                <span className={styles.userEmail}>{user?.email}</span>
              </div>
              <button
                className={styles.logoutButton}
                onClick={handleLogoutToggle}
                aria-label="Logout"
              >
                <LogOut size={24} />
              </button>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Confirm Logout?"
        message="Are you sure you want to log out?"
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={executeLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </aside>
  );
}
