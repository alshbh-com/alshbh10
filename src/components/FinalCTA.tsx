import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

export const FinalCTA = ({ onCTA }: { onCTA: () => void }) => (
  <section className="py-16">
    <div className="container">
      <div className="max-w-3xl mx-auto bg-gradient-primary rounded-3xl p-8 sm:p-12 text-center shadow-glow relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent)]" />
        <div className="relative">
          <Clock className="w-12 h-12 text-primary-foreground mx-auto mb-4" />
          <h2 className="text-2xl sm:text-4xl font-black text-primary-foreground mb-3">
            العرض لمدة 48 ساعة فقط
          </h2>
          <p className="text-primary-foreground/90 mb-6 text-lg">احجز قبل انتهاء الوقت</p>
          <Button
            size="lg"
            onClick={onCTA}
            className="bg-background text-foreground hover:bg-background/90 font-bold text-lg px-8 py-6 rounded-full"
          >
            احجز الآن قبل ما يخلص
          </Button>
        </div>
      </div>
    </div>
  </section>
);
