import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Truck, ShoppingBag, Users, Package, Check, PlayCircle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { track } from "@/lib/analytics";

interface System {
  id: string;
  slug: string;
  name: string;
  description: string;
  features: string[];
  original_price: number;
  price: number;
  icon: string;
}

const iconMap: Record<string, any> = {
  truck: Truck,
  "shopping-bag": ShoppingBag,
  users: Users,
  package: Package,
};

export const SystemsSection = ({ onSelect }: { onSelect: (slug: string) => void }) => {
  const [systems, setSystems] = useState<System[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState("");
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("systems")
      .select("*")
      .order("display_order")
      .then(({ data }) => {
        if (data) setSystems(data as any);
      });
    supabase
      .from("site_settings")
      .select("key,value")
      .in("key", ["video_url", "video_file_url"])
      .then(({ data }) => {
        if (!data) return;
        setVideoUrl(data.find((d) => d.key === "video_url")?.value || "");
        setVideoFile(data.find((d) => d.key === "video_file_url")?.value || "");
      });
  }, []);

  const useFile = !!videoFile;
  const hasVideo = useFile || !!videoUrl;

  const openVideo = () => {
    setVideoOpen(true);
    track("video_play", { systemSlug: "shipping", oncePerSession: true });
  };

  return (
    <section id="systems" className="py-16 sm:py-24 relative">
      <div className="container">
        <div className="text-center mb-12 animate-fade-up">
          <h2 className="text-3xl sm:text-5xl font-black mb-4">
            اختار <span className="text-gradient">السيستم</span> اللي يناسبك
          </h2>
          <p className="text-muted-foreground text-lg">أنظمة احترافية جاهزة للتشغيل الفوري</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {systems.map((sys, i) => {
            const Icon = iconMap[sys.icon] || Package;
            const isShipping = sys.slug === "shipping";
            return (
              <div
                key={sys.id}
                className="group relative bg-gradient-card rounded-2xl p-7 glow-border hover:shadow-glow transition-smooth animate-fade-up flex flex-col"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-5 shadow-elegant group-hover:scale-110 transition-smooth">
                  <Icon className="w-7 h-7 text-primary-foreground" />
                </div>

                <h3 className="text-2xl font-black mb-2">{sys.name}</h3>
                <p className="text-muted-foreground mb-5 text-sm whitespace-pre-line">{sys.description}</p>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {(sys.features || []).map((f, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-primary" />
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-border pt-5 mt-auto space-y-3">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black text-gradient">{sys.price}</span>
                    <span className="text-sm text-muted-foreground line-through">{sys.original_price}</span>
                    <span className="text-sm text-muted-foreground">جنيه</span>
                  </div>

                  {isShipping && hasVideo && (
                    <Button
                      onClick={openVideo}
                      variant="outline"
                      className="w-full font-bold rounded-xl border-primary/40 hover:bg-primary/10"
                    >
                      <PlayCircle className="w-5 h-5 ml-2" />
                      شاهد الفيديو
                    </Button>
                  )}

                  <Button
                    onClick={() => onSelect(sys.slug)}
                    className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-bold rounded-xl"
                  >
                    احجز الآن
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
        <DialogContent className={`p-2 bg-black border-primary/30 ${useFile ? "max-w-sm" : "max-w-3xl"}`}>
          <div className={`relative w-full overflow-hidden rounded-lg ${useFile ? "aspect-[9/16]" : "aspect-video"}`}>
            {videoOpen && useFile ? (
              <video
                src={videoFile}
                controls
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-contain bg-black"
              />
            ) : videoOpen ? (
              <iframe
                src={videoUrl + (videoUrl.includes("?") ? "&" : "?") + "autoplay=1"}
                title="عرض السيستم"
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};
