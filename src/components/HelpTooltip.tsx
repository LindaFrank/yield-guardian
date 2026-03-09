import { useState, useRef, useEffect, ReactNode } from 'react';
import { useHelpWizard } from '@/contexts/HelpWizardContext';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  text: string;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function HelpTooltip({ text, children, side = 'top' }: HelpTooltipProps) {
  const { enabled } = useHelpWizard();
  const [hovered, setHovered] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hovered || !enabled || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipEl = tooltipRef.current;
    const tw = tooltipEl?.offsetWidth ?? 200;
    const th = tooltipEl?.offsetHeight ?? 40;
    const gap = 10;

    let top = 0;
    let left = 0;

    switch (side) {
      case 'top':
        top = rect.top - th - gap;
        left = rect.left + rect.width / 2 - tw / 2;
        break;
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tw / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - th / 2;
        left = rect.left - tw - gap;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - th / 2;
        left = rect.right + gap;
        break;
    }

    // Clamp to viewport
    left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
    top = Math.max(8, top);

    setCoords({ top, left });
  }, [hovered, enabled, side]);

  if (!enabled) return <>{children}</>;

  const show = hovered && enabled;

  const arrowClass = cn(
    'absolute w-2.5 h-2.5 rotate-45 bg-popover border border-border',
    side === 'top' && 'bottom-[-6px] left-1/2 -translate-x-1/2 border-t-0 border-l-0',
    side === 'bottom' && 'top-[-6px] left-1/2 -translate-x-1/2 border-b-0 border-r-0',
    side === 'left' && 'right-[-6px] top-1/2 -translate-y-1/2 border-l-0 border-b-0',
    side === 'right' && 'left-[-6px] top-1/2 -translate-y-1/2 border-r-0 border-t-0',
  );

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative"
      >
        {/* Subtle highlight ring when wizard is on */}
        <div className="absolute inset-0 rounded-xl ring-2 ring-primary/20 pointer-events-none" />
        {children}
      </div>

      {show && (
        <div
          ref={tooltipRef}
          style={{ top: coords.top, left: coords.left }}
          className="fixed z-[9999] max-w-xs px-3 py-2 rounded-lg bg-popover text-popover-foreground text-sm border border-border shadow-elevated animate-fade-in"
        >
          <span className={arrowClass} />
          {text}
        </div>
      )}
    </>
  );
}
