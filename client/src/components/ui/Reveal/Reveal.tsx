import { useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/cn';
import styles from './Reveal.module.css';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  width?: 'auto' | '100%';
}

export function Reveal({ children, delay = 0, className, width = 'auto' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref} 
      className={cn(styles.reveal, isVisible && styles.visible, className)}
      style={{ transitionDelay: `${delay}ms`, width: width === '100%' ? '100%' : '100%' }}
    >
      {children}
    </div>
  );
}
