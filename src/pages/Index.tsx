import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { VideoSection } from "@/components/VideoSection";
import { SystemsSection } from "@/components/SystemsSection";
import { WhyUs } from "@/components/WhyUs";
import { LeadForm } from "@/components/LeadForm";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";

const Index = () => {
  const formRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    track("page_view", { oncePerSession: true });
  }, []);

  const scrollToForm = (slug?: string) => {
    if (slug) setSelected(slug);
    track("form_open", { systemSlug: slug, oncePerSession: true });
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero onCTA={() => scrollToForm()} />
        <VideoSection />
        <SystemsSection onSelect={scrollToForm} />
        <WhyUs />
        <LeadForm ref={formRef} selected={selected} />
        <FinalCTA onCTA={() => scrollToForm()} />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
