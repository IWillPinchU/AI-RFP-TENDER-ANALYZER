import { Upload, Cpu, Download } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import styles from './HowItWorksSection.module.css';

const STEPS = [
  {
    icon: Upload,
    title: 'Upload your RFP',
    description: 'Securely upload your heavy PDF or DOCX files. We instantly parse and index every clause.',
  },
  {
    icon: Cpu,
    title: 'Wayne AI Analyzes',
    description: 'Our ML models scan for risks, flag eligibility issues, and summarize key requirements.',
  },
  {
    icon: Download,
    title: 'Export Proposal',
    description: 'Generate point-by-point proposal sections and expert insights, ready for export.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className={styles.section}>
      <div className={styles.container}>
        <Reveal>
          <div className={styles.header}>
            <h2 className={styles.title}>How it Works</h2>
          </div>
        </Reveal>
        
        <div className={styles.steps}>
          {STEPS.map((step, idx) => (
            <Reveal key={idx} delay={idx * 200}>
              <div className={styles.step}>
                <div className={styles.iconWrapper}>
                  <step.icon size={24} />
                </div>
                <h3 className={styles.stepTitle}>
                  <span className={styles.stepNumber}>{idx + 1}.</span> {step.title}
                </h3>
                <p className={styles.stepDesc}>{step.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
