import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Truck, ShoppingBag, Users, Package, Check } from "lucide-react";

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

  useEffect(() => {
    supabase
      .from("systems")
      .select("*")
      .order("display_order")
      .then(({ data }) => {
        if (data) setSystems(data as any);
      });
  }, []);

  return (
    <section id="systems" className="py-16 sm:py-24 relative">
      <div className="container">
        <div className="text-center mb-12 animate-fade-up">
          <h2 className="text-3xl sm:text-5xl font-black mb-4">
            اختار <span className="text-gradient">السيستم</span> اللي يناسبك
          </h2>
          <p className="text-muted-foreground text-lg">3 أنظمة احترافية جاهزة للتشغيل الفوري</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {systems.map((sys, i) => {
            const Icon = iconMap[sys.icon] || Package;
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
                <p className="text-muted-foreground mb-5 text-sm">{sys.description}</p>

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

                <div className="border-t border-border pt-5 mt-auto">
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="text-3xl font-black text-gradient">{sys.price}</span>
                    <span className="text-sm text-muted-foreground line-through">{sys.original_price}</span>
                    <span className="text-sm text-muted-foreground">جنيه</span>
                  </div>

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
    </section>
  );
};
