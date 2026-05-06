
-- Proofs (testimonial screenshots) per system
CREATE TABLE public.system_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_slug text NOT NULL,
  image_url text NOT NULL,
  caption text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.system_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view proofs" ON public.system_proofs
  FOR SELECT USING (true);
CREATE POLICY "Admins manage proofs" ON public.system_proofs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Public bucket for proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('proofs', 'proofs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view proofs files" ON storage.objects
  FOR SELECT USING (bucket_id = 'proofs');
CREATE POLICY "Admins upload proofs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'proofs' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update proofs" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'proofs' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete proofs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'proofs' AND has_role(auth.uid(), 'admin'::app_role));
