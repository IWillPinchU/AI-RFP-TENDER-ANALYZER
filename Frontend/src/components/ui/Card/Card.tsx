import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';
import styles from './Card.module.css';

export type CardVariant = 'default' | 'elevated' | 'bordered' | 'glass';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  hoverable?: boolean;
  children: ReactNode;
}

export function Card({
  variant = 'default',
  padding = 'md',
  hoverable = false,
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        styles.card,
        styles[variant],
        styles[`pad-${padding}`],
        hoverable && styles.hoverable,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
