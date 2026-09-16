import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DisclosureNoticeProps {
  children: React.ReactNode;
  className?: string;
}

export function DisclosureNotice({ children, className }: DisclosureNoticeProps) {
  return (
    <p
      className={cn(
        'flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground',
        className,
      )}
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}