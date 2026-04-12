import { Link } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import styles from './BottomCTASection.module.css';

export function BottomCTASection() {
  return (
    <section className={styles.section}>
      <Reveal width="100%">
        <div className={styles.container}>
          <div className={styles.glow} />
          <h2 className={styles.title}>Ready to automate your tender process?</h2>
          <p className={styles.subtitle}>
            Stop wasting hours on manual analysis. Let Wayne AI uncover the risks and write your proposals.
          </p>
          <div className={styles.actions}>
            <Link to="/login">
              <Button variant="primary" className={styles.ctaButton}>Get Started</Button>
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
