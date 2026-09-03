import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MousePointerClick, Loader2, Compass, Route, FileText } from 'lucide-react';

interface EventRow { event: string; category: string | null; clicks: number; guest_clicks: number }
interface NamedCount { clicks: number; choice?: string; mode?: string; category?: string }

interface Metrics {
  window_days: number;
  total_events: number;
  guest_events: number;
  top_events: EventRow[];
  by_category: NamedCount[];
  entry_choices: NamedCount[];
  strategy_choices: NamedCount[];
  generated_at: string;
}

const WINDOWS = [7, 30, 90];

function Bars({ rows, nameOf }: { rows: NamedCount[]; nameOf: (r: NamedCount) => string }) {
  const max = Math.max(1, ...rows.map((r) => Number(r.clicks)));
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No clicks recorded yet.</p>;
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={nameOf(r)}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{nameOf(r)}</span>
            <span className="font-mono text-primary shrink-0">{r.clicks}</span>
          </div>
          <div className="h-2 rounded bg-secondary/40 overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${(Number(r.clicks) / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ClickAnalytics() {
  const [days, setDays] = useState(30);
  const [m, setM] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_ui_event_metrics', { _days: days });
      if (cancelled) return;
      setLoading(false);
      if (error) { setErr(error.message); return; }
      setErr(null);
      setM(data as unknown as Metrics);
    })();
    return () => { cancelled = true; };
  }, [days]);

  return (
    <section className="gradient-card border border-border/50 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <MousePointerClick className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Click Tracking</h2>
        </div>
        <div className="flex gap-1 p-1 rounded-md bg-secondary/40">
          {WINDOWS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`text-xs font-medium py-1 px-3 rounded transition-colors ${days === d ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : err || !m ? (
        <p className="text-sm text-destructive">Couldn't load click tracking: {err ?? 'unknown error'}</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-5">
            {m.total_events} clicks tracked in the last {m.window_days} days — {m.guest_events} from visitors without an account.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                <Compass className="w-4 h-4" /> Entry choice
              </div>
              <Bars rows={m.entry_choices} nameOf={(r) => r.choice ?? '—'} />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                <Route className="w-4 h-4" /> Aggressive vs. Conservative
              </div>
              <Bars rows={m.strategy_choices} nameOf={(r) => (r.mode ?? '—').replace(/^./, (c) => c.toUpperCase())} />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                <FileText className="w-4 h-4" /> Areas by section
              </div>
              <Bars rows={m.by_category} nameOf={(r) => r.category ?? '—'} />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                <MousePointerClick className="w-4 h-4" /> Most clicked actions
              </div>
              <div className="space-y-1.5">
                {m.top_events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No clicks recorded yet.</p>
                ) : m.top_events.map((r) => (
                  <div key={`${r.event}-${r.category}`} className="flex items-baseline justify-between gap-3 text-sm border-b border-border/30 pb-1">
                    <span className="truncate">{r.event.replace(/_/g, ' ')}</span>
                    <span className="font-mono text-primary shrink-0">{r.clicks} <span className="text-muted-foreground">({r.guest_clicks} guest)</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-5">Generated {new Date(m.generated_at).toLocaleString()}</p>
        </>
      )}
    </section>
  );
}
