import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eye, PlayCircle, MousePointerClick, Send, TrendingDown, Loader2 } from "lucide-react";

interface Counts {
  visitors: number;
  videoPlays: number;
  formOpens: number;
  formSubmits: number;
  total: number;
}

const AdminAnalytics = () => {
  const [range, setRange] = useState<"24h" | "7d" | "30d" | "all">("7d");
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Counts>({ visitors: 0, videoPlays: 0, formOpens: 0, formSubmits: 0, total: 0 });
  const [byDay, setByDay] = useState<{ day: string; count: number }[]>([]);

  const load = async () => {
    setLoading(true);
    let since: string | null = null;
    const now = Date.now();
    if (range === "24h") since = new Date(now - 86400000).toISOString();
    else if (range === "7d") since = new Date(now - 7 * 86400000).toISOString();
    else if (range === "30d") since = new Date(now - 30 * 86400000).toISOString();

    let q = supabase.from("analytics_events").select("event_type,session_id,created_at").limit(10000);
    if (since) q = q.gte("created_at", since);
    const { data } = await q;
    const rows = data || [];

    const visitorsSet = new Set(rows.filter(r => r.event_type === "page_view").map(r => r.session_id));
    const videoSet = new Set(rows.filter(r => r.event_type === "video_play").map(r => r.session_id));
    const openSet = new Set(rows.filter(r => r.event_type === "form_open").map(r => r.session_id));
    const submitSet = new Set(rows.filter(r => r.event_type === "form_submit").map(r => r.session_id));

    setCounts({
      visitors: visitorsSet.size,
      videoPlays: videoSet.size,
      formOpens: openSet.size,
      formSubmits: submitSet.size,
      total: rows.length,
    });

    // visits by day (last 14)
    const days: Record<string, Set<string>> = {};
    rows.filter(r => r.event_type === "page_view").forEach(r => {
      const d = new Date(r.created_at).toISOString().slice(0, 10);
      if (!days[d]) days[d] = new Set();
      days[d].add(r.session_id);
    });
    const arr = Object.entries(days)
      .map(([day, set]) => ({ day, count: set.size }))
      .sort((a, b) => a.day.localeCompare(b.day))
      .slice(-14);
    setByDay(arr);

    setLoading(false);
  };

  useEffect(() => { load(); }, [range]);

  useEffect(() => {
    const ch = supabase
      .channel("analytics-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "analytics_events" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [range]);

  const abandoned = Math.max(0, counts.formOpens - counts.formSubmits);
  const conversionRate = counts.visitors ? ((counts.formSubmits / counts.visitors) * 100).toFixed(1) : "0";
  const videoRate = counts.visitors ? ((counts.videoPlays / counts.visitors) * 100).toFixed(1) : "0";
  const abandonRate = counts.formOpens ? ((abandoned / counts.formOpens) * 100).toFixed(1) : "0";

  const cards = [
    { icon: Eye, label: "زوار فريدين", value: counts.visitors, color: "text-primary", sub: "إجمالي الجلسات" },
    { icon: PlayCircle, label: "شغّلوا الفيديو", value: counts.videoPlays, color: "text-secondary", sub: `${videoRate}% من الزوار` },
    { icon: MousePointerClick, label: "فتحوا الحجز", value: counts.formOpens, color: "text-accent", sub: "وصلوا للفورم" },
    { icon: Send, label: "أكملوا الحجز", value: counts.formSubmits, color: "text-success", sub: `${conversionRate}% تحويل` },
    { icon: TrendingDown, label: "فتحوا ومكملوش", value: abandoned, color: "text-destructive", sub: `${abandonRate}% تخلي` },
  ];

  const ranges: { k: typeof range; label: string }[] = [
    { k: "24h", label: "آخر 24 ساعة" },
    { k: "7d", label: "آخر 7 أيام" },
    { k: "30d", label: "آخر 30 يوم" },
    { k: "all", label: "الكل" },
  ];

  const maxDay = Math.max(1, ...byDay.map(d => d.count));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black mb-2">إحصائيات الزيارات</h1>
          <p className="text-muted-foreground">تتبع سلوك الزوار في الموقع</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {ranges.map(r => (
            <button
              key={r.k}
              onClick={() => setRange(r.k)}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${
                range === r.k ? "bg-gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >{r.label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {cards.map((c, i) => (
              <div key={i} className="bg-gradient-card rounded-2xl p-5 border border-border/50">
                <c.icon className={`w-7 h-7 ${c.color} mb-3`} />
                <div className="text-3xl font-black mb-1">{c.value}</div>
                <div className="text-sm font-semibold">{c.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Funnel */}
          <div className="bg-gradient-card rounded-2xl p-6 border border-border/50">
            <h2 className="font-black text-lg mb-5">قمع التحويل</h2>
            <div className="space-y-3">
              {[
                { label: "دخلوا الموقع", value: counts.visitors, color: "bg-primary" },
                { label: "شغّلوا الفيديو", value: counts.videoPlays, color: "bg-secondary" },
                { label: "فتحوا فورم الحجز", value: counts.formOpens, color: "bg-accent" },
                { label: "أكملوا الحجز", value: counts.formSubmits, color: "bg-success" },
              ].map((s, i) => {
                const pct = counts.visitors ? (s.value / counts.visitors) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold">{s.label}</span>
                      <span className="text-muted-foreground">{s.value} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily chart */}
          {byDay.length > 0 && (
            <div className="bg-gradient-card rounded-2xl p-6 border border-border/50">
              <h2 className="font-black text-lg mb-5">الزوار يومياً</h2>
              <div className="flex items-end gap-2 h-40">
                {byDay.map(d => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition">{d.count}</div>
                    <div
                      className="w-full bg-gradient-primary rounded-t transition-all"
                      style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: "4px" }}
                    />
                    <div className="text-[10px] text-muted-foreground" dir="ltr">{d.day.slice(5)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminAnalytics;
