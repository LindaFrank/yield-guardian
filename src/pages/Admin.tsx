import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { AdminAnalytics } from '@/components/AdminAnalytics';
import { DemoFeedbackList } from '@/components/DemoFeedbackList';

import { ArrowLeft, Loader2, UserPlus, KeyRound, ShieldCheck, Ticket, Copy, Ban, Plus } from 'lucide-react';

type AdminUser = { id: string; email?: string; created_at: string; last_sign_in_at: string | null; roles: string[] };
type InviteCode = { id: string; code: string; max_uses: number; uses: number; expires_at: string | null; revoked: boolean; created_at: string };

export default function Admin() {
  const { isAdmin, isLoading } = useIsAdmin();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);

  // Invite code state
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [codesLoading, setCodesLoading] = useState(false);
  const [inviteRequired, setInviteRequired] = useState(false);
  const [togglingSetting, setTogglingSetting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [newMaxUses, setNewMaxUses] = useState(1);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('admin-users', { body: { action: 'list_users' } });
    setLoading(false);
    if (error) { toast({ title: 'Load failed', description: error.message, variant: 'destructive' }); return; }
    setUsers(data.users ?? []);
  };

  const loadCodes = async () => {
    setCodesLoading(true);
    const { data, error } = await supabase.functions.invoke('admin-users', { body: { action: 'list_invite_codes' } });
    setCodesLoading(false);
    if (error) { toast({ title: 'Load failed', description: error.message, variant: 'destructive' }); return; }
    setCodes(data.codes ?? []);
  };

  const loadSetting = async () => {
    const { data } = await supabase.from('app_settings').select('require_invite_code').eq('id', 1).maybeSingle();
    setInviteRequired(!!data?.require_invite_code);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/auth', { replace: true }); return; }
    if (isLoading) return;
    if (!isAdmin) { navigate('/', { replace: true }); return; }
    load();
    loadCodes();
    loadSetting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isLoading, authLoading, user]);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;
    setCreating(true);
    const { error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'create_user', email: newEmail, password: newPassword, display_name: newName || undefined },
    });
    setCreating(false);
    if (error) { toast({ title: 'Could not create user', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Account created', description: newEmail });
    setNewEmail(''); setNewName(''); setNewPassword('');
    load();
  };

  const sendReset = async (email?: string) => {
    if (!email) return;
    const { error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'send_reset', email, redirect_to: `${window.location.origin}/reset-password` },
    });
    if (error) { toast({ title: 'Reset failed', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Password reset sent', description: email });
  };

  const toggleAdmin = async (u: AdminUser) => {
    const grant = !u.roles.includes('admin');
    const { error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'set_role', user_id: u.id, role: 'admin', grant },
    });
    if (error) { toast({ title: 'Role update failed', description: error.message, variant: 'destructive' }); return; }
    load();
  };

  const toggleRequireInvite = async (value: boolean) => {
    setTogglingSetting(true);
    const { error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'set_require_invite_code', value },
    });
    setTogglingSetting(false);
    if (error) { toast({ title: 'Update failed', description: error.message, variant: 'destructive' }); return; }
    setInviteRequired(value);
    toast({ title: value ? 'Invite codes required' : 'Sign-up is now open', description: value ? 'New users must provide a valid code.' : 'Anyone with the URL can sign up.' });
  };

  const generateCode = async () => {
    setGenerating(true);
    const { error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'generate_invite_code', max_uses: newMaxUses },
    });
    setGenerating(false);
    if (error) { toast({ title: 'Could not generate code', description: error.message, variant: 'destructive' }); return; }
    loadCodes();
  };

  const revokeCode = async (id: string) => {
    const { error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'revoke_invite_code', id },
    });
    if (error) { toast({ title: 'Revoke failed', description: error.message, variant: 'destructive' }); return; }
    loadCodes();
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: 'Copied', description: code });
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  const statusLabel = (c: InviteCode) => {
    if (c.revoked) return 'Revoked';
    if (c.expires_at && new Date(c.expires_at) < new Date()) return 'Expired';
    if (c.uses >= c.max_uses) return 'Used up';
    return 'Active';
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <Button variant="outline" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to dashboard
        </Button>
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">Admin Console</h1>
        </div>
        <AdminAnalytics />

        <DemoFeedbackList />



        {/* Beta gate toggle */}
        <section className="gradient-card border border-border/50 rounded-xl p-6 mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2"><Ticket className="w-5 h-5 text-primary" /> Require invite code for sign-up</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                When ON, new users must enter a valid invite code to create an account. Existing users are unaffected.
                Turn this ON before publishing to the public URL.
              </p>
            </div>
            <Switch checked={inviteRequired} disabled={togglingSetting} onCheckedChange={toggleRequireInvite} />
          </div>
        </section>

        {/* Invite codes */}
        <section className="gradient-card border border-border/50 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="text-lg font-semibold">Beta Invite Codes</h2>
            <div className="flex items-end gap-2">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Max uses</label>
                <Input type="number" min={1} max={1000} value={newMaxUses} onChange={(e) => setNewMaxUses(Math.max(1, Number(e.target.value) || 1))} className="w-24" />
              </div>
              <Button onClick={generateCode} disabled={generating}>
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" /> Generate</>}
              </Button>
            </div>
          </div>
          {codesLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : codes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No invite codes yet. Click Generate to create one.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b border-border/50">
                  <tr>
                    <th className="pb-2">Code</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Uses</th>
                    <th className="pb-2">Created</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c) => (
                    <tr key={c.id} className="border-b border-border/30">
                      <td className="py-2 font-mono">{c.code}</td>
                      <td className="py-2">
                        <span className={
                          statusLabel(c) === 'Active' ? 'text-yield-positive' : 'text-muted-foreground'
                        }>{statusLabel(c)}</span>
                      </td>
                      <td className="py-2">{c.uses} / {c.max_uses}</td>
                      <td className="py-2 text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td className="py-2">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={() => copyCode(c.code)}>
                            <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                          </Button>
                          {!c.revoked && statusLabel(c) === 'Active' && (
                            <Button size="sm" variant="outline" onClick={() => revokeCode(c.id)}>
                              <Ban className="w-3.5 h-3.5 mr-1" /> Revoke
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="gradient-card border border-border/50 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Create a new account</h2>
          </div>
          <form onSubmit={createUser} className="grid gap-3 sm:grid-cols-4">
            <Input placeholder="Display name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Input type="email" placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
            <Input type="text" placeholder="Temporary password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
            <Button type="submit" disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create account'}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">The user can change this password later via "Forgot password" on the sign-in screen.</p>
        </section>

        <section className="gradient-card border border-border/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">All users ({users.length})</h2>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b border-border/50">
                  <tr>
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Roles</th>
                    <th className="pb-2">Created</th>
                    <th className="pb-2">Last sign-in</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border/30">
                      <td className="py-2">{u.email}</td>
                      <td className="py-2">
                        {u.roles.length ? u.roles.join(', ') : <span className="text-muted-foreground">user</span>}
                      </td>
                      <td className="py-2 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="py-2 text-muted-foreground">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : '—'}</td>
                      <td className="py-2">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={() => sendReset(u.email)}>
                            <KeyRound className="w-3.5 h-3.5 mr-1" /> Reset
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toggleAdmin(u)}>
                            {u.roles.includes('admin') ? 'Revoke admin' : 'Make admin'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
