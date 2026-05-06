import { Countdown } from "./Countdown";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft } from "lucide-react";

export const Hero = ({ onCTA }: { onCTA: () => void }) => {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24">
      {/* Background orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[120px] -z-10" />

      <div className="container relative">
        <div className="max-w-4xl mx-auto text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">عرض محدود لمدة 3 أيام</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black mb-6 leading-tight">
            ابدأ بيزنسك أونلاين بـ
            <br />
            <span className="text-gradient">2000 جنيه بس</span>
          </h1>

          <p className="text-lg sm:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            أنظمة جاهزة تشغلك فوراً بدون أي خبرة تقنية
          </p>

          <div className="flex flex-col items-center gap-8">
            <Button
              size="lg"
              onClick={onCTA}
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground font-bold text-lg px-10 py-7 rounded-full shadow-glow animate-pulse-glow group"
            >
              احجز العرض الآن
              <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-smooth" />
            </Button>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">العرض ينتهي خلال:</p>
              <Countdown />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
