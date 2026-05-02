import { useEffect, useState, forwardRef } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { track } from "@/lib/analytics";

const schema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جداً").max(100),
  whatsapp: z.string().trim().min(8, "رقم غير صحيح").max(20).regex(/^[0-9+\s-]+$/, "أرقام فقط"),
  system_slug: z.string().min(1, "اختار سيستم"),
});

interface System { slug: string; name: string; }

export const LeadForm = forwardRef<HTMLDivElement, { selected?: string }>(({ selected }, ref) => {
  const [systems, setSystems] = useState<System[]>([]);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [systemSlug, setSystemSlug] = useState(selected || "");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.from("systems").select("slug,name").order("display_order").then(({ data }) => {
      if (data) setSystems(data);
    });
  }, []);

  useEffect(() => { if (selected) setSystemSlug(selected); }, [selected]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, whatsapp, system_slug: systemSlug });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      let ip: string | null = null;
      try {
        const r = await fetch("https://api.ipify.org?format=json");
        const j = await r.json();
        ip = j.ip;
      } catch {}

      const { error } = await supabase.from("leads").insert({
        name: parsed.data.name,
        whatsapp: parsed.data.whatsapp,
        system_slug: parsed.data.system_slug,
        ip_address: ip,
        user_agent: navigator.userAgent,
      });
      if (error) throw error;
      track("form_submit", { systemSlug: parsed.data.system_slug });
      setDone(true);
      setName(""); setWhatsapp(""); setSystemSlug("");
      toast.success("تم استلام طلبك بنجاح!");
    } catch (err: any) {
      toast.error("حدث خطأ، حاول مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section ref={ref} id="form" className="py-16 sm:py-24 scroll-mt-20">
      <div className="container">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8 animate-fade-up">
            <h2 className="text-3xl sm:text-5xl font-black mb-3">
              <span className="text-gradient">احجز</span> العرض دلوقتي
            </h2>
            <p className="text-muted-foreground">سجل بياناتك وفريقنا هيتواصل معاك خلال ساعات</p>
          </div>

          <div className="bg-gradient-card rounded-3xl p-6 sm:p-8 glow-border shadow-card-soft animate-fade-up">
            {done ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
                <h3 className="text-2xl font-black mb-2">تم استلام طلبك!</h3>
                <p className="text-muted-foreground mb-6">هنتواصل معاك في أقرب وقت على الواتساب</p>
                <Button variant="outline" onClick={() => setDone(false)}>إرسال طلب آخر</Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="name" className="mb-2 block font-semibold">الاسم</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="اكتب اسمك" required maxLength={100} className="h-12 bg-input border-border" />
                </div>
                <div>
                  <Label htmlFor="whatsapp" className="mb-2 block font-semibold">رقم الواتساب</Label>
                  <Input id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="01xxxxxxxxx" required maxLength={20} type="tel" dir="ltr" className="h-12 bg-input border-border text-right" />
                </div>
                <div>
                  <Label className="mb-2 block font-semibold">السيستم المطلوب</Label>
                  <Select value={systemSlug} onValueChange={setSystemSlug}>
                    <SelectTrigger className="h-12 bg-input border-border">
                      <SelectValue placeholder="اختار السيستم" />
                    </SelectTrigger>
                    <SelectContent>
                      {systems.map(s => <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={submitting} className="w-full h-14 bg-gradient-primary hover:opacity-90 text-primary-foreground font-bold text-lg rounded-xl shadow-glow">
                  {submitting ? <Loader2 className="animate-spin" /> : "تأكيد الحجز"}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-3">
                  بالتسجيل أنت توافق على حفظ بياناتك للتواصل معك
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
});

LeadForm.displayName = "LeadForm";
