import { supabase } from "@/integrations/supabase/client";

const VISITOR_KEY = "alshbh_vid";
const ONE_YEAR = 60 * 60 * 24 * 365;

const readCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
};

const writeCookie = (name: string, value: string) => {
  if (typeof document === "undefined") return;
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${ONE_YEAR}; Path=/; SameSite=Lax${secure}`;
};

const generateId = () =>
  (crypto as any)?.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

/**
 * Stable visitor ID across tabs and reopens on the same browser.
 * Source of truth = cookie (1y). localStorage is mirrored as a fallback
 * in case cookies are blocked. The two are reconciled so that all tabs
 * converge on the same id.
 */
export const getSessionId = (): string => {
  const cookieId = readCookie(VISITOR_KEY);
  const lsId = typeof localStorage !== "undefined" ? localStorage.getItem(VISITOR_KEY) : null;

  let id = cookieId || lsId;
  if (!id) id = generateId();

  if (cookieId !== id) writeCookie(VISITOR_KEY, id);
  if (lsId !== id) {
    try { localStorage.setItem(VISITOR_KEY, id); } catch {}
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
