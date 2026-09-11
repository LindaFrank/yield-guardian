import { forwardRef, useState } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const feedbackSchema = z.object({
  name: z.string().trim().max(200, 'Name must be under 200 characters').optional(),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .max(320, 'Email must be under 320 characters')
    .optional(),
  comment: z
    .string()
    .trim()
    .min(1, 'Please tell us what you think')
    .max(5000, 'Comment must be under 5000 characters'),
});

interface DemoFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DemoFeedbackModal = forwardRef<HTMLDivElement, DemoFeedbackModalProps>(
  ({ open, onOpenChange }, ref) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const parsed = feedbackSchema.safeParse({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        comment,
      });
      if (!parsed.success) {
        toast.error(parsed.error.errors[0]?.message ?? 'Please check your entries');
        return;
      }

      setSubmitting(true);
      try {
        const { error } = await supabase.from('demo_feedback').insert({
          name: parsed.data.name ?? null,
          email: parsed.data.email ?? null,
          comment: parsed.data.comment,
          source: 'guest_demo',
        });
        if (error) throw error;
        toast.success('Thank you! Your feedback was sent.');
        setName('');
        setEmail('');
        setComment('');
        onOpenChange(false);
      } catch {
        toast.error('Something went wrong. Please try again.');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent ref={ref} className="max-w-lg border-2 border-border/60">
          <DialogHeader>
            <DialogTitle>Feedback on the free demo</DialogTitle>
            <DialogDescription>
              Tell us what worked, what was confusing, and what you'd want to see next. No account needed.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="feedback-name">Name (optional)</Label>
                <Input
                  id="feedback-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={200}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback-email">Email (optional)</Label>
                <Input
                  id="feedback-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={320}
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback-comment">Your comments</Label>
              <Textarea
                id="feedback-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={5000}
                rows={6}
                placeholder="What did you think of the free demo?"
                required
              />
              <p className="text-xs text-muted-foreground text-right">{comment.length}/5000</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send feedback'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  },
);

DemoFeedbackModal.displayName = 'DemoFeedbackModal';
