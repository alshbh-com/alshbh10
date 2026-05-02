CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  session_id text NOT NULL,
  system_slug text,
  metadata jsonb DEFAULT '{}'::jsonb,
  user_agent text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_session ON public.analytics_events(session_id);
CREATE INDEX idx_analytics_created ON public.analytics_events(created_at DESC);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log events"
ON public.analytics_events FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Admins can view events"
ON public.analytics_events FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_events;