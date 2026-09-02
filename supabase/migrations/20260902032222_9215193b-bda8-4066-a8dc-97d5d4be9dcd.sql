CREATE TABLE public.demo_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text,
  email text,
  comment text NOT NULL,
  source text NOT NULL DEFAULT 'guest_demo',
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.demo_feedback TO anon;
GRANT INSERT, SELECT ON public.demo_feedback TO authenticated;
GRANT ALL ON public.demo_feedback TO service_role;

ALTER TABLE public.demo_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit demo feedback"
ON public.demo_feedback
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(btrim(comment)) >= 1 AND length(btrim(comment)) <= 5000
  AND (name IS NULL OR length(btrim(name)) <= 200)
  AND (email IS NULL OR (length(btrim(email)) <= 320 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'))
  AND source = 'guest_demo'
);

CREATE POLICY "Admins can view demo feedback"
ON public.demo_feedback
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));