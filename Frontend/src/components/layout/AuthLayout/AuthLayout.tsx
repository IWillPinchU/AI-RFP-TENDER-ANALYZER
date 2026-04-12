import { Outlet } from 'react-router';

import logoUrl from '@/assets/logo.png';
import styles from './AuthLayout.module.css';

export function AuthLayout() {
  return (
    <div className={styles.layout}>

      <div className={styles.container}>
        <div className={styles.logo}>
          <img src={logoUrl} alt="Wayne AI" className={styles.logoImage} />
          <span className={styles.logoText}>Wayne AI</span>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
