import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { authService } from '@/services/authService';
import logoUrl from '@/assets/logo.png';
import { AuthSidebar } from './components/AuthSidebar';
import styles from './AuthPage.module.css';
import formStyles from './components/SharedFormUI.module.css';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    token ? 'loading' : 'error'
  );
  const [errorMessage, setErrorMessage] = useState(
    token ? '' : 'Invalid verification link. Token is missing.'
  );
  const isProcessed = useRef(false);

  useEffect(() => {
    if (isProcessed.current || !token) return;
    isProcessed.current = true;

    async function verify() {
      try {
        await authService.verifyEmail(token!);
        setStatus('success');
      } catch (err: unknown) {
        setStatus('error');
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Failed to verify email. The link may have expired.');
        }
      }
    }

    verify();
  }, [token]);

  return (
    <div className={styles.container}>
      <AuthSidebar />

      <div className={styles.divider} />

      <div className={styles.rightPanel}>
        <Link to="/" className={styles.homeLink} aria-label="Back to home">
          <img src={logoUrl} alt="Wayne AI" className={styles.logoImage} />
        </Link>
        
        <div className={`${styles.formContainer} ${styles.formIdle}`}>
          <div style={{ textAlign: 'center', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
            
            {status === 'loading' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                  <Loader2 className={styles.spin} size={48} color="#00f0ff" />
                </div>
                <h1 className={formStyles.formTitle}>Verifying email...</h1>
                <p className={formStyles.formSubtitle}>Please wait while we confirm your account.</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                  <CheckCircle2 size={56} color="#10b981" />
                </div>
                <h1 className={formStyles.formTitle}>Email verified</h1>
                <p className={formStyles.formSubtitle} style={{ marginBottom: '32px' }}>
                  Your account has been successfully verified. You can now log in and start using Wayne AI.
                </p>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <button className={formStyles.primaryButton}>Go to login</button>
                </Link>
              </>
            )}

            {status === 'error' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                  <XCircle size={56} color="#f43f5e" />
                </div>
                <h1 className={formStyles.formTitle}>Verification failed</h1>
                <p className={formStyles.formSubtitle} style={{ color: '#f43f5e', marginBottom: '32px' }}>
                  {errorMessage}
                </p>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <button className={formStyles.primaryButton}>Back to login</button>
                </Link>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}