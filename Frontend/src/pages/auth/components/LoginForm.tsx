import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { Field, Divider, GoogleButton } from './SharedFormUI';
import styles from './SharedFormUI.module.css';

export function LoginForm({
  onSwitch,
  showPassword,
  setShowPassword,
  forgotStep,
  setForgotStep,
}: {
  onSwitch: () => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  forgotStep: 'none' | 'enter-email' | 'sent';
  setForgotStep: (s: 'none' | 'enter-email' | 'sent') => void;
}) {
  const navigate = useNavigate();
  const loginFn = useAuthStore((state) => state.login);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  
  const [twoFaToken, setTwoFaToken] = useState<string | null>(null);
  const [twoFaCode, setTwoFaCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const resp = await authService.login({ email, password });
      
      if (resp.requiresTwoFactor && resp.tempToken) {
        setTwoFaToken(resp.tempToken);
      } else {
        loginFn(resp.accessToken, resp.refreshToken, resp.user);
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Invalid credentials');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const rawEnv = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const apiBase = rawEnv.replace(/\/api\/?$/, '');
    window.location.href = `${apiBase}/oauth2/authorization/google`;
  };

  const handle2faSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFaCode || !twoFaToken) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const resp = await authService.verify2fa({ tempToken: twoFaToken, code: twoFaCode });
      loginFn(resp.accessToken, resp.refreshToken, resp.user);
      navigate('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Invalid 2FA code');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (twoFaToken) {
    return (
      <form onSubmit={handle2faSubmit}>
        <div className={styles.formHeader} style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <ShieldCheck size={48} color="#00f0ff" />
          </div>
          <h1 className={styles.formTitle}>Two-Factor Authentication</h1>
          <p className={styles.formSubtitle}>
            Please enter the 6-digit code from your authenticator app to continue.
          </p>
        </div>

        <div className={styles.field}>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={twoFaCode}
            onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ''))}
            className={`${styles.input} ${error ? styles.inputError : ''}`}
            style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
            disabled={isLoading}
          />
          {error && <span style={{ color: '#f87171', fontSize: '12px', marginTop: '4px', textAlign: 'center' }}>{error}</span>}
        </div>

        <button type="submit" disabled={isLoading || twoFaCode.length !== 6} className={styles.primaryButton} style={{ marginTop: '24px' }}>
          {isLoading ? 'Verifying...' : 'Verify Code'}
        </button>

        <div className={styles.footerText} style={{ marginTop: '24px' }}>
          <button type="button" onClick={() => setTwoFaToken(null)} className={styles.textButton}>
            Back to login
          </button>
        </div>
      </form>
    );
  }

  if (forgotStep === 'enter-email') {
    const handleForgot = async () => {
      if (!forgotEmail) return;
      setIsForgotLoading(true);
      setForgotError('');
      try {
        await authService.forgotPassword(forgotEmail);
        setForgotStep('sent');
      } catch (err: unknown) {
        setForgotError(err instanceof Error ? err.message : 'Failed to send reset link.');
      } finally {
        setIsForgotLoading(false);
      }
    };

    return (
      <div className={styles.formContent}>
        <div className={styles.formHeader}>
          <button
            type="button"
            onClick={() => setForgotStep('none')}
            className={styles.textButton}
            style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            ← Back to login
          </button>
          <h1 className={styles.formTitle}>Reset password</h1>
          <p className={styles.formSubtitle}>
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {forgotError && (
          <p style={{ color: '#f87171', fontSize: '14px', marginBottom: '16px' }}>{forgotError}</p>
        )}
        
        <Field 
          label="Email" 
          id="forgot-email" 
          type="email" 
          placeholder="you@company.com" 
          value={forgotEmail}
          onChange={(e) => setForgotEmail(e.target.value)}
        />
        
        <button
          type="button"
          onClick={handleForgot}
          className={styles.primaryButton}
          style={{ marginTop: '24px' }}
          disabled={isForgotLoading || !forgotEmail}
        >
          {isForgotLoading ? 'Sending...' : 'Send reset link'}
        </button>
      </div>
    );
  }

  if (forgotStep === 'sent') {
    return (
      <div className={styles.formContent}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '16px 0' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" color="#fff">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className={styles.formTitle}>Check your email</h1>
          <p className={styles.formSubtitle} style={{ marginTop: '8px', lineHeight: '1.6' }}>
            A password reset link has been sent to <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{forgotEmail}</span>.<br />
            Check your inbox and follow the instructions.
          </p>
        </div>
        
        <button
          type="button"
          onClick={() => setForgotStep('none')}
          className={styles.googleButton}
          style={{ marginTop: '24px' }}
        >
          Back to login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.formHeader}>
        <h1 className={styles.formTitle}>Sign in</h1>
        <p className={styles.formSubtitle}>Welcome back. Enter your credentials to continue.</p>
      </div>

      {error && <p style={{ color: '#f87171', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}

      <Field 
        label="Email" 
        id="email" 
        type="email" 
        placeholder="you@company.com" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      
      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>
          Password
        </label>
        <div className={styles.passwordWrapper}>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={styles.eyeButton}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className={styles.flexRow} style={{ marginTop: '8px', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => setForgotStep('enter-email')}
          className={styles.textButton}
        >
          Forgot password?
        </button>
        <button
          type="submit"
          className={styles.primaryButton}
          style={{ width: 'auto', padding: '8px 20px' }}
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Login'}
        </button>
      </div>

      <Divider />
      <GoogleButton onClick={handleGoogleLogin} />

      <p className={styles.footerText}>
        Not registered?{' '}
        <button type="button" onClick={onSwitch} className={styles.footerLink}>
          Sign up
        </button>
      </p>
    </form>
  );
}
