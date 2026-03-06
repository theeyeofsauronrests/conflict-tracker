import type { AgentStage } from "../types";
import type { ParsedSignal } from "../types";
import type { RssItem } from "@conflict-tracker/data-model";

function classifyEventType(text: string): "strike" | "intercept" {
  // Keep this simple and transparent for now: keyword-based routing.
  return /intercept/i.test(text) ? "intercept" : "strike";
}

const locationHints: Array<{ pattern: RegExp; lon: number; lat: number; nationality?: string }> = [
  { pattern: /\btehran\b/i, lon: 51.389, lat: 35.6892, nationality: "iran" },
  { pattern: /\bisfahan\b/i, lon: 51.6776, lat: 32.6546, nationality: "iran" },
  { pattern: /\btabriz\b/i, lon: 46.2919, lat: 38.0962, nationality: "iran" },
  { pattern: /\blebanon\b|\bbeirut\b/i, lon: 35.5018, lat: 33.8938, nationality: "lebanon" },
  { pattern: /\bcyprus\b|\bnicosia\b/i, lon: 33.3823, lat: 35.1856, nationality: "cyprus" },
  { pattern: /\bbaghdad\b/i, lon: 44.3661, lat: 33.3152, nationality: "iraq" },
  { pattern: /\berbil\b/i, lon: 44.0106, lat: 36.1911, nationality: "iraq" },
  { pattern: /\biraq\b/i, lon: 43.6793, lat: 33.2232, nationality: "iraq" },
  { pattern: /\buae\b|\bunited arab emirates\b|\babu dhabi\b|\bdubai\b/i, lon: 54.3773, lat: 24.4539, nationality: "uae" },
  { pattern: /\bkuwait\b/i, lon: 47.9783, lat: 29.3759, nationality: "kuwait" },
  { pattern: /\bsaudi\b|\bsaudi arabia\b|\briyadh\b/i, lon: 46.6753, lat: 24.7136, nationality: "saudi arabia" },
  { pattern: /\bsri lanka\b|\bcolombo\b/i, lon: 79.8612, lat: 6.9271, nationality: "sri lanka" },
  { pattern: /\boman\b|\bmuscat\b/i, lon: 58.4059, lat: 23.588, nationality: "oman" },
  { pattern: /\bqatar\b|\bdoha\b/i, lon: 51.531, lat: 25.2854, nationality: "qatar" },
  { pattern: /\bbahrain\b|\bmanama\b/i, lon: 50.5832, lat: 26.2235, nationality: "bahrain" },
  { pattern: /\byemen\b|\baden\b|\bsanaa\b|\bhouthi\b/i, lon: 44.191, lat: 15.3694, nationality: "yemen" },
  { pattern: /\bjordan\b|\bamman\b/i, lon: 35.9304, lat: 31.9539, nationality: "jordan" },
  { pattern: /\bturkey\b|\bankara\b/i, lon: 32.8597, lat: 39.9334, nationality: "turkey" },
  { pattern: /\bgaza\b|\bpalestin/i, lon: 34.4668, lat: 31.5018, nationality: "palestinian" },
  { pattern: /\bashdod\b/i, lon: 34.6553, lat: 31.8044, nationality: "israel" },
  { pattern: /\bhaifa\b/i, lon: 34.9896, lat: 32.794, nationality: "israel" },
  { pattern: /\bsyria\b|\bdamascus\b/i, lon: 36.2765, lat: 33.5138, nationality: "syria" }
];

function inferPoint(text: string): { lon: number; lat: number; locationNationality?: string } {
  for (const hint of locationHints) {
    if (hint.pattern.test(text)) {
      return { lon: hint.lon, lat: hint.lat, locationNationality: hint.nationality };
    }
  }

  // Fallback keeps unknown reports near the main Iran theater.
  return { lon: 53.688, lat: 32.4279 };
}

type NatMatcher = {
  nationality: string;
  pattern: RegExp;
};

const nationalityMatchers: NatMatcher[] = [
  { nationality: "iran", pattern: /\biran(ian)?\b|\btehran\b|\birgc\b/i },
  { nationality: "israel", pattern: /\bisrael(i)?\b|\bidf\b|\btel aviv\b/i },
  { nationality: "usa", pattern: /\bu\.?s\.?a?\.?\b|\bunited states\b|\bamerican\b|\bpentagon\b/i },
  { nationality: "iraq", pattern: /\biraq(i)?\b|\bbaghdad\b|\berbil\b/i },
  { nationality: "lebanon", pattern: /\bleban(on|ese)\b|\bhezbollah\b/i },
  { nationality: "saudi arabia", pattern: /\bsaudi\b|\bksa\b|\briyadh\b/i },
  { nationality: "uae", pattern: /\buae\b|\bunited arab emirates\b|\babu dhabi\b|\bdubai\b/i },
  { nationality: "kuwait", pattern: /\bkuwait(i)?\b/i },
  { nationality: "syria", pattern: /\bsyria(n)?\b|\bdamascus\b/i },
  { nationality: "turkey", pattern: /\bturkey\b|\bturkish\b|\bankara\b/i },
  { nationality: "jordan", pattern: /\bjordan(ian)?\b|\bamman\b/i },
  { nationality: "yemen", pattern: /\byemen(i)?\b|\bhouthi\b/i },
  { nationality: "qatar", pattern: /\bqatar(i)?\b|\bdoha\b/i },
  { nationality: "bahrain", pattern: /\bbahrain(i)?\b|\bmanama\b/i },
  { nationality: "oman", pattern: /\boman(i)?\b|\bmuscat\b/i },
  { nationality: "cyprus", pattern: /\bcyprus\b|\bcypriot\b|\bnicosia\b/i },
  { nationality: "palestinian", pattern: /\bpalestin(ian|e)?\b|\bgaza\b|\bhamas\b/i }
];

function findMentionedNationalities(text: string): string[] {
  const mentions: Array<{ nationality: string; index: number }> = [];
  for (const matcher of nationalityMatchers) {
    const match = matcher.pattern.exec(text);
    if (match && typeof match.index === "number") {
      mentions.push({ nationality: matcher.nationality, index: match.index });
    }
  }

  mentions.sort((a, b) => a.index - b.index);
  const deduped: string[] = [];
  for (const mention of mentions) {
    if (!deduped.includes(mention.nationality)) {
      deduped.push(mention.nationality);
    }
  }

  return deduped;
}

function inferActorAndTarget(text: string, eventType: "strike" | "intercept", locationNationality?: string): {
  actorNationality?: string;
  targetNationality?: string;
} {
  const mentions = findMentionedNationalities(text);
  if (mentions.length === 0) {
    return locationNationality ? { targetNationality: locationNationality } : {};
  }

  // First mention is usually the actor in simple OSINT headline grammar.
  let actorNationality = mentions[0];
  let targetNationality = mentions[1];

  // Intercepts usually have clear "X intercepts Y" wording, so prefer that order.
  if (eventType === "intercept" && mentions.length >= 2) {
    const interceptBy = /(?:intercept|shot down|downed)\s+by\s+/i.test(text);
    if (interceptBy) {
      actorNationality = mentions[1];
      targetNationality = mentions[0];
    }
  }

  // One mention is still useful: keep that entity as actor, and use location as target when possible.
  if (!targetNationality) {
    if (locationNationality && locationNationality !== actorNationality) {
      targetNationality = locationNationality;
    }
    return { actorNationality, targetNationality };
  }

  if (!actorNationality && locationNationality && locationNationality !== targetNationality) {
    actorNationality = locationNationality;
  }

  return { actorNationality, targetNationality };
}

export function parseRssItem(item: RssItem): ParsedSignal {
  const mergedText = `${item.title} ${item.text}`;
  const point = inferPoint(mergedText);
  const eventType = classifyEventType(mergedText);
  const attribution = inferActorAndTarget(mergedText, eventType, point.locationNationality);

  return {
    rss: item,
    eventType,
    eventTime: item.publishedAt,
    rawText: item.text,
    lon: point.lon,
    lat: point.lat,
    actorNationality: attribution.actorNationality,
    targetNationality: attribution.targetNationality
  };
}

export function createParseStage(): AgentStage {
  return {
    id: "parse",
    run: async (ctx) => {
      // Local-only parse path with deterministic heuristics and no external model calls.
      ctx.parsed = ctx.rssItems.map(parseRssItem);
      return ctx;
    }
  };
}
