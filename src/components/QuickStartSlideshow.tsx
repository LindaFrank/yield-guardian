import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageAsset {
  url: string;
}

interface QuickStartSlideshowProps {
  pages: PageAsset[];
  title?: string;
  intervalMs?: number;
  className?: string;
}

export function QuickStartSlideshow({
  pages,
  title = 'Quick Start Guide',
  intervalMs = 6000,
  className,
}: QuickStartSlideshowProps) {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [fading, setFading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (index: number) => {
      const nextIndex = Math.max(0, Math.min(pages.length - 1, index));
      if (nextIndex === current) return;
      setFading(true);
      setTimeout(() => {
        setCurrent(nextIndex);
        setFading(false);
      }, 200);
    },
    [current, pages.length]
  );

  const next = useCallback(() => {
    goTo((current + 1) % pages.length);
  }, [current, goTo, pages.length]);

  const prev = useCallback(() => {
    goTo((current - 1 + pages.length) % pages.length);
  }, [current, goTo, pages.length]);

  useEffect(() => {
    if (!playing || hovered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % pages.length);
        setFading(false);
      }, 200);
    }, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, hovered, intervalMs]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === ' ') {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [next, prev]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) setPlaying(false);
      },
      { threshold: 0.1 }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  if (pages.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={cn('flex flex-col h-full outline-none', className)}
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex-1 min-h-0 p-4 flex items-center justify-center overflow-hidden">
        <div className="h-full max-w-full aspect-[8.5/11] relative">
          <img
            src={pages[current].url}
            alt={`${title}, page ${current + 1} of ${pages.length}`}
            loading="eager"
            className={cn(
              'absolute inset-0 w-full h-full object-contain rounded-md border border-border/60 shadow-sm bg-card',
              'transition-opacity duration-200 ease-in-out',
              fading ? 'opacity-0' : 'opacity-100'
            )}
          />
        </div>
      </div>

      <div className="shrink-0 border-t border-border/60 px-4 py-3 bg-background flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}
            className="shrink-0"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <span className="text-sm text-muted-foreground min-w-[4rem]">
            {current + 1} / {pages.length}
          </span>
        </div>

        <div className="flex items-center justify-center gap-2 flex-1">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                i === current ? 'bg-primary' : 'bg-muted-foreground/30 hover:bg-muted-foreground/60'
              )}
              aria-label={`Go to page ${i + 1}`}
              aria-current={i === current ? 'true' : undefined}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={prev}
            aria-label="Previous page"
            className="shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={next}
            aria-label="Next page"
            className="shrink-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
