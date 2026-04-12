import { useEffect, useState } from 'react';
import { X, User, Shield, CreditCard } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { cn } from '@/utils/cn';

import { ProfileSettings } from './tabs/ProfileSettings';
import { SecuritySettings } from './tabs/SecuritySettings';
import { BillingSettings } from './tabs/BillingSettings';

import styles from './SettingsModal.module.css';

type Tab = 'profile' | 'security' | 'billing';

export function SettingsModal() {
  const { isOpen, closeSettings } = useSettingsStore();
  const setUser = useAuthStore((s) => s.setUser);
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Refresh user data from backend when modal opens
  useEffect(() => {
    if (!isOpen) return;
    authService.getMe().then(setUser).catch(() => {});
  }, [isOpen, setUser]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSettings();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeSettings]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={closeSettings}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Settings</h2>
          <button className={styles.closeButton} onClick={closeSettings} aria-label="Close Settings">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.contentRow}>
          {/* Left Navigation */}
          <div className={styles.sidebar}>
            <button
              className={cn(styles.tabBtn, activeTab === 'profile' && styles.tabBtnActive)}
              onClick={() => setActiveTab('profile')}
            >
              <User size={18} />
              <span>Profile</span>
            </button>
            <button
              className={cn(styles.tabBtn, activeTab === 'security' && styles.tabBtnActive)}
              onClick={() => setActiveTab('security')}
            >
              <Shield size={18} />
              <span>Security</span>
            </button>
            <button
              className={cn(styles.tabBtn, activeTab === 'billing' && styles.tabBtnActive)}
              onClick={() => setActiveTab('billing')}
            >
              <CreditCard size={18} />
              <span>Billing</span>
            </button>
          </div>

          {/* Right Content */}
          <div className={styles.contentArea}>
            {activeTab === 'profile' && <ProfileSettings />}
            {activeTab === 'security' && <SecuritySettings />}
            {activeTab === 'billing' && <BillingSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}
