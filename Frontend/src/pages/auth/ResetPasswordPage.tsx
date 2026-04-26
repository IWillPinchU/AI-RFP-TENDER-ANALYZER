import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { AuthSidebar } from './components/AuthSidebar';
import { authService } from '@/services/authService';
import { PASSWORD_RULES, validatePassword } from '@/utils/passwordRules';
import logoUrl from '@/assets/logo.png';
import styles from './AuthPage.module.css';
import formStyles from './components/SharedFormUI.module.css';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Both fields are required.');
      return;
    }
    const ruleError = validatePassword(password);
    if (ruleError) {
      setError(ruleError);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!token) {
      setError('Invalid or missing reset token. Please request a new link.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <AuthSidebar />
      <div className={styles.divider} />

      <div className={styles.rightPanel}>
        <Link to="/" className={styles.homeLink} aria-label="Back to home">
          <img src={logoUrl} alt="Wayne AI" className={styles.logoImage} />
        </Link>

        <div className={`${styles.formContainer} ${styles.formIdle}`}>
          {success ? (
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '8px 0', gap: '16px' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%',
                border: '1px solid rgba(52,211,153,0.3)',
                backgroundColor: 'rgba(52,211,153,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle size={28} color="#34d399" />
              </div>

              <div>
                <h1 className={formStyles.formTitle}>Password reset!</h1>
                <p className={formStyles.formSubtitle} style={{ marginTop: '8px', lineHeight: '1.6' }}>
                  Your password has been updated successfully.<br />
                  You can now log in with your new credentials.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className={formStyles.primaryButton}
                style={{ marginTop: '8px' }}
              >
                Go to Login
              </button>
            </div>
          ) : (
            
            <form onSubmit={handleSubmit}>
              <div className={formStyles.formHeader}>
                <h1 className={formStyles.formTitle}>Set new password</h1>
                <p className={formStyles.formSubtitle}>
                  Choose a strong password. You'll use this to log in to Wayne AI.
                </p>
              </div>

              {!token && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(251,191,36,0.25)',
                  backgroundColor: 'rgba(251,191,36,0.07)',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: '#fbbf24',
                  lineHeight: '1.5',
                }}>
                  ⚠ No reset token detected. Please use the link sent to your email.
                </div>
              )}

              {error && (
                <p style={{ color: '#f87171', fontSize: '14px', marginBottom: '16px', textAlign: 'left' }}>
                  {error}
                </p>
              )}

              {/* New password */}
              <div className={formStyles.field}>
                <label htmlFor="new-password" className={formStyles.label}>New Password</label>
                <div className={formStyles.passwordWrapper}>
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={formStyles.input}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className={formStyles.eyeButton}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className={formStyles.field}>
                <label htmlFor="confirm-new-password" className={formStyles.label}>Confirm Password</label>
                <div className={formStyles.passwordWrapper}>
                  <input
                    id="confirm-new-password"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat your new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className={`${formStyles.input} ${confirmPassword && password !== confirmPassword ? formStyles.inputError : ''}`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className={formStyles.eyeButton}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p style={{ fontSize: '12px', color: '#f87171', marginTop: '4px' }}>
                    Passwords do not match
                  </p>
                )}
              </div>

              {/* Password strength hint */}
              <PasswordStrength password={password} />

              <button
                type="submit"
                className={formStyles.primaryButton}
                style={{ marginTop: '24px' }}
                disabled={isLoading || !token}
              >
                {isLoading ? 'Updating password...' : 'Reset Password'}
              </button>

              <p className={formStyles.footerText}>
                <Link to="/login" style={{ color: 'var(--text-tertiary)', textDecoration: 'none', fontSize: '14px' }}>
                  ← Back to login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Password strength indicator using shared rules ── */
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
    <div style={{ marginTop: '12px' }}>
      {/* Bar */}
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '6px' }}>
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
