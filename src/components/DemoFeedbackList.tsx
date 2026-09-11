import { useQuery } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function DemoFeedbackList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['demo-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demo_feedback')
        .select('id, name, email, comment, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="gradient-card border border-border/50 rounded-xl p-6 mb-8">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" /> Free demo feedback
      </h2>
      <p className="text-sm text-muted-foreground mt-1">
        Comments submitted from the guest "Analyze a portfolio — no account needed" experience. Kept separate from
        subscriber messages.
      </p>

      <div className="mt-4 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading feedback…</p>}
        {error && <p className="text-sm text-yield-negative">Could not load feedback.</p>}
        {data && data.length === 0 && <p className="text-sm text-muted-foreground">No demo feedback yet.</p>}
        {data?.map((row) => (
          <div key={row.id} className="border border-border/50 rounded-lg p-4 bg-background/40">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {row.name?.trim() || 'Anonymous'}
                {row.email ? ` · ${row.email}` : ''}
              </span>
              <span>{new Date(row.created_at).toLocaleString()}</span>
            </div>
            <p className="text-sm mt-2 whitespace-pre-wrap">{row.comment}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
