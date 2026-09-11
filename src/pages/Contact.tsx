import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function Contact() {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      toast({ title: 'Missing fields', description: 'Please fill in all fields.', variant: 'destructive' });
      return;
    }

    if (trimmedName.length > 100) {
      toast({ title: 'Name too long', description: 'Name must be under 100 characters.', variant: 'destructive' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail) || trimmedEmail.length > 255) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }

    if (trimmedMessage.length > 2000) {
      toast({ title: 'Message too long', description: 'Message must be under 2000 characters.', variant: 'destructive' });
      return;
    }

    setSending(true);
    const { data: inserted, error } = await supabase
      .from('contact_messages')
      .insert({
        name: trimmedName,
        email: trimmedEmail,
        message: trimmedMessage,
      })
      .select('id')
      .maybeSingle();
    setSending(false);

    if (error) {
      toast({ title: 'Error', description: 'Failed to send message. Please try again.', variant: 'destructive' });
      return;
    }

    // Fire-and-forget confirmation email to the sender
    if (inserted?.id) {
      supabase.functions.invoke('send-contact-confirmation', {
        body: { submissionId: inserted.id },
      }).catch(() => {});
    }


    toast({ title: 'Message sent!', description: 'Thanks for reaching out. We\'ll get back to you soon.' });

    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8 max-w-lg">
        <h1 className="text-2xl font-semibold mb-6">Contact Us</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Send Us a Message</CardTitle>
            <CardDescription>
              Have feedback or questions about Yield Guardian? We'd love to hear from you.
              You can also email us directly at{' '}
              <a href="mailto:lindafrank@aol.com" className="text-primary hover:underline">
                lindafrank@aol.com
              </a>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  maxLength={100}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  maxLength={255}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Your feedback or question…"
                  maxLength={2000}
                  rows={5}
                  required
                />
                <p className="text-xs text-muted-foreground text-right">{message.length}/2000</p>
              </div>
              <Button type="submit" className="w-full" disabled={sending}>
                <Send className="w-4 h-4 mr-2" />
                {sending ? 'Sending…' : 'Send Message'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
