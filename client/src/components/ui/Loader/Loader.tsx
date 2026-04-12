import { cn } from '@/utils/cn';
import styles from './Loader.module.css';

export type LoaderSize = 'sm' | 'md' | 'lg';
export type LoaderVariant = 'spinner' | 'dots' | 'pulse';

interface LoaderProps {
  size?: LoaderSize;
  variant?: LoaderVariant;
  className?: string;
  label?: string;
}

export function Loader({
  size = 'md',
  variant = 'spinner',
  className,
  label = 'Loading...',
}: LoaderProps) {
  if (variant === 'dots') {
    return (
      <div className={cn(styles.dotsContainer, styles[size], className)} role="status" aria-label={label}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn(styles.pulse, styles[size], className)} role="status" aria-label={label}>
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  return (
    <div className={cn(styles.spinnerContainer, styles[size], className)} role="status" aria-label={label}>
      <svg viewBox="0 0 24 24" fill="none" className={styles.spinnerIcon}>
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="31.4 31.4"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}
