import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

type State = 'loading' | 'valid' | 'invalid' | 'done' | 'error';

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<State>('loading');
  const [email, setEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setState('invalid');
      return;
    }
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`;
    fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string } })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setState('invalid');
          return;
        }
        if (data?.already_unsubscribed) {
          setState('done');
        } else {
          setEmail(data?.email ?? null);
          setState('valid');
        }
      })
      .catch(() => setState('error'));
  }, [token]);

  const confirm = async () => {
    setSubmitting(true);
    const { error } = await supabase.functions.invoke('handle-email-unsubscribe', { body: { token } });
    setSubmitting(false);
    setState(error ? 'error' : 'done');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2">
        <CardHeader>
          <CardTitle>Email preferences</CardTitle>
          <CardDescription>Yield Guardian</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === 'loading' && <p className="text-muted-foreground">Checking your link…</p>}

          {state === 'valid' && (
            <>
              <p className="text-muted-foreground">
                Unsubscribe {email ?? 'this address'} from Yield Guardian emails?
              </p>
              <Button onClick={confirm} disabled={submitting} className="w-full">
                {submitting ? 'Unsubscribing…' : 'Confirm unsubscribe'}
              </Button>
            </>
          )}

          {state === 'done' && (
            <p className="text-muted-foreground">
              You've been unsubscribed. You will no longer receive these emails.
            </p>
          )}

          {state === 'invalid' && (
            <p className="text-muted-foreground">
              This unsubscribe link is invalid or has expired.
            </p>
          )}

          {state === 'error' && (
            <p className="text-muted-foreground">
              Something went wrong. Please try again later.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
