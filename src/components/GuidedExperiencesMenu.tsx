import { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, ChevronDown, TrendingUp, ShieldAlert, Repeat, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const GUIDED_EXPERIENCES = [
  {
    id: 'income-lift',
    icon: TrendingUp,
    title: 'Meet Susan and see what Yield Guardian can show her about her portfolio',
    blurb: 'Walk a sample portfolio from a 2.8% yield to 4.9% and see the dollar difference.',
    // Paste the Loom video ID here (the part after /share/ in the Loom URL)
    loomId: '',
  },
  {
    id: 'find-laggards',
    icon: ShieldAlert,
    title: 'Find the Laggards',
    blurb: 'Spot which holdings are dragging income down and why they are flagged.',
    loomId: '',
  },
  {
    id: 'smart-swaps',
    icon: Repeat,
    title: 'Smart Replacements',
    blurb: 'See how a single swap changes annual dividend income, share for share.',
    loomId: '',
  },
] as const;

type Experience = (typeof GUIDED_EXPERIENCES)[number];

export const GuidedExperiencesMenu = forwardRef<HTMLDivElement>((_props, ref) => {
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState<Experience | null>(null);

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
              {GUIDED_EXPERIENCES.map((exp, i) => {
                const Icon = exp.icon;
                return (
                  <motion.button
                    key={exp.id}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    onClick={() => setActive(exp)}
                    className="w-full text-left p-3 rounded-lg gradient-card border-2 border-border/60 hover:border-primary/60 transition-colors"
                  >
                    <span className="flex items-start gap-2 text-sm font-medium">
                      <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="leading-snug">{exp.title}</span>
                    </span>
                    <span className="block text-[11px] text-muted-foreground mt-1 leading-snug">{exp.blurb}</span>
                  </motion.button>
                );
              })}
              <p className="text-[10px] text-muted-foreground text-center pt-1">
                Short guided videos — no sign-in required.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-base leading-snug pr-6">{active?.title}</DialogTitle>
          </DialogHeader>
          {active?.loomId ? (
            <div className="relative w-full rounded-lg overflow-hidden border-2 border-border/60" style={{ paddingBottom: '56.25%' }}>
              <iframe
                title={active.title}
                src={`https://www.loom.com/embed/${active.loomId}?hideEmbedTopBar=true`}
                allowFullScreen
                className="absolute inset-0 w-full h-full"
                allow="fullscreen; picture-in-picture"
              />
            </div>
          ) : (
            <div className="w-full aspect-video rounded-lg border-2 border-dashed border-border/60 flex flex-col items-center justify-center gap-2 text-center px-6">
              <Video className="w-8 h-8 text-primary" />
              <p className="text-sm font-medium">Video coming soon</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Record this walkthrough in Loom, then drop the video ID into this experience to play it right here.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
});

GuidedExperiencesMenu.displayName = 'GuidedExperiencesMenu';
