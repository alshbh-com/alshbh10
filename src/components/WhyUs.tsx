import { Zap, Headphones, MousePointerClick, TrendingUp } from "lucide-react";

const items = [
  { icon: Zap, title: "سرعة التنفيذ", desc: "تشغيل فوري خلال 24 ساعة" },
  { icon: Headphones, title: "دعم فني 24/7", desc: "فريق دعم متاح طول الوقت" },
  { icon: MousePointerClick, title: "سهولة الاستخدام", desc: "واجهة بسيطة بدون تعقيدات" },
  { icon: TrendingUp, title: "قابل للتطوير", desc: "بيكبر مع نمو بيزنسك" },
];

export const WhyUs = () => (
  <section className="py-16 sm:py-24">
    <div className="container">
      <div className="text-center mb-12 animate-fade-up">
        <h2 className="text-3xl sm:text-5xl font-black mb-4">
          ليه <span className="text-gradient">الشبح</span>؟
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
        {items.map((item, i) => (
          <div
            key={i}
            className="bg-gradient-card rounded-2xl p-6 text-center hover:shadow-glow transition-smooth animate-fade-up border border-border/50"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
              <item.icon className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-bold mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
