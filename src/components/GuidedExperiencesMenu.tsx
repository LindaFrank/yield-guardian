import { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, ChevronDown, TrendingUp, ShieldAlert, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export const GUIDED_EXPERIENCES = [
  {
    id: 'income-lift',
    icon: TrendingUp,
    title: 'Meet Susan and see what Yield Guardian can show her about her portfolio',
    blurb: 'Walk a sample portfolio from a 2.8% yield to 4.9% and see the dollar difference.',
  },
  {
    id: 'find-laggards',
    icon: ShieldAlert,
    title: 'Find the Laggards',
    blurb: 'Spot which holdings are dragging income down and why they are flagged.',
  },
  {
    id: 'smart-swaps',
    icon: Repeat,
    title: 'Smart Replacements',
    blurb: 'See how a single swap changes annual dividend income, share for share.',
  },
] as const;

export const GuidedExperiencesMenu = forwardRef<HTMLDivElement>((_props, ref) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  return (
    <div ref={ref} className="w-full max-w-sm">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between border-2 border-primary/40 bg-primary/5 hover:bg-primary/10"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-primary" />
          Guided Experiences
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2">
              {GUIDED_EXPERIENCES.map(({ id, icon: Icon, title, blurb }, i) => (
                <motion.button
                  key={id}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  onClick={() =>
                    toast({
                      title,
                      description: 'This guided experience is coming next — static demo portfolio, view only.',
                    })
                  }
                  className="w-full text-left p-3 rounded-lg gradient-card border-2 border-border/60 hover:border-primary/60 transition-colors"
                >
                  <span className="flex items-start gap-2 text-sm font-medium">
                    <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="leading-snug">{title}</span>
                  </span>
                  <span className="block text-[11px] text-muted-foreground mt-1 leading-snug">{blurb}</span>
                </motion.button>
              ))}
              <p className="text-[10px] text-muted-foreground text-center pt-1">
                Demo portfolios are view only — no sign-in required.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

GuidedExperiencesMenu.displayName = 'GuidedExperiencesMenu';
