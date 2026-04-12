import { Outlet } from 'react-router';
import { LandingNavbar } from './LandingNavbar';
import { Footer } from './Footer';
import styles from './LandingLayout.module.css';

export function LandingLayout() {
  return (
    <div className={styles.layout}>
      <LandingNavbar />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
