import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Save, Video, Phone, Upload, Trash2 } from "lucide-react";

interface System {
  id: string;
  slug: string;
  name: string;
  description: string;
  features: string[];
  original_price: number;
  price: number;
}

const AdminSettings = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFileUrl, setVideoFileUrl] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [s, sys] = await Promise.all([
        supabase.from("site_settings").select("*"),
        supabase.from("systems").select("*").order("display_order"),
      ]);
      if (s.data) {
        setVideoUrl(s.data.find((x) => x.key === "video_url")?.value || "");
        setWhatsapp(s.data.find((x) => x.key === "whatsapp_number")?.value || "");
      }
      if (sys.data) setSystems(sys.data as any);
      setLoading(false);
    };
    load();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    const { error: e1 } = await supabase.from("site_settings").upsert({ key: "video_url", value: videoUrl });
    const { error: e2 } = await supabase.from("site_settings").upsert({ key: "whatsapp_number", value: whatsapp });
    setSaving(false);
    if (e1 || e2) toast.error("فشل الحفظ");
    else toast.success("تم حفظ الإعدادات");
  };

  const saveSystem = async (sys: System) => {
    setSaving(true);
    const { error } = await supabase.from("systems").update({
      name: sys.name,
      description: sys.description,
      features: sys.features,
      original_price: sys.original_price,
      price: sys.price,
    }).eq("id", sys.id);
    setSaving(false);
    if (error) toast.error("فشل الحفظ");
    else toast.success(`تم تحديث ${sys.name}`);
  };

  const updateSystem = (idx: number, patch: Partial<System>) => {
    setSystems((prev) => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-black mb-2">الإعدادات</h1>
        <p className="text-muted-foreground">تعديل محتوى الموقع</p>
      </div>

      {/* Site settings */}
      <div className="bg-gradient-card rounded-2xl p-6 border border-border/50 space-y-4">
        <h2 className="font-black text-lg">إعدادات عامة</h2>

        <div>
          <Label className="mb-2 flex items-center gap-2"><Video className="w-4 h-4" /> رابط الفيديو (YouTube embed)</Label>
          <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/embed/..." dir="ltr" />
          <p className="text-xs text-muted-foreground mt-1">استخدم رابط embed وليس watch?v=</p>
        </div>

        <div>
          <Label className="mb-2 flex items-center gap-2"><Phone className="w-4 h-4" /> رقم الواتساب (دولي بدون +)</Label>
          <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="201061067966" dir="ltr" />
        </div>

        <Button onClick={saveSettings} disabled={saving} className="bg-gradient-primary text-primary-foreground font-bold">
          {saving ? <Loader2 className="animate-spin" /> : <><Save className="w-4 h-4 ml-2" /> حفظ</>}
        </Button>
      </div>

      {/* Systems */}
      <div className="space-y-4">
        <h2 className="font-black text-lg">السيستمات والأسعار</h2>
        {systems.map((sys, i) => (
          <div key={sys.id} className="bg-gradient-card rounded-2xl p-6 border border-border/50 space-y-4">
            <div>
              <Label className="mb-2 block">اسم السيستم</Label>
              <Input value={sys.name} onChange={(e) => updateSystem(i, { name: e.target.value })} />
            </div>
            <div>
              <Label className="mb-2 block">الوصف</Label>
              <Textarea value={sys.description} onChange={(e) => updateSystem(i, { description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-2 block">السعر الأصلي</Label>
                <Input type="number" value={sys.original_price} onChange={(e) => updateSystem(i, { original_price: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="mb-2 block">سعر العرض</Label>
                <Input type="number" value={sys.price} onChange={(e) => updateSystem(i, { price: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">المميزات (سطر لكل ميزة)</Label>
              <Textarea
                value={(sys.features || []).join("\n")}
                onChange={(e) => updateSystem(i, { features: e.target.value.split("\n").filter(Boolean) })}
                rows={4}
              />
            </div>
            <Button onClick={() => saveSystem(sys)} disabled={saving} className="bg-gradient-primary text-primary-foreground font-bold">
              {saving ? <Loader2 className="animate-spin" /> : <><Save className="w-4 h-4 ml-2" /> حفظ {sys.name}</>}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSettings;
