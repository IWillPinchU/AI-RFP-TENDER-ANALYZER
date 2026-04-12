import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <h1 className={styles.code}>404</h1>
      <h4 className={styles.title}>Page not found</h4>
      <p className={styles.description}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button variant="primary" onClick={() => navigate('/dashboard')}>
        Go to Dashboard
      </Button>
    </div>
  );
}
