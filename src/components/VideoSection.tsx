import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

export const VideoSection = () => {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoFile, setVideoFile] = useState<string>("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
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

  const handleOpen = () => {
    setOpen(true);
    track("video_play", { oncePerSession: true });
  };

  return (
    <section className="py-16 sm:py-24">
      <div className="container">
        <div className="text-center mb-10 animate-fade-up">
          <div className="inline-flex items-center gap-2 text-primary mb-4">
            <PlayCircle className="w-5 h-5" />
            <span className="text-sm font-semibold">شاهد بنفسك</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black mb-6">
            شوف <span className="text-gradient">السيستم</span> شغال
          </h2>

          {!open && (
            <Button
              size="lg"
              onClick={handleOpen}
              disabled={!hasVideo}
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground font-bold rounded-full px-8 py-6 shadow-glow"
            >
              <PlayCircle className="w-6 h-6 ml-2" />
              {hasVideo ? "شغّل الفيديو" : "الفيديو غير متاح حالياً"}
            </Button>
          )}
        </div>

        {open && (
          <div className={useFile ? "max-w-sm mx-auto" : "max-w-4xl mx-auto"}>
            <div
              className={`relative rounded-2xl overflow-hidden glow-border bg-black shadow-card-soft ${
                useFile ? "aspect-[9/16]" : "aspect-video"
              }`}
            >
              {useFile ? (
                <video
                  src={videoFile}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 w-full h-full object-contain bg-black"
                />
              ) : (
                <iframe
                  src={videoUrl + (videoUrl.includes("?") ? "&" : "?") + "autoplay=1"}
                  title="عرض السيستم"
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
