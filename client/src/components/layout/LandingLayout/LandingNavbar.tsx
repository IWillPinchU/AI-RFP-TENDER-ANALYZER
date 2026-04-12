import { Link } from 'react-router';
import { Button } from '@/components/ui/Button';
import logoUrl from '@/assets/logo.png';
import styles from './LandingLayout.module.css';

export function LandingNavbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <div className={styles.logo}>
          <img src={logoUrl} alt="Wayne AI Logo" className={styles.logoImage} />
          <span className={styles.logoText}>Wayne AI</span>
        </div>
        
        <div className={styles.navLinks}>
          <a href="#features" className={styles.navLink}>Features</a>
          <a href="#how-it-works" className={styles.navLink}>How it Works</a>
          <a href="#faq" className={styles.navLink}>FAQ</a>
        </div>

        <div className={styles.navActions}>
          <Link to="/login">
            <Button variant="primary">Login / Register</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
