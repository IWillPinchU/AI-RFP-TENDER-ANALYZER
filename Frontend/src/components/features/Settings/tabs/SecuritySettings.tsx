import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { userService } from '@/services/userService';
import styles from './Tabs.module.css';

export function SecuritySettings() {
  const { user, logout } = useAuthStore();
  const { closeSettings } = useSettingsStore();
  const navigate = useNavigate();
  const needsPasswordSetup = !user?.hasPassword;

  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  
  const [twoFAEnabled, setTwoFAEnabled] = useState(user?.twoFactorEnabled ?? false);
  const [setupStep, setSetupStep] = useState<'idle' | 'qr' | 'disabling'>('idle');
  const [qrImage, setQrImage] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAMsg, setTwoFAMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  
  const handleUpdatePassword = async () => {
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }

    setPasswordLoading(true);
    try {
      await userService.updatePassword(currentPassword, newPassword);
      setPasswordMsg({ type: 'success', text: 'Password updated! Logging you out...' });
      
      setTimeout(async () => {
        closeSettings();
        await logout();
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  
  const handleEnable2FA = async () => {
    setTwoFAMsg(null);
    setTwoFALoading(true);
    try {
      const res = await userService.enable2fa();
      setQrImage(res.qrCodeImage);
      setSetupStep('qr');
    } catch (err: any) {
      setTwoFAMsg({ type: 'error', text: err.message || 'Failed to initiate 2FA setup.' });
    } finally {
      setTwoFALoading(false);
    }
  };

  
  const handleVerify2FA = async () => {
    setTwoFAMsg(null);
    if (totpCode.length !== 6) {
      setTwoFAMsg({ type: 'error', text: 'Enter the 6-digit code from your authenticator.' });
      return;
    }
    setTwoFALoading(true);
    try {
      await userService.verify2faSetup(totpCode);
      setTwoFAEnabled(true);
      setSetupStep('idle');
      setTotpCode('');
      setTwoFAMsg({ type: 'success', text: '2FA enabled successfully!' });
    } catch (err: any) {
      setTwoFAMsg({ type: 'error', text: err.message || 'Invalid code. Try again.' });
    } finally {
      setTwoFALoading(false);
    }
  };

  
  const handleDisable2FA = async () => {
    setTwoFAMsg(null);
    if (totpCode.length !== 6) {
      setTwoFAMsg({ type: 'error', text: 'Enter your 6-digit code to confirm disabling.' });
      return;
    }
    setTwoFALoading(true);
    try {
      await userService.disable2fa(totpCode);
      setTwoFAEnabled(false);
      setSetupStep('idle');
      setTotpCode('');
      setTwoFAMsg({ type: 'success', text: '2FA disabled successfully.' });
    } catch (err: any) {
      setTwoFAMsg({ type: 'error', text: err.message || 'Failed to disable 2FA.' });
    } finally {
      setTwoFALoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Security Settings</h3>
      <p className={styles.subtitle}>Manage your account security and authentication methods.</p>

      {}
      <h4 className={styles.cardTitle} style={{ marginTop: '16px', marginBottom: '16px' }}>
        {needsPasswordSetup ? 'Set Password' : 'Change Password'}
      </h4>
      {needsPasswordSetup && (
        <p className={styles.cardDesc} style={{ marginBottom: '12px' }}>
          You signed in with Google. Set a password to also log in with email.
        </p>
      )}
      <div className={styles.formGroup} style={{ marginBottom: '32px' }}>
        {!needsPasswordSetup && (
          <div className={styles.field}>
            <label className={styles.label}>Current Password</label>
            <input
              type="password"
              className={styles.input}
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
        )}
        <div className={styles.field}>
          <label className={styles.label}>New Password</label>
          <div className={styles.passwordWrapper}>
            <input
              type={showNew ? 'text' : 'password'}
              className={styles.input}
              placeholder="Enter new password"
              style={{ paddingRight: '40px' }}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button type="button" className={styles.eyeBtn} onClick={() => setShowNew(!showNew)}>
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Confirm New Password</label>
          <div className={styles.passwordWrapper}>
            <input
              type={showConfirm ? 'text' : 'password'}
              className={styles.input}
              placeholder="Confirm new password"
              style={{ paddingRight: '40px' }}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirm(!showConfirm)}>
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {passwordMsg && (
          <div className={passwordMsg.type === 'success' ? styles.successMsg : styles.errorMsg}>
            {passwordMsg.text}
          </div>
        )}

        <button
          className={styles.primaryButton}
          style={{ width: 'fit-content', marginTop: '8px' }}
          onClick={handleUpdatePassword}
          disabled={passwordLoading || (!needsPasswordSetup && !currentPassword) || !newPassword || !confirmPassword}
        >
          {passwordLoading ? <Loader2 size={16} className={styles.spinner} /> : (needsPasswordSetup ? 'Set Password' : 'Update Password')}
        </button>
      </div>

      {}
      <h4 className={styles.cardTitle}>Two-Factor Authentication (2FA)</h4>

      {}
      {setupStep !== 'disabling' && (
        <div className={styles.card} style={{ marginTop: '8px', marginBottom: '8px' }}>
          <div>
            <div className={styles.cardTitle}>Authenticator App</div>
            <div className={styles.cardDesc}>
              {twoFAEnabled
                ? '2FA is currently enabled on your account.'
                : 'Add an extra layer of security to your account.'}
            </div>
          </div>
          {setupStep === 'idle' && (
            <button
              className={twoFAEnabled ? styles.dangerButton : styles.secondaryButton}
              onClick={() => {
                setTwoFAMsg(null);
                setTotpCode('');
                if (twoFAEnabled) {
                  setSetupStep('disabling');
                } else {
                  handleEnable2FA();
                }
              }}
              disabled={twoFALoading}
            >
              {twoFALoading ? <Loader2 size={16} className={styles.spinner} /> : twoFAEnabled ? 'Disable' : 'Enable'}
            </button>
          )}
        </div>
      )}

      {}
      {setupStep === 'disabling' && (
        <div className={styles.card} style={{ marginTop: '8px', marginBottom: '8px', flexDirection: 'column', alignItems: 'stretch', gap: '24px' }}>
          
          {}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className={styles.cardTitle}>Authenticator App</div>
              <div className={styles.cardDesc}>2FA is currently enabled on your account.</div>
            </div>
            <button className={styles.dangerButton} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
              Disable
            </button>
          </div>
          
          {}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className={styles.cardTitle} style={{ margin: 0 }}>
              Enter 6-digit code to confirm
            </div>
            
            <div style={{ width: '220px' }}>
              <input
                type="text"
                className={styles.input}
                placeholder="6-digit code"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
            </div>
          </div>
          
          {}
          {twoFAMsg && (
            <div className={twoFAMsg.type === 'success' ? styles.successMsg : styles.errorMsg} style={{ textAlign: 'center', marginTop: '-8px' }}>
              {twoFAMsg.text}
            </div>
          )}

          {}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button className={styles.dangerButton} onClick={handleDisable2FA} disabled={twoFALoading || totpCode.length !== 6}>
              {twoFALoading ? <Loader2 size={16} className={styles.spinner} /> : 'Confirm Disable'}
            </button>
            <button className={styles.secondaryButton} onClick={() => { setSetupStep('idle'); setTotpCode(''); setTwoFAMsg(null); }}>
              Cancel
            </button>
          </div>

        </div>
      )}

      {}
      {setupStep === 'idle' && twoFAMsg && (
        <div className={twoFAMsg.type === 'success' ? styles.successMsg : styles.errorMsg} style={{ marginBottom: '16px' }}>
          {twoFAMsg.text}
        </div>
      )}

      {}
      {setupStep === 'qr' && (
        <div className={styles.miniModalOverlay} onClick={() => { setSetupStep('idle'); setTotpCode(''); setTwoFAMsg(null); }}>
          <div className={styles.miniModal} onClick={(e) => e.stopPropagation()}>
            <h4 className={styles.cardTitle} style={{ textAlign: 'center', marginBottom: '4px' }}>Set Up Authenticator</h4>
            <p className={styles.cardDesc} style={{ textAlign: 'center', marginBottom: '20px' }}>
              Scan this QR code with your authenticator app
            </p>
            {qrImage && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <img
                  src={qrImage.startsWith('data:') ? qrImage : `data:image/png;base64,${qrImage}`}
                  alt="2FA QR Code"
                  style={{ width: 180, height: 180, borderRadius: 8, background: '#fff', padding: 8 }}
                />
              </div>
            )}
            <div className={styles.field} style={{ marginBottom: '16px' }}>
              <label className={styles.label}>Verification Code</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Enter 6-digit code"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
            </div>
            {twoFAMsg && (
              <div className={twoFAMsg.type === 'success' ? styles.successMsg : styles.errorMsg} style={{ marginBottom: '12px' }}>
                {twoFAMsg.text}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className={styles.primaryButton} onClick={handleVerify2FA} disabled={twoFALoading || totpCode.length !== 6}>
                {twoFALoading ? <Loader2 size={16} className={styles.spinner} /> : 'Verify & Enable'}
              </button>
              <button className={styles.secondaryButton} onClick={() => { setSetupStep('idle'); setTotpCode(''); setTwoFAMsg(null); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '32px' }} />
    </div>
  );
}

