import { forwardRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, LogIn, Shield, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/analytics';
import { FREE_TRIAL_DAYS, isNoCardPeriod } from '@/lib/freeTrial';

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Current Yield Analysis',
    text: "See what every stock you own pays today, based on its latest price — not what it paid when you bought it.",
  },
  {
    icon: Shield,
    title: 'Underperformer Detection',
    text: 'Set the yield you want. Yield Guardian flags the holdings falling short and checks each dividend for stability.',
  },
  {
    icon: Zap,
    title: 'Smart Alternatives',
    text: 'Compare higher-yield stocks with steady dividends, the exact shares to buy, and the income you could gain.',
  },
];

const Landing = forwardRef<HTMLDivElement>((_props, ref) => {
  const navigate = useNavigate();
  const noCard = isNoCardPeriod();

  const start = () => {
    trackEvent('start_free_month_click', { category: 'entry', label: 'Front page — Start your free month' });
    navigate('/try');
  };

  return (
    <div ref={ref} className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--muted-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--muted-foreground)) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.45) 0%, transparent 70%)' }}
        />
      </div>

      <header className="relative z-10 container mx-auto px-6 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            <span className="text-foreground">Yield</span> <span className="text-primary">Guardian</span>
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-2 border-muted-foreground/50"
          onClick={() => {
            trackEvent('sign_in_click', { category: 'entry', label: 'Front page — Sign in' });
            navigate('/auth');
          }}
        >
          <LogIn className="w-4 h-4" />
          Sign in
        </Button>
      </header>

      <main className="relative z-10 container mx-auto px-6">
        <section className="max-w-3xl mx-auto text-center pt-16 sm:pt-24 pb-14">
          <motion.p
            className="text-xs sm:text-sm tracking-[0.25em] uppercase font-medium text-primary mb-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Portfolio Yield Intelligence
          </motion.p>
          <motion.h1
            className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05] text-foreground"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Find out what your dividend stocks <span className="text-primary">really pay.</span>
          </motion.h1>
          <motion.p
            className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            Yield Guardian checks the current yield on every stock in your portfolio, flags the ones falling short of
            your target, and shows steadier, higher-yield alternatives.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col items-center gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button
              size="lg"
              className="h-16 px-10 text-xl font-semibold gap-3 shadow-glow border-[3px] border-primary"
              onClick={start}
            >
              Start your free month
              <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-sm text-muted-foreground">
              No account needed to start — sign up only when you want to save your portfolio.
            </p>
            <p className="text-sm font-medium text-foreground/90">
              {noCard
                ? 'No card needed for trials started before February 1.'
                : `Card required to start · first charge after ${FREE_TRIAL_DAYS} days · $29.95/month · cancel anytime`}
            </p>
          </motion.div>
        </section>

        <section className="max-w-5xl mx-auto grid gap-4 sm:grid-cols-3 pb-16">
          {FEATURES.map(({ icon: Icon, title, text }, i) => (
            <motion.div
              key={title}
              className="rounded-xl border-[3px] border-border/60 bg-card/70 backdrop-blur-sm p-5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 + i * 0.1 }}
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-semibold text-foreground mb-1.5">{title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </motion.div>
          ))}
        </section>

        <nav className="pb-6 flex justify-center gap-5 text-xs text-muted-foreground">
          <Link to="/terms" className="hover:text-primary">Terms &amp; Conditions</Link>
          <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
          <Link to="/contact" className="hover:text-primary">Contact</Link>
        </nav>
      </main>
    </div>
  );
});
Landing.displayName = 'Landing';

export default Landing;
