import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PlayCircle } from "lucide-react";

export const VideoSection = () => {
  const [videoUrl, setVideoUrl] = useState<string>("");

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "video_url")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) setVideoUrl(data.value);
      });
  }, []);

  return (
    <section className="py-16 sm:py-24">
      <div className="container">
        <div className="text-center mb-10 animate-fade-up">
          <div className="inline-flex items-center gap-2 text-primary mb-4">
            <PlayCircle className="w-5 h-5" />
            <span className="text-sm font-semibold">شاهد بنفسك</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black">
            شوف <span className="text-gradient">السيستم</span> شغال
          </h2>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative aspect-video rounded-2xl overflow-hidden glow-border bg-card shadow-card-soft">
            {videoUrl ? (
              <iframe
                src={videoUrl}
                title="عرض السيستم"
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-card">
                <PlayCircle className="w-20 h-20 text-primary opacity-50" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
