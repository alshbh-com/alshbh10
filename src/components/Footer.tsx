import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Ghost } from "lucide-react";

export const Footer = () => {
  const [whatsapp, setWhatsapp] = useState("201061067966");

  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "whatsapp_number").maybeSingle()
      .then(({ data }) => { if (data?.value) setWhatsapp(data.value); });
  }, []);

  return (
    <footer className="border-t border-border py-10 mt-16">
      <div className="container flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Ghost className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-black text-gradient">شركة الشبح</span>
        </div>

        <a
          href={`https://wa.me/${whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-success/10 border border-success/40 text-success font-bold hover:bg-success/20 transition-smooth"
        >
          <MessageCircle className="w-5 h-5" />
          تواصل معنا واتساب
        </a>

        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} alshbh - جميع الحقوق محفوظة</p>
      </div>

      {/* Floating WhatsApp */}
      <a
        href={`https://wa.me/${whatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-success flex items-center justify-center shadow-glow animate-pulse-glow hover:scale-110 transition-smooth"
        aria-label="WhatsApp"
      >
        <MessageCircle className="w-7 h-7 text-success-foreground" />
      </a>
    </footer>
  );
};
