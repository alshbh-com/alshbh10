CREATE TABLE public.debt_schedule (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  debtor_id uuid NOT NULL REFERENCES public.debtors(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  amount numeric NOT NULL,
  note text,
  collected boolean NOT NULL DEFAULT false,
  collected_at date,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.debt_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage schedule"
ON public.debt_schedule
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_debt_schedule_debtor ON public.debt_schedule(debtor_id);
CREATE INDEX idx_debt_schedule_due ON public.debt_schedule(due_date);