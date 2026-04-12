import logoUrl from '@/assets/logo.png';
import styles from './LandingLayout.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerBrand}>
          <div className={styles.logo}>
            <img src={logoUrl} alt="Wayne AI Logo" className={styles.logoImage} />
            <span className={styles.logoText}>Wayne AI</span>
          </div>
          <p className={styles.footerDesc}>
            Win more RFPs with AI-powered document analysis and proposal generation.
          </p>
        </div>
        
        <div className={styles.footerLinks}>
          <div className={styles.linkColumn}>
            <span className={styles.columnTitle}>Connect</span>
            <a href="https://twitter.com/wayneai" target="_blank" rel="noreferrer">Twitter</a>
            <a href="https://linkedin.com/company/wayneai" target="_blank" rel="noreferrer">LinkedIn</a>
            <a href="mailto:contact@wayneai.com">Contact Us</a>
          </div>
        </div>
      </div>
      
      <div className={styles.footerBottom}>
        <span className={styles.copyright}>© {new Date().getFullYear()} Wayne AI. All rights reserved.</span>
      </div>
    </footer>
  );
}
