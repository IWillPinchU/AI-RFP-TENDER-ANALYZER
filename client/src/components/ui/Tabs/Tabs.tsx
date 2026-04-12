import type { ReactNode } from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';
import { cn } from '@/utils/cn';
import styles from './Tabs.module.css';

export interface TabItem {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

interface TabContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function Tabs({
  items,
  value,
  onValueChange,
  children,
  className,
}: TabsProps) {
  return (
    <RadixTabs.Root
      value={value}
      onValueChange={onValueChange}
      className={cn(styles.root, className)}
    >
      <RadixTabs.List className={styles.list}>
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={styles.trigger}
          >
            {item.icon && <span className={styles.triggerIcon}>{item.icon}</span>}
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {children}
    </RadixTabs.Root>
  );
}

export function TabContent({ value, children, className }: TabContentProps) {
  return (
    <RadixTabs.Content value={value} className={cn(styles.content, className)}>
      {children}
    </RadixTabs.Content>
  );
}
