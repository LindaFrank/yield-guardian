import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { ArrowLeft, Loader2, UserPlus, KeyRound, ShieldCheck } from 'lucide-react';

type AdminUser = { id: string; email?: string; created_at: string; last_sign_in_at: string | null; roles: string[] };

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

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('admin-users', { body: { action: 'list_users' } });
    setLoading(false);
    if (error) { toast({ title: 'Load failed', description: error.message, variant: 'destructive' }); return; }
    setUsers(data.users ?? []);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/auth', { replace: true }); return; }
    if (isLoading) return;
    if (!isAdmin) { navigate('/', { replace: true }); return; }
    load();
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

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </button>
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">Admin Console</h1>
        </div>

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
