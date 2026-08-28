import { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, ChevronDown, TrendingUp, Rocket, Repeat, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SamplePortfolioViewer } from '@/components/SamplePortfolioViewer';

export const GUIDED_EXPERIENCES = [
  {
    id: 'income-lift',
    icon: TrendingUp,
    title: 'Meet Susan and see what Yield Guardian can show her about her portfolio',
    blurb: 'Import her portfolio and see information about performance.',
    // Paste the Loom video ID here (the part after /share/ in the Loom URL)
    loomId: '2494ecce7e354cc4b1e77a62fdbaae37',
  },
  {
    id: 'first-portfolio',
    icon: Rocket,
    title: 'Meet Michael and see how he can set up his first stocks and his portfolio',
    blurb: 'Start from zero — add tickers and shares, and watch a portfolio come together.',
    loomId: '',
  },
  {
    id: 'smart-swaps',
    icon: Repeat,
    title: 'Meet Ron and see how he can replace stocks not producing a dividend',
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
                  <div key={exp.id} className="space-y-2">
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      onClick={() => setActive(exp)}
                      className="w-full text-left p-3 rounded-lg gradient-card border-2 border-border/60 hover:border-primary/60 transition-colors"
                    >
                      <span className="flex items-start gap-2 text-base font-medium">
                        <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="leading-snug">{exp.title}</span>
                      </span>
                      <span className="block text-[13px] text-muted-foreground mt-1 leading-snug">{exp.blurb}</span>
                    </motion.button>
                    {exp.id === 'income-lift' && <SamplePortfolioViewer />}
                  </div>
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
        <DialogContent className="w-[98vw] max-w-[1800px] h-[94vh] p-0 gap-0 border-2 border-border/60 overflow-hidden flex flex-col">
          <DialogHeader className="px-4 py-2 border-b border-border/60 shrink-0">
            <DialogTitle className="text-sm leading-snug pr-8 text-left">{active?.title}</DialogTitle>
          </DialogHeader>
          {active?.loomId ? (
            <iframe
              title={active.title}
              src={`https://www.loom.com/embed/${active.loomId}?hideEmbedTopBar=true&hide_owner=true&hide_share=true&hide_title=true&autoplay=1`}
              allowFullScreen
              className="flex-1 w-full bg-black"
              allow="fullscreen; autoplay; picture-in-picture"
            />
          ) : (
            <div className="flex-1 w-full flex flex-col items-center justify-center gap-2 text-center px-6">
              <Video className="w-10 h-10 text-primary" />
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
