import { useState } from 'react';

import { Eye, EyeOff } from 'lucide-react';
import { authService } from '@/services/authService';
import { PASSWORD_RULES, validatePassword } from '@/utils/passwordRules';
import { Field, Divider, GoogleButton } from './SharedFormUI';
import styles from './SharedFormUI.module.css';

export function RegisterForm({
  onSwitch,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
}: {
  onSwitch: () => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (v: boolean) => void;
}) {

  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const ruleError = validatePassword(password);
    if (ruleError) {
      setError(ruleError);
      return;
    }

    setIsLoading(true);
    try {
      await authService.register({ firstName, lastName, email, password });
      setIsSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div className={styles.formHeader} style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 className={styles.formTitle}>Check your inbox</h1>
          <p className={styles.formSubtitle}>
            We've sent an email to <strong>{email}</strong>.<br />
            Please click the link inside to verify your account.
          </p>
        </div>
        <button type="button" onClick={onSwitch} className={styles.primaryButton}>
          Back to login
        </button>
      </div>
    );
  }

  const handleGoogleLogin = () => {
    const rawEnv = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const apiBase = rawEnv.replace(/\/api\/?$/, '');
    window.location.href = `${apiBase}/oauth2/authorization/google`;
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.formHeader}>
        <h1 className={styles.formTitle}>Create account</h1>
        <p className={styles.formSubtitle}>Get started with Wayne AI for free.</p>
      </div>

      {(error) && (
        <p style={{ color: '#f87171', fontSize: '14px', margin: '0 0 16px 0', textAlign: 'left' }}>
          {error}
        </p>
      )}

      <div className={styles.gridCols2}>
        <Field label="First Name" id="first-name" placeholder="Jane" value={firstName} onChange={e => setFirstName(e.target.value)} />
        <Field label="Last Name" id="last-name" placeholder="Smith" value={lastName} onChange={e => setLastName(e.target.value)} />
      </div>
      
      <Field label="Email" id="reg-email" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
      
      <div className={styles.field}>
        <label htmlFor="reg-password" className={styles.label}>Password</label>
        <div className={styles.passwordWrapper}>
          <input
            id="reg-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
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

      <PasswordStrength password={password} />

      <div className={styles.field}>
        <label htmlFor="confirm-password" className={styles.label}>Confirm Password</label>
        <div className={styles.passwordWrapper}>
          <input
            id="confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className={styles.input}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className={styles.eyeButton}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className={styles.primaryButton}
        style={{ marginTop: '24px' }}
        disabled={isLoading}
      >
        {isLoading ? 'Registering...' : 'Register'}
      </button>

      <Divider />
      <GoogleButton onClick={handleGoogleLogin} />

      <p className={styles.footerText}>
        Already have an account?{' '}
        <button type="button" onClick={onSwitch} className={styles.footerLink}>
          Login
        </button>
      </p>
    </form>
  );
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const results = PASSWORD_RULES.map(r => ({ label: r.label, pass: r.test(password) }));
  const passed = results.filter(r => r.pass).length;
  const total = results.length;

  const strengthColor =
    passed <= 1 ? '#f87171' :
    passed <= 2 ? '#fbbf24' :
    passed <= 3 ? '#60a5fa' : '#34d399';

  const strengthLabel =
    passed <= 1 ? 'Weak' :
    passed <= 2 ? 'Fair' :
    passed <= 3 ? 'Good' : 'Strong';

  return (
    <div style={{ marginTop: '-4px', marginBottom: '12px' }}>
      {/* Strength bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            style={{
              height: '3px',
              flex: 1,
              borderRadius: '2px',
              backgroundColor: i < passed ? strengthColor : 'rgba(255,255,255,0.08)',
              transition: 'background-color 0.2s',
            }}
          />
        ))}
      </div>

      {/* Rule checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '4px' }}>
        {results.map(r => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: r.pass ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${r.pass ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.1)'}`,
              fontSize: '9px',
              color: r.pass ? '#34d399' : 'var(--text-tertiary)',
            }}>
              {r.pass ? '✓' : ''}
            </span>
            <span style={{ fontSize: '11px', color: r.pass ? 'var(--text-secondary)' : 'var(--text-tertiary)', transition: 'color 0.2s' }}>
              {r.label}
            </span>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: '11px', color: strengthColor, fontWeight: 500 }}>
          {strengthLabel}
        </span>
      </div>
    </div>
  );
}
