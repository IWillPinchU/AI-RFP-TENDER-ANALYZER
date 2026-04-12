import { useAuthStore } from '@/stores/authStore';
import styles from './Tabs.module.css';

export function ProfileSettings() {
  const { user } = useAuthStore();

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Profile Settings</h3>
      <p className={styles.subtitle}>Manage your personal information and preferences.</p>

      <div className={styles.formGroup}>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label}>First Name</label>
            <input type="text" className={styles.input} defaultValue={user?.firstName} disabled />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Last Name</label>
            <input type="text" className={styles.input} defaultValue={user?.lastName} disabled />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Email Address</label>
          <input type="email" className={styles.input} defaultValue={user?.email} disabled />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Username</label>
          <input type="text" className={styles.input} defaultValue={user?.username} disabled />
        </div>
      </div>

    </div>
  );
}
