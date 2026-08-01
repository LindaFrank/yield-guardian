import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { TrendingUp, ArrowRight, Loader2, BarChart3, Shield, Zap, Mail, Apple, LogIn, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useInviteCodeRequired } from '@/hooks/useInviteCodeRequired';
import { GuidedExperiencesMenu } from '@/components/GuidedExperiencesMenu';


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

type Mode = 'signin' | 'signup' | 'forgot';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const adminKey = searchParams.get('key');
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { required: inviteRequired } = useInviteCodeRequired();
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
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('admin-login', { body: { key: adminKey } });
        if (error || !data?.access_token) { setAutoLogging(false); return; }
        await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
      } catch { setAutoLogging(false); }
    })();
  }, [adminKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' });
      } else if (mode === 'signup') {
        if (password.length < 8) { toast({ title: 'Password too short', description: 'Use at least 8 characters.', variant: 'destructive' }); setLoading(false); return; }
        if (inviteRequired) {
          if (!inviteCode.trim()) {
            toast({ title: 'Invite code required', description: 'Enter the invite code you were sent.', variant: 'destructive' });
            setLoading(false); return;
          }
          const { data: v, error: vErr } = await supabase.functions.invoke('validate-invite-code', { body: { code: inviteCode.trim() } });
          if (vErr || !v?.valid) {
            toast({ title: 'Invalid invite code', description: 'That code is not valid, expired, or already used.', variant: 'destructive' });
            setLoading(false); return;
          }
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { display_name: name.trim() } },
        });
        if (error) { toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' }); }
        else if (data.user && name.trim()) {
          await supabase.from('profiles').update({ display_name: name.trim() }).eq('user_id', data.user.id);
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) toast({ title: 'Could not send email', description: error.message, variant: 'destructive' });
        else toast({ title: 'Check your inbox', description: 'A password reset link is on its way.' });
        setMode('signin');
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' });
    }
    setLoading(false);
  };

  const oauth = async (provider: 'google' | 'apple') => {
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (result.error) toast({ title: 'Sign in failed', description: (result.error as Error).message ?? String(result.error), variant: 'destructive' });
  };

  if (autoLogging) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const title = mode === 'signup' ? 'Create your account' : mode === 'forgot' ? 'Reset your password' : 'Sign in';
  const cta = mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Sign in';

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0">
        <motion.div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `linear-gradient(hsl(var(--muted-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--muted-foreground)) 1px, transparent 1px)`, backgroundSize: '60px 60px' }}
          animate={{ backgroundPosition: ['0px 0px', '60px 60px'] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} />
        <motion.div className="absolute w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)' }}
          animate={{ x: ['-10%', '5%', '-10%'], y: ['-20%', '-10%', '-20%'] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute bottom-0 right-0 w-[700px] h-[700px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.25) 0%, transparent 70%)' }}
          animate={{ x: ['10%', '-5%', '10%'], y: ['20%', '5%', '20%'] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-10">
        <motion.div className="flex flex-col items-center" animate={{ marginBottom: showForm ? 24 : 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
          <motion.div className="relative mb-6" initial={{ scale: 0, rotate: -180 }} animate={{ scale: showForm ? 0.8 : 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
            <motion.div className="absolute -inset-4 rounded-3xl opacity-50"
              style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)' }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
            <div className="relative p-4 rounded-2xl bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <TrendingUp className="w-12 h-12 text-primary" />
            </div>
          </motion.div>

          <motion.h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}>
            <span className="text-foreground">Yield</span>{' '}
            <motion.span className="text-primary inline-block"
              animate={{ textShadow: ['0 0 20px hsl(var(--primary) / 0)', '0 0 20px hsl(var(--primary) / 0.5)', '0 0 20px hsl(var(--primary) / 0)'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>Guardian</motion.span>
          </motion.h1>
          <motion.p className="text-muted-foreground text-sm sm:text-base tracking-[0.25em] uppercase font-medium" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }}>
            Portfolio Yield Intelligence
          </motion.p>

          <AnimatePresence>
            {!showForm && (
              <motion.div className="flex flex-wrap justify-center gap-3 mt-6" exit={{ opacity: 0, height: 0, marginTop: 0 }} transition={{ duration: 0.4 }}>
                {[{ icon: BarChart3, label: 'Live Yield Analysis' }, { icon: Shield, label: 'Underperformer Detection' }, { icon: Zap, label: 'Smart Replacements' }].map(({ icon: Icon, label }, i) => (
                  <motion.div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 border border-border/50 text-sm text-muted-foreground backdrop-blur-sm"
                    initial={{ opacity: 0, y: 15, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.7 + i * 0.15, type: 'spring', stiffness: 300, damping: 25 }}>
                    <Icon className="w-3.5 h-3.5 text-primary" />{label}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!showForm && (
              <motion.div className="mt-8 overflow-hidden max-w-md w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} transition={{ delay: 1, duration: 0.5 }}>
                <motion.div className="flex items-center gap-6 font-mono text-xs text-muted-foreground whitespace-nowrap" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}>
                  {[...TICKER_DATA, ...TICKER_DATA].map(({ symbol, yield: y, up }, i) => (
                    <span key={`${symbol}-${i}`} className="flex items-center gap-1">
                      <span className="text-foreground/70 font-medium">{symbol}</span>
                      <span className={up ? 'text-yield-positive' : 'text-yield-warning'}>{up ? '▲' : '▼'} {y}%</span>
                    </span>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              className="w-full max-w-sm mb-4 flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              <GuidedExperiencesMenu />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>

          {showForm && (
            <motion.div className="w-full max-w-sm" initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 250, damping: 25 }}>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between border-2 border-border/60 bg-card/60 hover:bg-card"
                onClick={() => setSignInOpen((v) => !v)}
                aria-expanded={signInOpen}
              >
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4 text-primary" />
                  {title}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${signInOpen ? 'rotate-180' : ''}`} />
              </Button>

              <AnimatePresence initial={false}>
                {signInOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="relative gradient-card rounded-xl border border-border/50 shadow-elevated backdrop-blur-sm p-6 mt-2">
                      {mode !== 'forgot' && (
                        <div className="space-y-2 mb-4">
                          <Button type="button" variant="outline" className="w-full" onClick={() => oauth('google')}>
                            <Mail className="w-4 h-4 mr-2" /> Continue with Google
                          </Button>
                          <Button type="button" variant="outline" className="w-full" onClick={() => oauth('apple')}>
                            <Apple className="w-4 h-4 mr-2" /> Continue with Apple
                          </Button>
                          <div className="flex items-center gap-2 my-3">
                            <div className="h-px flex-1 bg-border/50" />
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">or</span>
                            <div className="h-px flex-1 bg-border/50" />
                          </div>
                        </div>
                      )}

                      <form onSubmit={handleSubmit} className="space-y-3">
                        {mode === 'signup' && (
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium">Your name</label>
                            <Input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="Jane Doe" />
                          </div>
                        )}
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Email</label>
                          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} placeholder="you@example.com" />
                        </div>
                        {mode !== 'forgot' && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Password</label>
                              {mode === 'signin' && (
                                <button type="button" className="text-xs text-primary hover:underline" onClick={() => setMode('forgot')}>
                                  Forgot?
                                </button>
                              )}
                            </div>
                            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder={mode === 'signup' ? 'At least 8 characters' : ''} />
                          </div>
                        )}
                        {mode === 'signup' && inviteRequired && (
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium">Invite code</label>
                            <Input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} placeholder="YG-XXXX-XXXX" required autoCapitalize="characters" />
                            <p className="text-[11px] text-muted-foreground">Enter the invite code you were sent.</p>
                          </div>
                        )}
                        <Button type="submit" className="w-full group" disabled={loading}>
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                            <>{cta}<ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" /></>
                          )}
                        </Button>
                      </form>

                      {mode !== 'signin' && (
                        <div className="text-center text-xs text-muted-foreground mt-4">
                          {mode === 'signup' && (
                            <>Already have an account?{' '}<button className="text-primary hover:underline" onClick={() => setMode('signin')}>Sign in</button></>
                          )}
                          {mode === 'forgot' && (
                            <button className="text-primary hover:underline" onClick={() => setMode('signin')}>Back to sign in</button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>




      </div>
    </div>
  );
}
