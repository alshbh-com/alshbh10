import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CountdownProps {
  hours?: number;
}

export const Countdown = ({ hours = 72 }: CountdownProps) => {
  const [target, setTarget] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "countdown_end_at")
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted) return;
        const v = data?.value;
        const t = v ? new Date(v).getTime() : NaN;
        if (!isNaN(t)) setTarget(t);
        else setTarget(Date.now() + hours * 3600000);
      });
    return () => { mounted = false; };
  }, [hours]);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const diff = Math.max(0, (target ?? Date.now()) - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  const Box = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-gradient-card glow-border rounded-xl px-3 py-2 sm:px-5 sm:py-3 min-w-[60px] sm:min-w-[80px]">
        <div className="text-2xl sm:text-4xl font-black text-gradient font-display tabular-nums">
          {String(value).padStart(2, "0")}
        </div>
      </div>
      <span className="text-xs text-muted-foreground mt-2">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4" dir="ltr">
      <Box value={s} label="ثانية" />
      <span className="text-2xl text-primary font-bold pb-6">:</span>
      <Box value={m} label="دقيقة" />
      <span className="text-2xl text-primary font-bold pb-6">:</span>
      <Box value={h} label="ساعة" />
      <span className="text-2xl text-primary font-bold pb-6">:</span>
      <Box value={d} label="يوم" />
    </div>
  );
};
