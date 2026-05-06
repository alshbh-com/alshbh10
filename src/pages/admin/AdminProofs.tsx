import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Upload, Trash2, Image as ImageIcon } from "lucide-react";

interface System { id: string; slug: string; name: string; }
interface Proof { id: string; system_slug: string; image_url: string; caption: string | null; display_order: number; }

const AdminProofs = () => {
  const [systems, setSystems] = useState<System[]>([]);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [captions, setCaptions] = useState<Record<string, string>>({});

  const load = async () => {
    const [s, p] = await Promise.all([
      supabase.from("systems").select("id,slug,name").order("display_order"),
      supabase.from("system_proofs").select("*").order("display_order"),
    ]);
    if (s.data) setSystems(s.data as any);
    if (p.data) setProofs(p.data as any);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (slug: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("الحد الأقصى 10 ميجا"); return; }
    setUploadingFor(slug);
    const ext = file.name.split(".").pop();
    const path = `${slug}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("proofs").upload(path, file, {
      cacheControl: "3600", upsert: false, contentType: file.type,
    });
    if (upErr) { setUploadingFor(null); toast.error("فشل الرفع: " + upErr.message); return; }
    const { data } = supabase.storage.from("proofs").getPublicUrl(path);
    const { error } = await supabase.from("system_proofs").insert({
      system_slug: slug,
      image_url: data.publicUrl,
      caption: captions[slug] || null,
      display_order: proofs.filter((p) => p.system_slug === slug).length,
    });
    setUploadingFor(null);
    if (error) toast.error("فشل الحفظ");
    else { toast.success("تم رفع الإثبات ✓"); setCaptions((c) => ({ ...c, [slug]: "" })); load(); }
  };

  const remove = async (p: Proof) => {
    if (!confirm("حذف هذا الإثبات؟")) return;
    await supabase.from("system_proofs").delete().eq("id", p.id);
    // best-effort remove from storage
    try {
      const idx = p.image_url.indexOf("/proofs/");
      if (idx > -1) {
        const objectPath = p.image_url.substring(idx + "/proofs/".length);
        await supabase.storage.from("proofs").remove([objectPath]);
      }
    } catch {}
    toast.success("تم الحذف");
    load();
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-black mb-2">الإثباتات</h1>
        <p className="text-muted-foreground">ارفع سكرين لكل منتج (آراء العملاء)</p>
      </div>

      {systems.map((s) => {
        const items = proofs.filter((p) => p.system_slug === s.slug);
        return (
          <div key={s.id} className="bg-gradient-card rounded-2xl p-6 border border-border/50 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-lg">{s.name}</h2>
              <span className="text-xs text-muted-foreground">{items.length} إثبات</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="mb-2 block text-sm">تعليق (اختياري)</Label>
                <Input
                  value={captions[s.slug] || ""}
                  onChange={(e) => setCaptions((c) => ({ ...c, [s.slug]: e.target.value }))}
                  placeholder="مثال: عميل من القاهرة"
                />
              </div>
              <div>
                <Label className="mb-2 flex items-center gap-2 text-sm"><Upload className="w-4 h-4" /> رفع سكرين</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(s.slug, e)}
                  disabled={uploadingFor === s.slug}
                />
                {uploadingFor === s.slug && <p className="text-xs text-muted-foreground mt-1">جاري الرفع...</p>}
              </div>
            </div>

            {items.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
                {items.map((p) => (
                  <div key={p.id} className="relative aspect-[9/16] rounded-lg overflow-hidden bg-black border border-border/50">
                    <img src={p.image_url} alt={p.caption || ""} className="w-full h-full object-cover" />
                    <Button
                      onClick={() => remove(p)}
                      size="icon"
                      variant="destructive"
                      className="absolute top-1 left-1 w-7 h-7"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {items.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-4">
                <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" /> لا توجد إثباتات بعد
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AdminProofs;
