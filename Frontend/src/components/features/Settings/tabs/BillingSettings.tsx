import { useState } from 'react';
import { CreditCard, Plus } from 'lucide-react';
import styles from './Tabs.module.css';

export function BillingSettings() {
  const [methods, setMethods] = useState([{ id: 1, type: 'Visa', ending: '4242', exp: '12/28' }]);

  const addMockMethod = () => {
    setMethods([...methods, { id: Date.now(), type: 'Mastercard', ending: '5555', exp: '08/29' }]);
  };

  const removeMethod = (id: number) => {
    setMethods(methods.filter(m => m.id !== id));
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Billing Settings</h3>
      <p className={styles.subtitle}>Manage your subscription plan and payment methods.</p>

      {/* Current Plan */}
      <h4 className={styles.cardTitle} style={{ marginTop: '8px' }}>Current Plan</h4>
      <div className={styles.card} style={{ marginTop: '8px', marginBottom: '32px' }}>
        <div>
          <div className={styles.cardTitle}>enterprise tier</div>
          <div className={styles.cardDesc}>Unlimited users, advanced ML processing, and priority support.</div>
        </div>
        <button className={styles.secondaryButton}>Manage Plan</button>
      </div>

      {/* Payment Methods */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h4 className={styles.cardTitle} style={{ margin: 0 }}>Payment Methods</h4>
        <button 
          className={styles.secondaryButton} 
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 12px' }}
          onClick={addMockMethod}
        >
          <Plus size={14} /> Add Method
        </button>
      </div>
      
      {methods.length === 0 ? (
        <div className={styles.card} style={{ justifyContent: 'center', padding: '32px' }}>
          <div className={styles.cardDesc}>No payment methods on file.</div>
        </div>
      ) : (
        methods.map((method) => (
          <div key={method.id} className={styles.card} style={{ marginTop: '8px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'var(--surface-float)', padding: '8px', borderRadius: '4px' }}>
                <CreditCard size={24} color="var(--text-secondary)" />
              </div>
              <div>
                <div className={styles.cardTitle}>{method.type} ending in {method.ending}</div>
                <div className={styles.cardDesc}>Expires {method.exp}</div>
              </div>
            </div>
            <button 
              className={styles.dangerButton}
              onClick={() => removeMethod(method.id)}
            >
              Remove
            </button>
          </div>
        ))
      )}
    </div>
  );
}
