import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface System {
  id: string;
  slug: string;
  name: string;
  icon: string;
}
interface Proof {
  id: string;
  system_slug: string;
  image_url: string;
  caption: string | null;
}

export const ProofsSection = () => {
  const [systems, setSystems] = useState<System[]>([]);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("systems").select("id,slug,name,icon").order("display_order"),
      supabase.from("system_proofs").select("*").order("display_order"),
    ]).then(([s, p]) => {
      if (s.data) setSystems(s.data as any);
      if (p.data) setProofs(p.data as any);
    });
  }, []);

  const slugsWithProofs = new Set(proofs.map((p) => p.system_slug));
  const visibleSystems = systems.filter((s) => slugsWithProofs.has(s.slug));
  if (visibleSystems.length === 0) return null;

  const activeProofs = proofs.filter((p) => p.system_slug === activeSlug);

  return (
    <section id="proofs" className="py-16 sm:py-24">
      <div className="container">
        <div className="text-center mb-10 animate-fade-up">
          <div className="inline-flex items-center gap-2 text-primary mb-4">
            <Star className="w-5 h-5" />
            <span className="text-sm font-semibold">إثباتات حقيقية</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black mb-3">
            آراء <span className="text-gradient">عملائنا</span>
          </h2>
          <p className="text-muted-foreground">اختار المنتج وشوف إثباتات العملاء</p>
        </div>

        {!activeSlug ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {visibleSystems.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSlug(s.slug)}
                className="group bg-gradient-card rounded-2xl p-6 glow-border hover:shadow-glow transition-smooth text-right"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black">{s.name}</h3>
                  <span className="text-xs text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {proofs.filter((p) => p.system_slug === s.slug).length} إثبات
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">اضغط لعرض الإثباتات</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black">
                إثباتات {systems.find((s) => s.slug === activeSlug)?.name}
              </h3>
              <Button variant="outline" onClick={() => setActiveSlug(null)} size="sm">
                ← رجوع
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {activeProofs.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setLightbox(p.image_url)}
                  className="relative aspect-[9/16] rounded-xl overflow-hidden glow-border bg-black group"
                >
                  <img
                    src={p.image_url}
                    alt={p.caption || "إثبات عميل"}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                  />
                  {p.caption && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-xs text-white line-clamp-2">{p.caption}</p>
                    </div>
                  )}
                </button>
              ))}
              {activeProofs.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-8">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  لا توجد إثباتات بعد
                </div>
              )}
            </div>
          </div>
        )}

        <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
          <DialogContent className="max-w-md p-2 bg-black border-primary/30">
            {lightbox && (
              <img src={lightbox} alt="إثبات" className="w-full h-auto rounded-lg" />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};
