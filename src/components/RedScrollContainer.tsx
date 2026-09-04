import { useRef, useState, useEffect, useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface RedScrollContainerProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}

export function RedScrollContainer({ children, className, innerClassName }: RedScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [thumbHeight, setThumbHeight] = useState(0);
  const [thumbTop, setThumbTop] = useState(0);
  const [scrollRatio, setScrollRatio] = useState(0);
  const dragState = useRef<{ dragging: boolean; startY: number; startTop: number }>({
    dragging: false,
    startY: 0,
    startTop: 0,
  });

  const updateThumb = useCallback(() => {
    const content = contentRef.current;
    const container = containerRef.current;
    if (!content || !container) return;
    const trackHeight = container.clientHeight;
    const contentHeight = content.scrollHeight;
    const scrollTop = content.scrollTop;

    if (contentHeight <= trackHeight) {
      setThumbHeight(0);
      setThumbTop(0);
      setScrollRatio(0);
      return;
    }

    const ratio = trackHeight / contentHeight;
    const thumbH = Math.max(40, Math.round(trackHeight * ratio));
    const maxThumbTop = trackHeight - thumbH;
    const maxScroll = contentHeight - trackHeight;
    const top = maxScroll > 0 ? (scrollTop / maxScroll) * maxThumbTop : 0;

    setThumbHeight(thumbH);
    setThumbTop(top);
    setScrollRatio(ratio);
  }, []);

  useEffect(() => {
    updateThumb();
    const content = contentRef.current;
    if (!content) return;

    const observer = new ResizeObserver(updateThumb);
    observer.observe(content);
    content.addEventListener('scroll', updateThumb, { passive: true });
    window.addEventListener('resize', updateThumb);

    return () => {
      observer.disconnect();
      content.removeEventListener('scroll', updateThumb);
      window.removeEventListener('resize', updateThumb);
    };
  }, [updateThumb]);

  const handleThumbMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragState.current = { dragging: true, startY: e.clientY, startTop: thumbTop };
    document.body.style.userSelect = 'none';
  }, [thumbTop]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragState.current = { dragging: true, startY: touch.clientY, startTop: thumbTop };
    document.body.style.userSelect = 'none';
  }, [thumbTop]);

  useEffect(() => {
    const handleMove = (clientY: number) => {
      if (!dragState.current.dragging || !contentRef.current || !containerRef.current) return;
      const delta = clientY - dragState.current.startY;
      const trackHeight = containerRef.current.clientHeight;
      const thumbH = thumbHeight || 40;
      const maxThumbTop = trackHeight - thumbH;
      const newTop = Math.min(Math.max(0, dragState.current.startTop + delta), maxThumbTop);
      const maxScroll = contentRef.current.scrollHeight - trackHeight;
      contentRef.current.scrollTop = maxThumbTop > 0 ? (newTop / maxThumbTop) * maxScroll : 0;
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientY);
    };
    const onEnd = () => {
      dragState.current.dragging = false;
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, [thumbHeight]);

  const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!contentRef.current || !containerRef.current || !thumbRef.current) return;
    const trackRect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - trackRect.top;
    const thumbH = thumbHeight || 40;
    const trackHeight = containerRef.current.clientHeight;
    const maxThumbTop = trackHeight - thumbH;
    const newTop = Math.min(Math.max(0, clickY - thumbH / 2), maxThumbTop);
    const maxScroll = contentRef.current.scrollHeight - trackHeight;
    contentRef.current.scrollTop = maxThumbTop > 0 ? (newTop / maxThumbTop) * maxScroll : 0;
  }, [thumbHeight]);

  const showScrollbar = scrollRatio > 0 && scrollRatio < 1;

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden', className)}>
      <div
        ref={contentRef}
        className={cn(
          'h-full w-full overflow-y-scroll overflow-x-hidden pr-0',
          // Hide native scrollbar across browsers while keeping scroll functionality
          '[scrollbar-width:none]',
          '[&::-webkit-scrollbar]:hidden',
          innerClassName,
        )}
      >
        {children}
      </div>
      {showScrollbar && (
        <div
          className="absolute top-0 right-1 bottom-0 w-3 rounded-full bg-muted/30 cursor-pointer"
          onClick={handleTrackClick}
          aria-hidden="true"
        >
          <div
            ref={thumbRef}
            className="absolute left-0.5 right-0.5 rounded-full bg-[hsl(var(--yield-negative))] hover:bg-[hsl(var(--yield-negative)/0.8)] transition-colors"
            style={{ height: thumbHeight, top: thumbTop }}
            onMouseDown={handleThumbMouseDown}
            onTouchStart={handleTouchStart}
          />
        </div>
      )}
    </div>
  );
}
