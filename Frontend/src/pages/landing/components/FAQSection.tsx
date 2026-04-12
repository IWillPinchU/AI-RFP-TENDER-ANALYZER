import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Reveal } from '@/components/ui/Reveal';
import styles from './FAQSection.module.css';

const FAQS = [
  {
    question: 'How accurate is the AI?',
    answer: 'Wayne AI generates highly accurate proposals and extractions by grounding its LLM responses directly in your uploaded source documents, paired with a sophisticated hybrid retrieval system.',
  },
  {
    question: 'Are my documents secure?',
    answer: 'Yes. All documents are processed securely and your data is never used to train the base model.',
  },
  {
    question: 'Can I compare multiple RFPs at once?',
    answer: 'Currently, Wayne AI allows you to instantly run side-by-side comparisons of two tenders to evaluate strategic advantages and differences.',
  },
  {
    question: 'What file formats are supported?',
    answer: 'We support PDF, DOC, and DOCX files. Our ingestion engine automatically chunks and embeds your documents for instant retrieval.',
  },
];

export function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className={styles.section}>
      <div className={styles.container}>
        <Reveal>
          <div className={styles.header}>
            <h2 className={styles.title}>Frequently Asked Questions</h2>
          </div>
        </Reveal>
        
        <Reveal delay={200}>
          <div className={styles.faqList}>
            {FAQS.map((faq, idx) => (
              <div 
                key={idx} 
                className={cn(styles.faqItem, openIdx === idx && styles.open)}
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              >
                <div className={styles.question}>
                  <span className={styles.qText}>{faq.question}</span>
                  <ChevronDown size={20} className={styles.icon} />
                </div>
                <div className={styles.answer}>
                  <div className={styles.answerContent}>
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
