import { useState, useRef, useCallback, useLayoutEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
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

  const show = hovered && enabled;

  useLayoutEffect(() => {
    if (!show || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const tw = tooltipRef.current?.offsetWidth ?? 260;
    const th = tooltipRef.current?.offsetHeight ?? 48;
    const gap = 12;

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
    left = Math.max(12, Math.min(left, window.innerWidth - tw - 12));
    top = Math.max(12, top);

    setCoords({ top, left });
  }, [show, side]);

  const onEnter = useCallback(() => setHovered(true), []);
  const onLeave = useCallback(() => setHovered(false), []);

  if (!enabled) return <>{children}</>;

  const arrowClass = cn(
    'absolute w-3 h-3 rotate-45 bg-card-elevated border border-muted-foreground/30',
    side === 'top' && 'bottom-[-7px] left-1/2 -translate-x-1/2 border-t-0 border-l-0',
    side === 'bottom' && 'top-[-7px] left-1/2 -translate-x-1/2 border-b-0 border-r-0',
    side === 'left' && 'right-[-7px] top-1/2 -translate-y-1/2 border-l-0 border-b-0',
    side === 'right' && 'left-[-7px] top-1/2 -translate-y-1/2 border-r-0 border-t-0',
  );

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        className="relative"
      >
        {/* Subtle highlight ring when wizard is on */}
        <div className="absolute inset-0 rounded-xl ring-1 ring-primary/25 pointer-events-none z-10" />
        {children}
      </div>

      {show &&
        createPortal(
          <div
            ref={tooltipRef}
            style={{ top: coords.top, left: coords.left }}
            className="fixed z-[9999] max-w-[280px] px-4 py-3 rounded-lg text-sm leading-relaxed border border-muted-foreground/30 animate-fade-in"
            // Using inline style for the gradient bg to match app's card-elevated token
            // while keeping the dark theme look with soft shadow
            style={{
              top: coords.top,
              left: coords.left,
              background: 'hsl(222 47% 12%)',
              boxShadow: '0 8px 32px -8px hsl(222 47% 3% / 0.8), 0 0 0 1px hsl(217 33% 17% / 0.5)',
              color: 'hsl(210 40% 96%)',
            }}
          >
            <span className={arrowClass} />
            {text}
          </div>,
          document.body
        )}
    </>
  );
}
