import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Target, AlertTriangle, RefreshCw, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Track Your Portfolio',
    description: 'Add dividend stocks and monitor real-time prices, yields, and annual income at a glance.',
  },
  {
    icon: Target,
    title: 'Set a Yield Target',
    description: 'Use the slider to define your minimum acceptable yield — stocks below it get flagged instantly.',
  },
  {
    icon: AlertTriangle,
    title: 'Spot Underperformers',
    description: 'The sidebar highlights stocks that fall short of your target so you can act quickly.',
  },
  {
    icon: RefreshCw,
    title: 'Get Replacement Ideas',
    description: 'Select an underperformer to see higher-yield alternatives you can swap in.',
  },
  {
    icon: HelpCircle,
    title: 'Help Wizard',
    description: 'Toggle the help icon in the header anytime for contextual tooltips on every section.',
  },
];

const STORAGE_KEY = 'yield-tracker-getting-started-dismissed';

export function GettingStartedModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4">
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Welcome to Dividend Tracker
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Here's a quick look at what you can do.
              </p>
            </div>

            {/* Feature list */}
            <div className="px-6 pb-2 space-y-3 max-h-[45vh] overflow-y-auto">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  className="flex items-start gap-3 rounded-lg p-3 bg-muted/40"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                >
                  <div className="mt-0.5 p-1.5 rounded-md bg-primary/10 shrink-0">
                    <f.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{f.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex justify-end">
              <Button onClick={handleDismiss} size="sm">
                Get Started
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
