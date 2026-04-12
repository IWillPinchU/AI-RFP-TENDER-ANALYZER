import { FileText, MessageSquare, GitCompareArrows, PencilRuler, ShieldAlert, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Reveal } from '@/components/ui/Reveal';
import styles from './FeaturesSection.module.css';

const FEATURES = [
  {
    title: 'Instant Summarization',
    description: 'Get deep, category-based executive summaries of massive RFPs in seconds.',
    icon: FileText,
  },
  {
    title: 'Interactive Q&A',
    description: 'Query your documents conversationally. Generate answers tied directly to source text.',
    icon: MessageSquare,
  },
  {
    title: 'Side-by-Side Compare',
    description: 'Analyze similarities, differences, and strategic advantages between any two tenders.',
    icon: GitCompareArrows,
  },
  {
    title: 'Proposal Generation',
    description: 'Auto-generate targeted proposal sections (Technical, Pricing, Risk) with very high accuracy.',
    icon: PencilRuler,
  },
  {
    title: 'Risk Assessment',
    description: 'ML models automatically predict risk levels and win probabilities based on historical data.',
    icon: ShieldAlert,
  },
  {
    title: 'Deep Context',
    description: 'Our hybrid intent-based retrieval ensures no critical eligibility or legal clause is missed.',
    icon: BookOpen,
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className={styles.section}>
      <div className={styles.container}>
        <Reveal>
          <div className={styles.header}>
            <h2 className={styles.title}>Everything you need to win</h2>
            <p className={styles.subtitle}>
              A complete suite of AI tools designed specifically for complex tender analysis.
            </p>
          </div>
        </Reveal>
        
        <div className={styles.grid}>
          {FEATURES.map((feat, idx) => (
            <Reveal key={feat.title} delay={idx * 150} width="100%">
              <Card variant="glass" className={styles.featureCard}>
                <div className={styles.iconWrapper}>
                  <feat.icon size={24} />
                </div>
                <h3 className={styles.featTitle}>{feat.title}</h3>
                <p className={styles.featDesc}>{feat.description}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
