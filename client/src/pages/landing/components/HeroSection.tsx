import { Link } from 'react-router';
import { HeroCanvas } from './HeroCanvas';
import { Button } from '@/components/ui/Button';
import styles from './HeroSection.module.css';

export function HeroSection() {
  return (
    <section className={styles.heroSection}>
      <HeroCanvas />
      
      <div className={styles.bottomFade} />
      
      <div className={styles.content}>
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          Currently Under Development
        </div>
        
        <h1 className={styles.title}>
          Win More RFPs <br />
          <span className={styles.gradientText}>with AI</span>
        </h1>
        
        <p className={styles.subtitle}>
          Wayne AI decodes tenders, assesses risks, and auto-generates masterful proposals in seconds.
        </p>
        
        <div className={styles.actions}>
          <Link to="/login">
            <Button variant="primary" className={styles.ctaButton}>Get Started</Button>
          </Link>
          <Button variant="outline" className={styles.ctaButton}>Book Demo</Button>
        </div>
      </div>
    </section>
  );
}
