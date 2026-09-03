CREATE TABLE public.ui_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event text NOT NULL,
  category text,
  label text,
  path text,
  is_guest boolean NOT NULL DEFAULT true,
  user_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ui_events_occurred_at_idx ON public.ui_events (occurred_at DESC);
CREATE INDEX ui_events_event_idx ON public.ui_events (event);

GRANT INSERT ON public.ui_events TO anon;
GRANT INSERT, SELECT ON public.ui_events TO authenticated;
GRANT ALL ON public.ui_events TO service_role;

ALTER TABLE public.ui_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record ui events"
ON public.ui_events FOR INSERT TO anon, authenticated
WITH CHECK (
  length(btrim(event)) BETWEEN 1 AND 100
  AND (category IS NULL OR length(category) <= 60)
  AND (label IS NULL OR length(label) <= 200)
  AND (path IS NULL OR length(path) <= 300)
  AND (user_id IS NULL OR user_id = auth.uid())
);

CREATE POLICY "Admins can view ui events"
ON public.ui_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.get_ui_event_metrics(_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  since timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  since := now() - (GREATEST(COALESCE(_days, 30), 1) || ' days')::interval;

  WITH ev AS (
    SELECT * FROM public.ui_events WHERE occurred_at >= since
  ),
  top_events AS (
    SELECT jsonb_agg(x) AS j FROM (
      SELECT event, category, COUNT(*) AS clicks,
             COUNT(*) FILTER (WHERE is_guest) AS guest_clicks
      FROM ev GROUP BY event, category ORDER BY COUNT(*) DESC LIMIT 25
    ) x
  ),
  by_category AS (
    SELECT jsonb_agg(x) AS j FROM (
      SELECT COALESCE(category, 'uncategorized') AS category, COUNT(*) AS clicks
      FROM ev GROUP BY 1 ORDER BY COUNT(*) DESC
    ) x
  ),
  entry AS (
    SELECT jsonb_agg(x) AS j FROM (
      SELECT COALESCE(label, event) AS choice, COUNT(*) AS clicks
      FROM ev WHERE category = 'entry' GROUP BY 1 ORDER BY COUNT(*) DESC
    ) x
  ),
  strategy AS (
    SELECT jsonb_agg(x) AS j FROM (
      SELECT COALESCE(label, 'unknown') AS mode, COUNT(*) AS clicks
      FROM ev WHERE category = 'strategy' GROUP BY 1 ORDER BY COUNT(*) DESC
    ) x
  ),
  by_day AS (
    SELECT jsonb_agg(x ORDER BY x.day) AS j FROM (
      SELECT date_trunc('day', occurred_at)::date AS day, COUNT(*) AS clicks
      FROM ev GROUP BY 1
    ) x
  )
  SELECT jsonb_build_object(
    'window_days', GREATEST(COALESCE(_days, 30), 1),
    'total_events', (SELECT COUNT(*) FROM ev),
    'guest_events', (SELECT COUNT(*) FROM ev WHERE is_guest),
    'top_events', COALESCE(top_events.j, '[]'::jsonb),
    'by_category', COALESCE(by_category.j, '[]'::jsonb),
    'entry_choices', COALESCE(entry.j, '[]'::jsonb),
    'strategy_choices', COALESCE(strategy.j, '[]'::jsonb),
    'by_day', COALESCE(by_day.j, '[]'::jsonb),
    'generated_at', now()
  ) INTO result
  FROM top_events, by_category, entry, strategy, by_day;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_ui_event_metrics(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ui_event_metrics(integer) TO authenticated;