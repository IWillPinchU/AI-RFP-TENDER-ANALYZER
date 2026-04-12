import styles from './SettingsPage.module.css';

export function SettingsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h4 className={styles.title}>Settings</h4>
        <p className={styles.subtitle}>Manage your profile and preferences</p>
      </div>
      <div className={styles.placeholder}>
        Settings and profile management coming soon
      </div>
    </div>
  );
}
