import { useState, useEffect } from 'react';
import { useLocation, Link, Navigate } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import logoUrl from '@/assets/logo.png';
import { AuthSidebar } from './components/AuthSidebar';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import styles from './AuthPage.module.css';

export function AuthPage() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();


  const isRegisterRoute = location.pathname === '/register' || location.search.includes('mode=register');
  const [mode, setMode] = useState<'login' | 'register'>(isRegisterRoute ? 'register' : 'login');
  const [visibleMode, setVisibleMode] = useState<'login' | 'register'>(isRegisterRoute ? 'register' : 'login');
  
  const [phase, setPhase] = useState<'idle' | 'closing' | 'opening'>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<'none' | 'enter-email' | 'sent'>('none');

  const switchMode = (next: 'login' | 'register') => {
    if (next === mode || phase !== 'idle') return;
    
    window.history.pushState(null, '', `/${next}`);
    
    setPhase('closing');
    setTimeout(() => {
      setMode(next);
      setVisibleMode(next);
      setShowPassword(false);
      setShowConfirmPassword(false);
      setForgotStep('none');
      setPhase('opening');
      setTimeout(() => setPhase('idle'), 320);
    }, 280);
  };

  useEffect(() => {
    const isReg = location.pathname === '/register' || location.search.includes('mode=register');
    const expectedMode = isReg ? 'register' : 'login';
    if (expectedMode !== mode && phase === 'idle') {
      switchMode(expectedMode);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  const formStateClass =
    phase === 'closing' ? styles.formClosing : phase === 'opening' ? styles.formOpening : styles.formIdle;

  // Already logged in — send to dashboard (or wherever they came from)
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return (
    <div className={styles.container}>
      <AuthSidebar />

      <div className={styles.divider} />

      <div className={styles.rightPanel}>
        <Link to="/" className={styles.homeLink} aria-label="Back to home">
          <img src={logoUrl} alt="Wayne AI" className={styles.logoImage} />
        </Link>
        
        <div className={`${styles.formContainer} ${formStateClass}`}>
          {visibleMode === 'login' ? (
            <LoginForm
              onSwitch={() => switchMode('register')}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              forgotStep={forgotStep}
              setForgotStep={setForgotStep}
            />
          ) : (
            <RegisterForm
              onSwitch={() => switchMode('login')}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showConfirmPassword={showConfirmPassword}
              setShowConfirmPassword={setShowConfirmPassword}
            />
          )}
        </div>
      </div>
    </div>
  );
}
