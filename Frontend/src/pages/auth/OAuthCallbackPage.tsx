import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { Loader2 } from 'lucide-react';
import styles from './AuthPage.module.css'; // Just re-use the dark background styles

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const loginFn = useAuthStore((s) => s.login);
  const isProcessed = useRef(false);

  useEffect(() => {
    if (isProcessed.current) return;
    isProcessed.current = true;

    async function processTokens() {
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        console.error('OAuth error from server:', errorParam);
        navigate('/login?error=oauth_failed');
        return;
      }

      if (!accessToken || !refreshToken) {
        console.error('Missing tokens in OAuth callback URL');
        navigate('/login?error=missing_tokens');
        return;
      }

      try {
        // Manually place the token in localStorage temporarily so authService can read it
        localStorage.setItem('rfp_access_token', accessToken);
        localStorage.setItem('rfp_refresh_token', refreshToken);

        // Fetch user data via /api/user/me
        const user = await authService.getMe();
        
        // Log them completely into the Zustand store
        loginFn(accessToken, refreshToken, user);
        
        // Push strictly to dashboard
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('Failed to grab OAuth profile:', err);
        localStorage.removeItem('rfp_access_token');
        localStorage.removeItem('rfp_refresh_token');
        navigate('/login?error=oauth_profile_failed');
      }
    }

    processTokens();
  }, [searchParams, navigate, loginFn]);

  return (
    <div className={styles.container} style={{ justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <Loader2 className={styles.spin} size={48} color="#00f0ff" />
        <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Authenticating...</h2>
        <p style={{ color: 'var(--text-dim)' }}>Please wait while we log you in securely.</p>
      </div>
    </div>
  );
}
