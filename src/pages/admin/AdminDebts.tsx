import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Wallet, AlertTriangle, CheckCircle2, Trash2, CreditCard, Phone, Calendar as CalIcon, FileText, X } from "lucide-react";
import { z } from "zod";

interface Debtor {
  id: string;
  name: string;
  whatsapp: string | null;
  total_amount: number;
  due_date: string;
  notes: string | null;
  status: string;
  created_at: string;
}
interface Payment {
  id: string;
  debtor_id: string;
  amount: number;
  paid_at: string;
  note: string | null;
}
interface ScheduleItem {
  id: string;
  debtor_id: string;
  due_date: string;
  amount: number;
  note: string | null;
  collected: boolean;
  collected_at: string | null;
}

const debtorSchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير").max(100),
  whatsapp: z.string().trim().max(20).optional().or(z.literal("")),
  total_amount: z.number().positive("المبلغ لازم يكون أكبر من صفر"),
  due_date: z.string().min(1, "حدد تاريخ السداد"),
  notes: z.string().max(500).optional().or(z.literal("")),
});

const paymentSchema = z.object({
  amount: z.number().positive("مبلغ غير صحيح"),
  paid_at: z.string().min(1),
  note: z.string().max(200).optional().or(z.literal("")),
});

const fmt = (n: number) => new Intl.NumberFormat("ar-EG").format(n);
const today = () => new Date().toISOString().slice(0, 10);
const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

const AdminDebts = () => {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const [openDetails, setOpenDetails] = useState<Debtor | null>(null);

  // new debtor form
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // payment form
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(today());
  const [payNote, setPayNote] = useState("");

  // schedule form
  const [schedAmount, setSchedAmount] = useState("");
  const [schedDate, setSchedDate] = useState("");
  const [schedNote, setSchedNote] = useState("");

  const load = async () => {
    const [d, p, s] = await Promise.all([
      supabase.from("debtors").select("*").order("due_date"),
      supabase.from("debt_payments").select("*").order("paid_at", { ascending: false }),
      supabase.from("debt_schedule").select("*").order("due_date"),
    ]);
    if (d.data) setDebtors(d.data as any);
    if (p.data) setPayments(p.data as any);
    if (s.data) setSchedule(s.data as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const paidByDebtor = useMemo(() => {
    const map: Record<string, number> = {};
    payments.forEach(p => { map[p.debtor_id] = (map[p.debtor_id] || 0) + Number(p.amount); });
    return map;
  }, [payments]);

  const enriched = useMemo(() => debtors.map(d => {
    const paid = paidByDebtor[d.id] || 0;
    const remaining = Math.max(0, Number(d.total_amount) - paid);
    const days = daysUntil(d.due_date);
    let state: "paid" | "overdue" | "warning" | "ok" = "ok";
    if (remaining <= 0) state = "paid";
    else if (days < 0) state = "overdue";
    else if (days <= 1) state = "warning";
    return { ...d, paid, remaining, days, state };
  }), [debtors, paidByDebtor]);

  const stats = useMemo(() => ({
    total: enriched.reduce((s, d) => s + Number(d.total_amount), 0),
    paid: enriched.reduce((s, d) => s + d.paid, 0),
    remaining: enriched.reduce((s, d) => s + d.remaining, 0),
    warnings: enriched.filter(d => d.state === "warning" || d.state === "overdue").length,
  }), [enriched]);

  const resetNew = () => { setName(""); setWhatsapp(""); setAmount(""); setDueDate(""); setNotes(""); };

  const addDebtor = async () => {
    const parsed = debtorSchema.safeParse({
      name, whatsapp, total_amount: Number(amount), due_date: dueDate, notes,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSaving(true);
    const { error } = await supabase.from("debtors").insert({
      name: parsed.data.name,
      whatsapp: parsed.data.whatsapp || null,
      total_amount: parsed.data.total_amount,
      due_date: parsed.data.due_date,
      notes: parsed.data.notes || null,
    });
    setSaving(false);
    if (error) { toast.error("فشل الحفظ"); return; }
    toast.success("تم إضافة المديون");
    resetNew(); setOpenNew(false); load();
  };

  const addPayment = async () => {
    if (!openDetails) return;
    const parsed = paymentSchema.safeParse({
      amount: Number(payAmount), paid_at: payDate, note: payNote,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    const { error } = await supabase.from("debt_payments").insert({
      debtor_id: openDetails.id,
      amount: parsed.data.amount,
      paid_at: parsed.data.paid_at,
      note: parsed.data.note || null,
    });
    if (error) { toast.error("فشل الحفظ"); return; }
    toast.success("تم تسجيل الدفعة");
    setPayAmount(""); setPayDate(today()); setPayNote("");
    load();
  };

  const deletePayment = async (id: string) => {
    const { error } = await supabase.from("debt_payments").delete().eq("id", id);
    if (error) { toast.error("فشل الحذف"); return; }
    toast.success("تم حذف الدفعة"); load();
  };

  const deleteDebtor = async (id: string) => {
    if (!confirm("متأكد من حذف المديون وكل دفعاته؟")) return;
    const { error } = await supabase.from("debtors").delete().eq("id", id);
    if (error) { toast.error("فشل الحذف"); return; }
    toast.success("تم الحذف"); setOpenDetails(null); load();
  };

  const addSchedule = async () => {
    if (!openDetails) return;
    const amt = Number(schedAmount);
    if (!amt || amt <= 0) { toast.error("مبلغ غير صحيح"); return; }
    if (!schedDate) { toast.error("حدد تاريخ القسط"); return; }
    const { error } = await supabase.from("debt_schedule").insert({
      debtor_id: openDetails.id,
      amount: amt,
      due_date: schedDate,
      note: schedNote || null,
    });
    if (error) { toast.error("فشل الحفظ"); return; }
    toast.success("تم جدولة القسط");
    setSchedAmount(""); setSchedDate(""); setSchedNote("");
    load();
  };

  const deleteSchedule = async (id: string) => {
    const { error } = await supabase.from("debt_schedule").delete().eq("id", id);
    if (error) { toast.error("فشل الحذف"); return; }
    toast.success("تم الحذف"); load();
  };

  const collectSchedule = async (item: ScheduleItem) => {
    // mark collected and create matching payment
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("debt_schedule").update({ collected: true, collected_at: today() }).eq("id", item.id),
      supabase.from("debt_payments").insert({
        debtor_id: item.debtor_id,
        amount: item.amount,
        paid_at: today(),
        note: item.note ? `قسط: ${item.note}` : `قسط بتاريخ ${item.due_date}`,
      }),
    ]);
    if (e1 || e2) { toast.error("فشل تأكيد التحصيل"); return; }
    toast.success("تم التحصيل وتسجيل الدفعة"); load();
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

  const detailsPayments = openDetails ? payments.filter(p => p.debtor_id === openDetails.id) : [];
  const detailsSchedule = openDetails ? schedule.filter(s => s.debtor_id === openDetails.id) : [];
  const detailsTotal = openDetails ? Number(openDetails.total_amount) : 0;
  const detailsPaid = openDetails ? (paidByDebtor[openDetails.id] || 0) : 0;
  const detailsRemaining = Math.max(0, detailsTotal - detailsPaid);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black mb-2">المديونيات</h1>
          <p className="text-muted-foreground">سجل الفلوس اللي عندك على العملاء</p>
        </div>
        <Dialog open={openNew} onOpenChange={(o) => { setOpenNew(o); if (!o) resetNew(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground font-bold">
              <Plus className="w-4 h-4 ml-2" /> إضافة مديون
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>مديون جديد</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="mb-2 block">الاسم *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
              </div>
              <div>
                <Label className="mb-2 block">رقم الواتساب</Label>
                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} dir="ltr" maxLength={20} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-2 block">المبلغ الكلي *</Label>
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} dir="ltr" />
                </div>
                <div>
                  <Label className="mb-2 block">تاريخ السداد *</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} dir="ltr" />
                </div>
              </div>
              <div>
                <Label className="mb-2 block">ملاحظات</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={500} />
              </div>
              <Button onClick={addDebtor} disabled={saving} className="w-full bg-gradient-primary text-primary-foreground font-bold">
                {saving ? <Loader2 className="animate-spin" /> : "حفظ"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        {[
          { icon: Wallet, label: "إجمالي المديونيات", value: fmt(stats.total) + " ج", color: "text-primary" },
          { icon: CheckCircle2, label: "المدفوع", value: fmt(stats.paid) + " ج", color: "text-success" },
          { icon: CreditCard, label: "المتبقي", value: fmt(stats.remaining) + " ج", color: "text-secondary" },
          { icon: AlertTriangle, label: "تحذيرات", value: String(stats.warnings), color: "text-destructive" },
        ].map((c, i) => (
          <div key={i} className="bg-gradient-card rounded-2xl p-5 border border-border/50">
            <c.icon className={`w-7 h-7 ${c.color} mb-3`} />
            <div className="text-2xl font-black mb-1">{c.value}</div>
            <div className="text-sm text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {enriched.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">مفيش مديونيات لسه — اضغط "إضافة مديون"</div>
        )}
        {enriched.map(d => {
          const pct = Number(d.total_amount) ? (d.paid / Number(d.total_amount)) * 100 : 0;
          const stateBadge = {
            paid: <Badge className="bg-success text-success-foreground">تم السداد</Badge>,
            overdue: <Badge variant="destructive">متأخر {Math.abs(d.days)} يوم</Badge>,
            warning: <Badge className="bg-secondary text-secondary-foreground"><AlertTriangle className="w-3 h-3 ml-1" /> {d.days === 0 ? "اليوم" : "بكرة"}</Badge>,
            ok: <Badge variant="outline">باقي {d.days} يوم</Badge>,
          }[d.state];
          return (
            <button
              key={d.id}
              onClick={() => setOpenDetails(d)}
              className={`w-full text-right bg-gradient-card rounded-2xl p-5 border transition hover:border-primary/50 ${
                d.state === "overdue" ? "border-destructive/50" :
                d.state === "warning" ? "border-secondary/50" :
                d.state === "paid" ? "border-success/30 opacity-70" : "border-border/50"
              }`}
            >
              <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                <div>
                  <div className="font-black text-lg">{d.name}</div>
                  {d.whatsapp && <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1" dir="ltr"><Phone className="w-3 h-3" />{d.whatsapp}</div>}
                </div>
                {stateBadge}
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2 text-sm">
                <span className="text-muted-foreground">المتبقي: <span className="font-black text-foreground text-base">{fmt(d.remaining)} ج</span></span>
                <span className="text-muted-foreground">من <span className="font-bold">{fmt(Number(d.total_amount))} ج</span></span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1" dir="ltr">
                <CalIcon className="w-3 h-3" /> {d.due_date}
              </div>
            </button>
          );
        })}
      </div>

      {/* Details dialog */}
      <Dialog open={!!openDetails} onOpenChange={(o) => !o && setOpenDetails(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {openDetails && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between gap-2">
                  <span>{openDetails.name}</span>
                  <Button onClick={() => deleteDebtor(openDetails.id)} variant="ghost" size="icon" className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted/50 rounded-xl p-3">
                  <div className="text-xs text-muted-foreground">الكلي</div>
                  <div className="font-black">{fmt(detailsTotal)}</div>
                </div>
                <div className="bg-success/10 rounded-xl p-3">
                  <div className="text-xs text-muted-foreground">مدفوع</div>
                  <div className="font-black text-success">{fmt(detailsPaid)}</div>
                </div>
                <div className="bg-secondary/10 rounded-xl p-3">
                  <div className="text-xs text-muted-foreground">متبقي</div>
                  <div className="font-black text-secondary">{fmt(detailsRemaining)}</div>
                </div>
              </div>

              {openDetails.notes && (
                <div className="bg-muted/30 rounded-xl p-3 text-sm flex gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{openDetails.notes}</span>
                </div>
              )}

              {/* Add payment */}
              <div className="bg-gradient-card border border-border/50 rounded-xl p-4 space-y-3">
                <div className="font-bold text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> تسجيل دفعة</div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="المبلغ" type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} dir="ltr" />
                  <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} dir="ltr" />
                </div>
                <Input placeholder="ملاحظة (اختياري)" value={payNote} onChange={(e) => setPayNote(e.target.value)} maxLength={200} />
                <Button onClick={addPayment} className="w-full bg-gradient-primary text-primary-foreground font-bold">
                  <Plus className="w-4 h-4 ml-2" /> إضافة الدفعة
                </Button>
              </div>

              {/* Schedule (installments by date) */}
              <div className="bg-gradient-card border border-border/50 rounded-xl p-4 space-y-3">
                <div className="font-bold text-sm flex items-center gap-2"><CalIcon className="w-4 h-4" /> جدولة الأقساط</div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="المبلغ" type="number" value={schedAmount} onChange={(e) => setSchedAmount(e.target.value)} dir="ltr" />
                  <Input type="date" value={schedDate} onChange={(e) => setSchedDate(e.target.value)} dir="ltr" />
                </div>
                <Input placeholder="ملاحظة (مثلا: قسط شهر 5)" value={schedNote} onChange={(e) => setSchedNote(e.target.value)} maxLength={200} />
                <Button onClick={addSchedule} variant="outline" className="w-full font-bold">
                  <Plus className="w-4 h-4 ml-2" /> جدولة قسط
                </Button>

                {detailsSchedule.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {detailsSchedule.map(s => {
                      const days = daysUntil(s.due_date);
                      const overdue = !s.collected && days < 0;
                      const soon = !s.collected && days >= 0 && days <= 1;
                      return (
                        <div key={s.id} className={`flex items-center justify-between rounded-lg p-3 text-sm border ${
                          s.collected ? "bg-success/10 border-success/30" :
                          overdue ? "bg-destructive/10 border-destructive/30" :
                          soon ? "bg-secondary/10 border-secondary/30" : "bg-muted/30 border-border/30"
                        }`}>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{fmt(Number(s.amount))} ج</span>
                              {s.collected && <Badge className="bg-success text-success-foreground text-[10px]">تم</Badge>}
                              {overdue && <Badge variant="destructive" className="text-[10px]">متأخر</Badge>}
                              {soon && <Badge className="bg-secondary text-secondary-foreground text-[10px]">{days === 0 ? "اليوم" : "بكرة"}</Badge>}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1" dir="ltr">{s.due_date}</div>
                            {s.note && <div className="text-xs mt-1">{s.note}</div>}
                          </div>
                          <div className="flex gap-1">
                            {!s.collected && (
                              <Button onClick={() => collectSchedule(s)} size="sm" variant="ghost" className="text-success h-8">
                                <CheckCircle2 className="w-4 h-4 ml-1" /> تحصيل
                              </Button>
                            )}
                            <Button onClick={() => deleteSchedule(s.id)} variant="ghost" size="icon" className="text-destructive h-8 w-8">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Payments list */}
              <div>
                <div className="font-bold text-sm mb-2">سجل الدفعات ({detailsPayments.length})</div>
                {detailsPayments.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-4">مفيش دفعات لسه</div>
                ) : (
                  <div className="space-y-2">
                    {detailsPayments.map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-3 text-sm">
                        <div>
                          <div className="font-bold">{fmt(Number(p.amount))} ج</div>
                          <div className="text-xs text-muted-foreground" dir="ltr">{p.paid_at}</div>
                          {p.note && <div className="text-xs mt-1">{p.note}</div>}
                        </div>
                        <Button onClick={() => deletePayment(p.id)} variant="ghost" size="icon" className="text-destructive h-8 w-8">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDebts;
