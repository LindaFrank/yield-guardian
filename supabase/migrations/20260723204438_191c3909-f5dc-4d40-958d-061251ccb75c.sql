
-- 1. login_events
CREATE TABLE public.login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  user_agent text
);
CREATE INDEX login_events_user_time_idx ON public.login_events (user_id, occurred_at DESC);
CREATE INDEX login_events_time_idx ON public.login_events (occurred_at DESC);
GRANT SELECT, INSERT ON public.login_events TO authenticated;
GRANT ALL ON public.login_events TO service_role;
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can log own logins" ON public.login_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own logins" ON public.login_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all logins" ON public.login_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 2. replacement_events
CREATE TABLE public.replacement_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  from_ticker text NOT NULL,
  to_ticker text NOT NULL,
  shares_sold numeric,
  shares_bought numeric,
  income_delta numeric,
  yield_delta numeric,
  mode text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX replacement_events_user_time_idx ON public.replacement_events (user_id, occurred_at DESC);
CREATE INDEX replacement_events_time_idx ON public.replacement_events (occurred_at DESC);
GRANT SELECT, INSERT ON public.replacement_events TO authenticated;
GRANT ALL ON public.replacement_events TO service_role;
ALTER TABLE public.replacement_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can log own replacements" ON public.replacement_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own replacements" ON public.replacement_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all replacements" ON public.replacement_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3. portfolio_snapshots
CREATE TABLE public.portfolio_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  taken_at timestamptz NOT NULL DEFAULT now(),
  portfolio_value numeric,
  annual_income numeric,
  weighted_yield numeric,
  num_positions integer,
  num_underperformers integer,
  reason text
);
CREATE INDEX portfolio_snapshots_user_time_idx ON public.portfolio_snapshots (user_id, taken_at DESC);
CREATE INDEX portfolio_snapshots_time_idx ON public.portfolio_snapshots (taken_at DESC);
GRANT SELECT, INSERT ON public.portfolio_snapshots TO authenticated;
GRANT ALL ON public.portfolio_snapshots TO service_role;
ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can log own snapshots" ON public.portfolio_snapshots
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own snapshots" ON public.portfolio_snapshots
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all snapshots" ON public.portfolio_snapshots
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. user_stocks.source column
ALTER TABLE public.user_stocks
  ADD COLUMN IF NOT EXISTS source text
  CHECK (source IS NULL OR source IN ('manual','import','onboarding'));

-- 5. Admin metrics aggregator
CREATE OR REPLACE FUNCTION public.get_admin_metrics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  WITH
  login_stats AS (
    SELECT
      COUNT(DISTINCT user_id) FILTER (WHERE occurred_at >= now() - interval '1 day')  AS dau,
      COUNT(DISTINCT user_id) FILTER (WHERE occurred_at >= now() - interval '7 days')  AS wau,
      COUNT(DISTINCT user_id) FILTER (WHERE occurred_at >= now() - interval '30 days') AS mau,
      COUNT(*)                FILTER (WHERE occurred_at >= now() - interval '30 days') AS logins_30d
    FROM public.login_events
  ),
  returning_users AS (
    SELECT COUNT(*) AS returning_count
    FROM (
      SELECT user_id
      FROM public.login_events
      WHERE occurred_at >= now() - interval '30 days'
      GROUP BY user_id
      HAVING COUNT(DISTINCT date_trunc('day', occurred_at)) >= 2
    ) t
  ),
  portfolio_stats AS (
    SELECT
      COUNT(DISTINCT user_id) AS total_portfolios,
      COUNT(*) AS total_positions
    FROM public.user_stocks
  ),
  per_user AS (
    SELECT user_id, COUNT(*)::numeric AS n
    FROM public.user_stocks
    GROUP BY user_id
  ),
  avg_positions AS (
    SELECT
      COALESCE(AVG(n), 0)                                        AS avg_companies,
      COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY n),0) AS median_companies,
      COALESCE(MAX(n), 0)                                        AS max_companies
    FROM per_user
  ),
  new_portfolios_30d AS (
    SELECT COUNT(*) AS c FROM (
      SELECT user_id, MIN(added_at) AS first_added
      FROM public.user_stocks
      GROUP BY user_id
    ) t
    WHERE first_added >= now() - interval '30 days'
  ),
  yield_lift AS (
    SELECT
      COALESCE(AVG(last_y - first_y), 0)  AS avg_yield_lift,
      COALESCE(AVG(last_inc - first_inc), 0) AS avg_income_lift,
      COUNT(*) AS users_with_snapshots
    FROM (
      SELECT
        user_id,
        (ARRAY_AGG(weighted_yield ORDER BY taken_at))[1] AS first_y,
        (ARRAY_AGG(weighted_yield ORDER BY taken_at DESC))[1] AS last_y,
        (ARRAY_AGG(annual_income ORDER BY taken_at))[1] AS first_inc,
        (ARRAY_AGG(annual_income ORDER BY taken_at DESC))[1] AS last_inc,
        COUNT(*) AS n
      FROM public.portfolio_snapshots
      GROUP BY user_id
      HAVING COUNT(*) >= 2
    ) t
  ),
  replacement_stats AS (
    SELECT
      COUNT(*) AS total_replacements,
      COALESCE(AVG(income_delta), 0) AS avg_income_delta,
      COALESCE(AVG(yield_delta), 0)  AS avg_yield_delta,
      COALESCE(SUM(income_delta), 0) AS total_income_delta
    FROM public.replacement_events
  ),
  logins_by_day AS (
    SELECT jsonb_agg(jsonb_build_object('day', day, 'logins', c, 'users', u) ORDER BY day) AS series
    FROM (
      SELECT
        date_trunc('day', occurred_at)::date AS day,
        COUNT(*) AS c,
        COUNT(DISTINCT user_id) AS u
      FROM public.login_events
      WHERE occurred_at >= now() - interval '30 days'
      GROUP BY 1
    ) d
  )
  SELECT jsonb_build_object(
    'logins', jsonb_build_object(
      'dau', ls.dau, 'wau', ls.wau, 'mau', ls.mau,
      'logins_30d', ls.logins_30d,
      'returning_30d', ru.returning_count,
      'by_day', COALESCE(lbd.series, '[]'::jsonb)
    ),
    'portfolios', jsonb_build_object(
      'total', ps.total_portfolios,
      'total_positions', ps.total_positions,
      'avg_companies', ROUND(ap.avg_companies::numeric, 2),
      'median_companies', ap.median_companies,
      'max_companies', ap.max_companies,
      'new_30d', np.c
    ),
    'improvement', jsonb_build_object(
      'avg_yield_lift_pct', ROUND((yl.avg_yield_lift)::numeric, 3),
      'avg_income_lift', ROUND(yl.avg_income_lift::numeric, 2),
      'users_measured', yl.users_with_snapshots
    ),
    'replacements', jsonb_build_object(
      'total', rs.total_replacements,
      'avg_income_delta', ROUND(rs.avg_income_delta::numeric, 2),
      'avg_yield_delta', ROUND(rs.avg_yield_delta::numeric, 3),
      'total_income_delta', ROUND(rs.total_income_delta::numeric, 2)
    ),
    'generated_at', now()
  )
  INTO result
  FROM login_stats ls, returning_users ru, portfolio_stats ps, avg_positions ap,
       new_portfolios_30d np, yield_lift yl, replacement_stats rs, logins_by_day lbd;

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_metrics() TO authenticated;
