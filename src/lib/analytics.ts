import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "analytics_session_id";

export const getSessionId = (): string => {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
};

const sentOncePerSession = new Set<string>();

export type AnalyticsEvent =
  | "page_view"
  | "video_play"
  | "form_open"
  | "form_submit"
  | "form_abandon"
  | "whatsapp_click";

interface TrackOptions {
  systemSlug?: string;
  metadata?: Record<string, any>;
  oncePerSession?: boolean;
}

export const track = async (event: AnalyticsEvent, opts: TrackOptions = {}) => {
  try {
    const dedupeKey = opts.oncePerSession
      ? `${event}:${opts.systemSlug || "_"}`
      : null;
    if (dedupeKey) {
      if (sentOncePerSession.has(dedupeKey)) return;
      sentOncePerSession.add(dedupeKey);
    }
    await supabase.from("analytics_events").insert({
      event_type: event,
      session_id: getSessionId(),
      system_slug: opts.systemSlug || null,
      metadata: opts.metadata || {},
      user_agent: navigator.userAgent,
    });
  } catch (e) {
    // silent fail
  }
};
