import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, ArrowRight, Loader2, BarChart3, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const APP_PASSWORD = 'dividend-tracker-auto-2024';

const TICKER_DATA = [
  { symbol: 'JNJ', yield: '3.12', up: true },
  { symbol: 'KO', yield: '2.94', up: true },
  { symbol: 'T', yield: '6.78', up: false },
  { symbol: 'XOM', yield: '3.45', up: true },
  { symbol: 'PG', yield: '2.51', up: true },
  { symbol: 'ABBV', yield: '3.89', up: true },
  { symbol: 'VZ', yield: '6.41', up: false },
  { symbol: 'PFE', yield: '5.72', up: true },
];

export default function Auth() {
  const [searchParams] = useSearchParams();
  const adminKey = searchParams.get('key');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoLogging, setAutoLogging] = useState(!!adminKey);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!adminKey) {
      const timer = setTimeout(() => setShowForm(true), 2800);
      return () => clearTimeout(timer);
    }
  }, [adminKey]);

  useEffect(() => {
    if (!adminKey) return;
    const autoLogin = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('admin-login', {
          body: { key: adminKey },
        });
        if (error || !data?.access_token) {
          setAutoLogging(false);
          return;
        }
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
      } catch {
        setAutoLogging(false);
      }
    };
    autoLogin();
  }, [adminKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: APP_PASSWORD });
      if (signInError) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password: APP_PASSWORD });
        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            const { error: resetError } = await supabase.functions.invoke('reset-password', { body: { email, password: APP_PASSWORD } });
            if (resetError) { toast({ title: 'Error', description: 'Unable to sign in.', variant: 'destructive' }); setLoading(false); return; }
            const { error: retryError } = await supabase.auth.signInWithPassword({ email, password: APP_PASSWORD });
            if (retryError) { toast({ title: 'Error', description: 'Unable to sign in.', variant: 'destructive' }); setLoading(false); return; }
          } else { toast({ title: 'Error', description: signUpError.message, variant: 'destructive' }); setLoading(false); return; }
        }
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ display_name: name.trim() }).eq('user_id', user.id);
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' });
    }
    setLoading(false);
  };

  if (autoLogging) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--muted-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--muted-foreground)) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
          animate={{ backgroundPosition: ['0px 0px', '60px 60px'] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />

        {/* Floating orbs with motion */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)' }}
          animate={{
            x: ['-10%', '5%', '-10%'],
            y: ['-20%', '-10%', '-20%'],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-[700px] h-[700px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.25) 0%, transparent 70%)' }}
          animate={{
            x: ['10%', '-5%', '10%'],
            y: ['20%', '5%', '20%'],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 60%)' }}
          animate={{
            x: ['-50%', '-40%', '-50%'],
            y: ['-50%', '-60%', '-50%'],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Horizontal scan line effect */}
      <motion.div
        className="absolute left-0 right-0 h-px opacity-10"
        style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)' }}
        animate={{ top: ['-2%', '102%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Splash content */}
        <motion.div
          className="flex flex-col items-center"
          animate={{ marginBottom: showForm ? 24 : 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Logo mark with glow */}
          <motion.div
            className="relative mb-6"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: showForm ? 0.8 : 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <motion.div
              className="absolute -inset-4 rounded-3xl opacity-50"
              style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)' }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative p-4 rounded-2xl bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <TrendingUp className="w-12 h-12 text-primary" />
            </div>
          </motion.div>

          {/* Title with staggered letter animation */}
          <motion.h1
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <span className="text-foreground">Yield</span>{' '}
            <motion.span
              className="text-primary inline-block"
              animate={{ textShadow: ['0 0 20px hsl(var(--primary) / 0)', '0 0 20px hsl(var(--primary) / 0.5)', '0 0 20px hsl(var(--primary) / 0)'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              Guardian
            </motion.span>
          </motion.h1>

          <motion.p
            className="text-muted-foreground text-sm sm:text-base tracking-[0.25em] uppercase font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Portfolio Yield Intelligence
          </motion.p>

          {/* Feature pills */}
          <AnimatePresence>
            {!showForm && (
              <motion.div
                className="flex flex-wrap justify-center gap-3 mt-6"
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.4 }}
              >
                {[
                  { icon: BarChart3, label: 'Live Yield Analysis' },
                  { icon: Shield, label: 'Underperformer Detection' },
                  { icon: Zap, label: 'Smart Replacements' },
                ].map(({ icon: Icon, label }, i) => (
                  <motion.div
                    key={label}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 border border-border/50 text-sm text-muted-foreground backdrop-blur-sm"
                    initial={{ opacity: 0, y: 15, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.7 + i * 0.15, type: 'spring', stiffness: 300, damping: 25 }}
                    whileHover={{ scale: 1.05, borderColor: 'hsl(var(--primary) / 0.4)' }}
                  >
                    <Icon className="w-3.5 h-3.5 text-primary" />
                    {label}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scrolling ticker tape */}
          <AnimatePresence>
            {!showForm && (
              <motion.div
                className="mt-8 overflow-hidden max-w-md w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <motion.div
                  className="flex items-center gap-6 font-mono text-xs text-muted-foreground whitespace-nowrap"
                  animate={{ x: ['0%', '-50%'] }}
                  transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                >
                  {[...TICKER_DATA, ...TICKER_DATA].map(({ symbol, yield: y, up }, i) => (
                    <span key={`${symbol}-${i}`} className="flex items-center gap-1">
                      <span className="text-foreground/70 font-medium">{symbol}</span>
                      <span className={up ? 'text-yield-positive' : 'text-yield-warning'}>
                        {up ? '▲' : '▼'} {y}%
                      </span>
                    </span>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Login form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              className="w-full max-w-sm"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 250, damping: 25 }}
            >
              <div className="relative">
                {/* Card glow effect */}
                <motion.div
                  className="absolute -inset-px rounded-xl opacity-50"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.2), transparent 50%, hsl(var(--primary) / 0.1))' }}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="relative gradient-card rounded-xl border border-border/50 shadow-elevated backdrop-blur-sm p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label htmlFor="name" className="text-sm font-medium">Your name</label>
                      <Input id="name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} autoFocus />
                    </motion.div>
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <label htmlFor="email" className="text-sm font-medium">Email address</label>
                      <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Button type="submit" className="w-full group" disabled={loading}>
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            Get started
                            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                    <p className="text-xs text-muted-foreground text-center">
                      No password needed — just enter your info to continue.
                    </p>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
