import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import logoUrl from '@/assets/logo.png';
import styles from './AuthSidebar.module.css';

// RFP-focused Wayne AI mock project titles
const floatingCards = [
  { title: 'DoD Multi-Cloud Migration Infrastructure', risk: 'Low' as const, probability: 84 },
  { title: 'Enterprise Cybersecurity Overhaul RFP', risk: 'Medium' as const, probability: 61 },
  { title: 'Global Supply Chain Optimization Bid', risk: 'High' as const, probability: 38 },
  { title: 'National Security Infrastructure Tender', risk: 'Medium' as const, probability: 57 },
  { title: 'Federal Data Centre Operations Logistics', risk: 'Low' as const, probability: 76 },
  { title: 'Public Sector AI Integration Programme', risk: 'Low' as const, probability: 91 },
  { title: 'Healthcare Network Modernisation Bid', risk: 'High' as const, probability: 42 },
  { title: 'State Level IT Systems Overhaul RFP', risk: 'Medium' as const, probability: 68 },
  { title: 'Cross-Border Trade Automation Contract', risk: 'Low' as const, probability: 79 },
  { title: 'Classified Drone Surveillance Procurement', risk: 'High' as const, probability: 33 },
  { title: 'Aerospace Components Manufacturing RFP', risk: 'Medium' as const, probability: 65 },
  { title: 'National Logistics Fleet Management System', risk: 'Low' as const, probability: 88 },
  { title: 'Military Base Communications Upgrade', risk: 'Medium' as const, probability: 54 },
];

const cardConfig = [
  { left: '2%',  bottom: '-160px', delay: '0s',    duration: '11s', drift: '16px'  },
  { left: '12%', bottom: '-160px', delay: '4s',    duration: '12s', drift: '-14px' },
  { left: '22%', bottom: '-160px', delay: '8s',    duration: '10s', drift: '18px'  },
  { left: '32%', bottom: '-160px', delay: '1.5s',  duration: '13s', drift: '-16px' },
  { left: '42%', bottom: '-160px', delay: '5.5s',  duration: '11s', drift: '14px'  },
  { left: '52%', bottom: '-160px', delay: '9.5s',  duration: '12s', drift: '-18px' },
  { left: '62%', bottom: '-160px', delay: '3s',    duration: '10s', drift: '16px'  },
  { left: '70%', bottom: '-160px', delay: '7s',    duration: '13s', drift: '-12px' },
  { left: '78%', bottom: '-160px', delay: '11s',   duration: '11s', drift: '20px'  },
  { left: '86%', bottom: '-160px', delay: '2s',    duration: '12s', drift: '-16px' },
  { left: '7%',  bottom: '-160px', delay: '6s',    duration: '10s', drift: '12px'  },
  { left: '47%', bottom: '-160px', delay: '10s',   duration: '13s', drift: '-14px' },
  { left: '75%', bottom: '-160px', delay: '14s',   duration: '11s', drift: '18px'  },
];

function FloatingCard({
  card,
  config,
  index,
}: {
  card: (typeof floatingCards)[0];
  config: (typeof cardConfig)[0];
  index: number;
}) {
  const animName = `floatCard${index}`;
  const d = config.drift;
  const dn = d.startsWith('-') ? d.substring(1) : `-${d}`;

  return (
    <>
      <style>{`
        @keyframes ${animName} {
          0%   { transform: translateY(0px)   translateX(0px)  rotate(-1deg); opacity: 0;    }
          8%   { opacity: 0.28; }
          25%  { transform: translateY(-28vh) translateX(${d}) rotate(0.5deg); }
          50%  { transform: translateY(-55vh) translateX(0px)  rotate(-0.5deg); }
          75%  { transform: translateY(-80vh) translateX(${dn}) rotate(0.8deg); }
          88%  { opacity: 0.22; }
          100% { transform: translateY(-110vh) translateX(0px) rotate(1deg);  opacity: 0;    }
        }
      `}</style>
      <div
        className={styles.floatingCard}
        style={{
          left: config.left,
          bottom: config.bottom,
          animation: `${animName} ${config.duration} ${config.delay} infinite linear`,
        }}
      >
        <p className={styles.cardTitle}>{card.title}</p>
        <div className={styles.cardMeta}>
          <span className={cn(styles.riskBadge, styles[`risk${card.risk}`])}>
            {card.risk} Risk
          </span>
          <span className={styles.winProb}>Win {card.probability}%</span>
        </div>
      </div>
    </>
  );
}

function TypewriterLogo() {
  const fullText = 'Wayne AI';
  const [displayed, setDisplayed] = useState('');
  const [phase, setPhase] = useState<'typing' | 'holding' | 'erasing' | 'waiting'>('typing');

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === 'typing') {
      if (displayed.length < fullText.length) {
        timeout = setTimeout(() => {
          setDisplayed(fullText.slice(0, displayed.length + 1));
        }, 100);
      } else {
        timeout = setTimeout(() => setPhase('holding'), 1800);
      }
    } else if (phase === 'holding') {
      timeout = setTimeout(() => setPhase('erasing'), 1200);
    } else if (phase === 'erasing') {
      if (displayed.length > 0) {
        timeout = setTimeout(() => {
          setDisplayed(displayed.slice(0, -1));
        }, 60);
      } else {
        timeout = setTimeout(() => setPhase('waiting'), 600);
      }
    } else if (phase === 'waiting') {
      timeout = setTimeout(() => setPhase('typing'), 400);
    }

    return () => clearTimeout(timeout);
  }, [displayed, phase]);

  const wayneVisible = displayed.slice(0, Math.min(displayed.length, 5));
  const aiVisible = displayed.length > 5 ? displayed.slice(5) : '';

  return (
    <h1 className={styles.typewriterText}>
      <span className={styles.twBright}>{wayneVisible}</span>
      <span className={styles.twDim}>{aiVisible}</span>
      <span
        className={styles.twCursor}
        style={{
          opacity: phase === 'erasing' || phase === 'waiting' ? 0 : 1,
        }}
      />
    </h1>
  );
}

export function AuthSidebar() {
  return (
    <div className={styles.sidebar}>
      <div className={styles.gridOverlay} />

      {cardConfig.map((config, i) => (
        <FloatingCard key={i} card={floatingCards[i]} config={config} index={i} />
      ))}

      <div className={styles.brandingOverlay}>
        <img src={logoUrl} alt="Wayne AI Logo" className={styles.logoImageLarge} />
        <TypewriterLogo />
        <p className={styles.tagline}>
          <span className={styles.taglineAccent}>Read every clause.</span>
          <span className={styles.taglineMuted}>Win the right bids.</span>
        </p>
      </div>
    </div>
  );
}
