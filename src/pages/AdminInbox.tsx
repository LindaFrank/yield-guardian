import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { ArrowLeft, Loader2, Inbox, Mail, UserPlus, RefreshCw } from 'lucide-react';

type ContactRow = { id: string; name: string; email: string; message: string; created_at: string };
type SignupRow = { id: string; email?: string; created_at: string; last_sign_in_at: string | null; roles: string[] };

type Item =
  | { kind: 'message'; id: string; at: string; name: string; email: string; message: string }
  | { kind: 'signup'; id: string; at: string; email: string; lastSignIn: string | null; roles: string[] };

type Filter = 'all' | 'messages' | 'signups';

export default function AdminInbox() {
  const { isAdmin, isLoading } = useIsAdmin();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<ContactRow[]>([]);
  const [signups, setSignups] = useState<SignupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    const [msgRes, userRes] = await Promise.all([
      supabase
        .from('contact_messages')
        .select('id, name, email, message, created_at')
        .order('created_at', { ascending: false })
        .limit(500),
      supabase.functions.invoke('admin-users', { body: { action: 'list_users' } }),
    ]);
    setLoading(false);
    if (msgRes.error) setError(msgRes.error.message);
    setMessages(msgRes.data ?? []);
    if (!userRes.error) setSignups((userRes.data?.users ?? []) as SignupRow[]);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/auth', { replace: true }); return; }
    if (isLoading) return;
    if (!isAdmin) { navigate('/', { replace: true }); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isLoading, authLoading, user]);

  const items: Item[] = useMemo(() => {
    const list: Item[] = [];
    if (filter !== 'signups') {
      messages.forEach((m) =>
        list.push({ kind: 'message', id: m.id, at: m.created_at, name: m.name, email: m.email, message: m.message }),
      );
    }
    if (filter !== 'messages') {
      signups.forEach((s) =>
        list.push({ kind: 'signup', id: s.id, at: s.created_at, email: s.email ?? '—', lastSignIn: s.last_sign_in_at, roles: s.roles ?? [] }),
      );
    }
    const q = search.trim().toLowerCase();
    return list
      .filter((i) => {
        if (!q) return true;
        if (i.kind === 'message') return `${i.name} ${i.email} ${i.message}`.toLowerCase().includes(q);
        return i.email.toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [messages, signups, filter, search]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <Button variant="outline" onClick={() => navigate('/admin')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Admin Console
        </Button>

        <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
          <div className="flex items-center gap-2">
            <Inbox className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-semibold">Inbox</h1>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4 mr-2" /> Refresh</>}
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-4">
          {(['all', 'messages', 'signups'] as Filter[]).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>
              {f === 'all' ? `All (${messages.length + signups.length})` : f === 'messages' ? `Messages (${messages.length})` : `Sign-ups (${signups.length})`}
            </Button>
          ))}
          <Input
            placeholder="Search name, email or message…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-72 w-full"
          />
        </div>

        {error && <p className="text-sm text-yield-negative mb-4">Could not load messages: {error}</p>}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">Nothing here yet.</p>
        ) : (
          <div className="space-y-3">
            {items.map((i) => (
              <article key={`${i.kind}-${i.id}`} className="gradient-card border border-border/50 rounded-xl p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    {i.kind === 'message'
                      ? <Mail className="w-4 h-4 text-primary" />
                      : <UserPlus className="w-4 h-4 text-yield-positive" />}
                    <span className="font-semibold">
                      {i.kind === 'message' ? (i.name?.trim() || 'Anonymous') : 'New sign-up'}
                    </span>
                    <span className="text-xs text-muted-foreground">{i.email}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(i.at).toLocaleString()}</span>
                </div>

                {i.kind === 'message' ? (
                  <>
                    <p className="text-sm mt-3 whitespace-pre-wrap">{i.message}</p>
                    <a
                      href={`mailto:${i.email}?subject=Re: your message to Yield Guardian`}
                      className="inline-block mt-3 text-sm text-primary underline"
                    >
                      Reply by email
                    </a>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground mt-3">
                    Joined {new Date(i.at).toLocaleDateString()} ·{' '}
                    {i.lastSignIn ? `last signed in ${new Date(i.lastSignIn).toLocaleDateString()}` : 'has not signed in yet'}
                    {i.roles.length ? ` · ${i.roles.join(', ')}` : ''}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
