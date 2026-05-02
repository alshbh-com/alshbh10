import { useEffect, useState } from "react";

interface CountdownProps {
  hours?: number;
}

export const Countdown = ({ hours = 48 }: CountdownProps) => {
  const [target] = useState(() => {
    const stored = localStorage.getItem("alshbh_countdown");
    if (stored) {
      const t = parseInt(stored);
      if (t > Date.now()) return t;
    }
    const t = Date.now() + hours * 60 * 60 * 1000;
    localStorage.setItem("alshbh_countdown", String(t));
    return t;
  });

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const diff = Math.max(0, target - now);
  const h = Math.floor(diff / 3600000);
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
    </div>
  );
};
