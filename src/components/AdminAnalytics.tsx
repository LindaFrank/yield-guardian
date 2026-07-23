import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, Users, Briefcase, TrendingUp, Repeat, Loader2 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface Metrics {
  logins: { dau: number; wau: number; mau: number; logins_30d: number; returning_30d: number; by_day: { day: string; logins: number; users: number }[] };
  portfolios: { total: number; total_positions: number; avg_companies: number; median_companies: number; max_companies: number; new_30d: number };
  improvement: { avg_yield_lift_pct: number; avg_income_lift: number; users_measured: number };
  replacements: { total: number; avg_income_delta: number; avg_yield_delta: number; total_income_delta: number };
  generated_at: string;
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/40 p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

const fmtMoney = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function AdminAnalytics() {
  const [m, setM] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_admin_metrics');
      setLoading(false);
      if (error) { setErr(error.message); return; }
      setM(data as unknown as Metrics);
    })();
  }, []);

  if (loading) return (
    <section className="gradient-card border border-border/50 rounded-xl p-6 mb-8">
      <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
    </section>
  );
  if (err || !m) return (
    <section className="gradient-card border border-border/50 rounded-xl p-6 mb-8">
      <p className="text-sm text-destructive">Couldn't load analytics: {err ?? 'unknown error'}</p>
    </section>
  );

  return (
    <section className="gradient-card border border-border/50 rounded-xl p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Product Analytics</h2>
      </div>

      {/* Logins */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          <Users className="w-4 h-4" /> Logins &amp; Retention
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="DAU" value={m.logins.dau} hint="active last 24h" />
          <Stat label="WAU" value={m.logins.wau} hint="active last 7d" />
          <Stat label="MAU" value={m.logins.mau} hint="active last 30d" />
          <Stat label="Returning (30d)" value={m.logins.returning_30d} hint="≥2 days signed in" />
          <Stat label="Logins (30d)" value={m.logins.logins_30d} />
        </div>
        {m.logins.by_day.length > 0 && (
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={m.logins.by_day}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Unique users" />
                <Line type="monotone" dataKey="logins" stroke="hsl(var(--yield-positive))" strokeWidth={2} dot={false} name="Logins" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Portfolios */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          <Briefcase className="w-4 h-4" /> Portfolios
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Total portfolios" value={m.portfolios.total} />
          <Stat label="New (30d)" value={m.portfolios.new_30d} />
          <Stat label="Avg companies" value={m.portfolios.avg_companies} hint="per portfolio" />
          <Stat label="Median companies" value={m.portfolios.median_companies} />
          <Stat label="Total positions" value={m.portfolios.total_positions} />
        </div>
      </div>

      {/* Improvement */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          <TrendingUp className="w-4 h-4" /> Portfolio Improvement (pricing signal)
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Stat
            label="Avg yield lift"
            value={`${m.improvement.avg_yield_lift_pct >= 0 ? '+' : ''}${m.improvement.avg_yield_lift_pct.toFixed(3)}%`}
            hint="first vs. latest snapshot"
          />
          <Stat
            label="Avg income lift"
            value={`${m.improvement.avg_income_lift >= 0 ? '+' : ''}${fmtMoney(m.improvement.avg_income_lift)}/yr`}
          />
          <Stat label="Users measured" value={m.improvement.users_measured} hint="have ≥2 snapshots" />
        </div>
      </div>

      {/* Replacements */}
      <div>
        <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          <Repeat className="w-4 h-4" /> Replacements Applied
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Total swaps" value={m.replacements.total} />
          <Stat
            label="Avg income Δ"
            value={`${m.replacements.avg_income_delta >= 0 ? '+' : ''}${fmtMoney(m.replacements.avg_income_delta)}/yr`}
            hint="per swap"
          />
          <Stat
            label="Avg yield Δ"
            value={`${m.replacements.avg_yield_delta >= 0 ? '+' : ''}${m.replacements.avg_yield_delta.toFixed(3)}%`}
          />
          <Stat
            label="Total income Δ"
            value={`${m.replacements.total_income_delta >= 0 ? '+' : ''}${fmtMoney(m.replacements.total_income_delta)}/yr`}
            hint="all users combined"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Generated {new Date(m.generated_at).toLocaleString()}
      </p>
    </section>
  );
}
