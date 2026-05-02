import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Download, Trash2, CheckCircle2, MessageCircle, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";

interface Lead {
  id: string;
  name: string;
  whatsapp: string;
  system_slug: string;
  ip_address: string | null;
  user_agent: string | null;
  contacted: boolean;
  created_at: string;
}

interface System { slug: string; name: string; }

const AdminLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const [l, s] = await Promise.all([
        supabase.from("leads").select("*").order("created_at", { ascending: false }),
        supabase.from("systems").select("slug,name"),
      ]);
      if (l.data) setLeads(l.data as any);
      if (s.data) setSystems(s.data);
      setLoading(false);
    };
    load();

    const ch = supabase
      .channel("leads-table")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, (payload) => {
        setLeads((prev) => [payload.new as Lead, ...prev]);
        toast.success(`عميل جديد: ${(payload.new as Lead).name}`, { duration: 6000 });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "leads" }, (payload) => {
        setLeads((prev) => prev.map((l) => l.id === (payload.new as Lead).id ? (payload.new as Lead) : l));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "leads" }, (payload) => {
        setLeads((prev) => prev.filter((l) => l.id !== (payload.old as any).id));
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  const systemName = (slug: string) => systems.find((s) => s.slug === slug)?.name || slug;

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (filter !== "all" && l.system_slug !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!l.name.toLowerCase().includes(q) && !l.whatsapp.includes(q)) return false;
      }
      return true;
    });
  }, [leads, filter, search]);

  const markContacted = async (id: string, value: boolean) => {
    const { error } = await supabase.from("leads").update({ contacted: value }).eq("id", id);
    if (error) toast.error("فشل التحديث");
    else toast.success(value ? "تم وضع علامة تواصل" : "تم إلغاء العلامة");
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذا العميل نهائياً؟")) return;
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) toast.error("فشل الحذف");
    else toast.success("تم الحذف");
  };

  const exportExcel = () => {
    const rows = filtered.map((l) => ({
      الاسم: l.name,
      الواتساب: l.whatsapp,
      السيستم: systemName(l.system_slug),
      التاريخ: new Date(l.created_at).toLocaleString("ar-EG"),
      "تم التواصل": l.contacted ? "نعم" : "لا",
      IP: l.ip_address || "",
      "نوع الجهاز": l.user_agent || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, `alshbh-leads-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("تم تصدير البيانات");
  };

  const deviceLabel = (ua: string | null) => {
    if (!ua) return "—";
    if (/iPhone|iPad/.test(ua)) return "iOS";
    if (/Android/.test(ua)) return "Android";
    if (/Windows/.test(ua)) return "Windows";
    if (/Mac/.test(ua)) return "Mac";
    return "Other";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">العملاء</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} من إجمالي {leads.length}</p>
        </div>
        <Button onClick={exportExcel} className="bg-gradient-primary text-primary-foreground font-bold">
          <Download className="w-4 h-4 ml-2" />
          تصدير Excel
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو الرقم" className="pr-10 h-11" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px] h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل السيستمات</SelectItem>
            {systems.map((s) => <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-gradient-card rounded-2xl border border-border/50 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">لا يوجد عملاء</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-right">
                <tr>
                  <th className="p-4 font-bold">الاسم</th>
                  <th className="p-4 font-bold">الواتساب</th>
                  <th className="p-4 font-bold">السيستم</th>
                  <th className="p-4 font-bold">التاريخ</th>
                  <th className="p-4 font-bold">الجهاز</th>
                  <th className="p-4 font-bold">IP</th>
                  <th className="p-4 font-bold">الحالة</th>
                  <th className="p-4 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} className="border-t border-border/50 hover:bg-muted/20 transition-smooth">
                    <td className="p-4 font-semibold">{l.name}</td>
                    <td className="p-4" dir="ltr">{l.whatsapp}</td>
                    <td className="p-4">
                      <Badge variant="outline" className="border-primary/40 text-primary">{systemName(l.system_slug)}</Badge>
                    </td>
                    <td className="p-4 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">{deviceLabel(l.user_agent)}</td>
                    <td className="p-4 text-xs text-muted-foreground" dir="ltr">{l.ip_address || "—"}</td>
                    <td className="p-4">
                      {l.contacted
                        ? <Badge className="bg-success/20 text-success border-success/40">تم التواصل</Badge>
                        : <Badge variant="outline" className="border-secondary/40 text-secondary">معلّق</Badge>}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <a href={`https://wa.me/${l.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer">
                          <Button size="icon" variant="ghost" className="text-success hover:text-success hover:bg-success/10" title="فتح واتساب">
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        </a>
                        <Button size="icon" variant="ghost" onClick={() => markContacted(l.id, !l.contacted)} title="تم التواصل" className="hover:bg-primary/10 hover:text-primary">
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => remove(l.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10" title="حذف">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLeads;
