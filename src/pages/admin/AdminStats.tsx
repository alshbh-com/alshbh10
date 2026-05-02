import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, CheckCircle2, Clock } from "lucide-react";

interface Stats {
  total: number;
  contacted: number;
  pending: number;
  bySystem: { name: string; slug: string; count: number }[];
}

const AdminStats = () => {
  const [stats, setStats] = useState<Stats>({ total: 0, contacted: 0, pending: 0, bySystem: [] });

  useEffect(() => {
    const load = async () => {
      const { data: leads } = await supabase.from("leads").select("system_slug,contacted");
      const { data: systems } = await supabase.from("systems").select("slug,name").order("display_order");
      if (!leads || !systems) return;
      const total = leads.length;
      const contacted = leads.filter((l) => l.contacted).length;
      const bySystem = systems.map((s) => ({
        slug: s.slug,
        name: s.name,
        count: leads.filter((l) => l.system_slug === s.slug).length,
      }));
      setStats({ total, contacted, pending: total - contacted, bySystem });
    };
    load();

    const ch = supabase
      .channel("leads-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const cards = [
    { icon: Users, label: "إجمالي العملاء", value: stats.total, color: "text-primary" },
    { icon: Clock, label: "في الانتظار", value: stats.pending, color: "text-secondary" },
    { icon: CheckCircle2, label: "تم التواصل", value: stats.contacted, color: "text-success" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black mb-2">مرحباً 👋</h1>
        <p className="text-muted-foreground">نظرة عامة على نشاط الموقع</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        {cards.map((c, i) => (
          <div key={i} className="bg-gradient-card rounded-2xl p-6 border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <c.icon className={`w-8 h-8 ${c.color}`} />
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-4xl font-black mb-1">{c.value}</div>
            <div className="text-sm text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-black mb-4">العملاء حسب السيستم</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {stats.bySystem.map((s) => {
            const pct = stats.total ? (s.count / stats.total) * 100 : 0;
            return (
              <div key={s.slug} className="bg-gradient-card rounded-2xl p-5 border border-border/50">
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="font-bold">{s.name}</h3>
                  <span className="text-2xl font-black text-gradient">{s.count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
