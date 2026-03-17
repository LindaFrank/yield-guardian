import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [stockTips, setStockTips] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setAge(profile.age?.toString() || '');
      setEmailUpdates(profile.email_updates || false);
      setStockTips(profile.stock_tips || false);
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || null,
          age: age ? parseInt(age, 10) : null,
          email_updates: emailUpdates,
          stock_tips: stockTips,
        })
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update profile.', variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (age && (isNaN(Number(age)) || Number(age) < 0 || Number(age) > 150)) {
      toast({ title: 'Invalid age', description: 'Please enter a valid age.', variant: 'destructive' });
      return;
    }
    updateProfile.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h1 className="font-semibold text-lg">Your Profile</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account info (read-only) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account</CardTitle>
              <CardDescription>Your sign-in details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Email</Label>
                <p className="text-sm">{user?.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Editable details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Details</CardTitle>
              <CardDescription>All fields are optional</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How should we call you?"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age <span className="text-muted-foreground font-normal">* optional</span></Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Your age"
                  min={0}
                  max={150}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preferences</CardTitle>
              <CardDescription>Manage your communication settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="emailUpdates"
                  checked={emailUpdates}
                  onCheckedChange={(checked) => setEmailUpdates(checked === true)}
                />
                <div className="space-y-0.5">
                  <Label htmlFor="emailUpdates" className="cursor-pointer">Email Updates</Label>
                  <p className="text-xs text-muted-foreground">Receive portfolio and market updates</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="stockTips"
                  checked={stockTips}
                  onCheckedChange={(checked) => setStockTips(checked === true)}
                />
                <div className="space-y-0.5">
                  <Label htmlFor="stockTips" className="cursor-pointer">Stock Tips</Label>
                  <p className="text-xs text-muted-foreground">Get dividend stock recommendations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={updateProfile.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateProfile.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </form>
      </main>
    </div>
  );
}
