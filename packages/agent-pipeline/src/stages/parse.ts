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

type NationalityMention = {
  nationality: string;
  index: number;
  length: number;
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

function findNationalityMentions(text: string): NationalityMention[] {
  const mentions: NationalityMention[] = [];
  for (const matcher of nationalityMatchers) {
    const match = matcher.pattern.exec(text);
    if (match && typeof match.index === "number") {
      mentions.push({ nationality: matcher.nationality, index: match.index, length: (match[0] ?? "").length });
    }
  }

  mentions.sort((a, b) => a.index - b.index);
  const deduped: NationalityMention[] = [];
  for (const mention of mentions) {
    if (!deduped.some((value) => value.nationality === mention.nationality)) {
      deduped.push(mention);
    }
  }

  return deduped;
}

function pickBestNationality(scores: Map<string, number>, excluded = new Set<string>()): string | undefined {
  let winner: string | undefined;
  let bestScore = 0;

  for (const [nationality, score] of scores.entries()) {
    if (excluded.has(nationality)) continue;
    if (score > bestScore) {
      bestScore = score;
      winner = nationality;
    }
  }

  return winner;
}

function scoreMentionRoles(text: string, mentions: NationalityMention[], locationNationality?: string): {
  actorScores: Map<string, number>;
  targetScores: Map<string, number>;
  negatedActorNationalities: Set<string>;
} {
  const lower = text.toLowerCase();
  const actorScores = new Map<string, number>();
  const targetScores = new Map<string, number>();
  const negatedActorNationalities = new Set<string>();

  for (const mention of mentions) {
    const before = lower.slice(Math.max(0, mention.index - 36), mention.index).trimEnd();
    const after = lower.slice(mention.index + mention.length, mention.index + mention.length + 40).trimStart();

    actorScores.set(mention.nationality, actorScores.get(mention.nationality) ?? 0);
    targetScores.set(mention.nationality, targetScores.get(mention.nationality) ?? 0);

    // Do not assign actor when attribution is explicitly negated.
    if (/\b(?:not|no evidence(?:\s+it\s+was)?|was(?:\s+)?not|wasn't)\s+(?:from|by|launched from|launched by|attributed to)\s*$/i.test(before)) {
      negatedActorNationalities.add(mention.nationality);
    }

    if (/\b(?:from|by|launched by|fired by|claimed by|attributed to|blamed on)\s*$/i.test(before)) {
      actorScores.set(mention.nationality, (actorScores.get(mention.nationality) ?? 0) + 3);
    }

    if (/^(?:launched|launches|fired|fires|struck|strikes|attacked|attacks|bombed|targeted|intercepted|intercepts|downed)\b/i.test(after)) {
      actorScores.set(mention.nationality, (actorScores.get(mention.nationality) ?? 0) + 2);
    }

    if (/\b(?:on|in|at|near|off(?:\s+the)?\s+coast\s+of|against|toward|towards)\s*$/i.test(before)) {
      targetScores.set(mention.nationality, (targetScores.get(mention.nationality) ?? 0) + 3);
    }

    if (locationNationality && mention.nationality === locationNationality) {
      targetScores.set(mention.nationality, (targetScores.get(mention.nationality) ?? 0) + 1);
    }
  }

  for (const nationality of negatedActorNationalities) {
    actorScores.set(nationality, -999);
  }

  return { actorScores, targetScores, negatedActorNationalities };
}

function inferActorAndTarget(text: string, eventType: "strike" | "intercept", locationNationality?: string): {
  actorNationality?: string;
  targetNationality?: string;
} {
  const mentions = findNationalityMentions(text);
  if (mentions.length === 0) {
    return locationNationality ? { targetNationality: locationNationality } : {};
  }

  const mentionNationalities = mentions.map((mention) => mention.nationality);
  const { actorScores, targetScores, negatedActorNationalities } = scoreMentionRoles(text, mentions, locationNationality);

  let actorNationality = pickBestNationality(actorScores);
  let targetNationality = pickBestNationality(targetScores, new Set(actorNationality ? [actorNationality] : []));

  if (eventType === "intercept" && mentionNationalities.length >= 2 && !actorNationality) {
    const interceptBy = /(?:intercept|shot down|downed)\s+by\s+/i.test(text);
    if (interceptBy) {
      actorNationality = mentionNationalities[1];
      targetNationality = mentionNationalities[0];
    } else {
      actorNationality = mentionNationalities.find((nationality) => !negatedActorNationalities.has(nationality));
    }
  }

  if (!targetNationality && mentionNationalities.length >= 2) {
    targetNationality = mentionNationalities.find((nationality) => nationality !== actorNationality);
  }

  // For intercept events, location mentions (e.g. "over Iraq") should not override the intercepted actor.
  if (eventType === "intercept" && actorNationality && mentionNationalities.length >= 2) {
    const fallbackInterceptTarget = mentionNationalities.find((nationality) => nationality !== actorNationality);
    const chosenTargetScore = targetNationality ? targetScores.get(targetNationality) ?? 0 : 0;
    if (fallbackInterceptTarget && chosenTargetScore <= 1) {
      targetNationality = fallbackInterceptTarget;
    }
  }

  // Favor location as target when target is unresolved.
  if (!targetNationality) {
    if (locationNationality && locationNationality !== actorNationality) {
      targetNationality = locationNationality;
    }
  }

  // Single mention fallback: only assign actor when not explicitly negated.
  if (!actorNationality && mentionNationalities.length === 1) {
    const onlyMention = mentionNationalities[0];
    if (!negatedActorNationalities.has(onlyMention) && onlyMention !== targetNationality) {
      actorNationality = onlyMention;
    }
  }

  // Avoid self actor-target assignment unless no better fallback exists.
  if (actorNationality && targetNationality && actorNationality === targetNationality) {
    targetNationality = locationNationality && locationNationality !== actorNationality ? locationNationality : undefined;
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
