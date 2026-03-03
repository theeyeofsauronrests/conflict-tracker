import OpenAI from "openai";
import type { AgentStage } from "../types";
import type { ParsedSignal } from "../types";

function classifyEventType(text: string): "strike" | "intercept" {
  // Keep this simple and transparent for now: keyword-based routing.
  return /intercept/i.test(text) ? "intercept" : "strike";
}

export function createParseStage(openaiApiKey?: string): AgentStage {
  return {
    id: "parse",
    run: async (ctx) => {
      if (!openaiApiKey) {
        // Local fallback path so pipeline still works without model access.
        ctx.parsed = ctx.rssItems.map((item) => ({
          rss: item,
          eventType: classifyEventType(item.text),
          eventTime: item.publishedAt,
          rawText: item.text,
          lon: 35.2137,
          lat: 31.7683
        }));
        return ctx;
      }

      // Model-assisted extraction path for richer signal parsing.
      const client = new OpenAI({ apiKey: openaiApiKey });
      const parsed: ParsedSignal[] = [];
      for (const item of ctx.rssItems) {
        const completion = await client.responses.create({
          model: "gpt-4.1-mini",
          input: [
            {
              role: "system",
              content: "Extract OSINT event_type(strike|intercept), event_time ISO8601, lon, lat from text."
            },
            { role: "user", content: `${item.title}\n${item.text}` }
          ],
          temperature: 0
        });
        const output = completion.output_text;
        // Keep coordinate extraction forgiving; pipeline normalizes later.
        const matched = output.match(/(-?\d+\.\d+).+(-?\d+\.\d+)/s);
        parsed.push({
          rss: item,
          eventType: classifyEventType(output),
          eventTime: item.publishedAt,
          rawText: item.text,
          lon: matched ? Number(matched[1]) : 35.2137,
          lat: matched ? Number(matched[2]) : 31.7683
        });
      }
      ctx.parsed = parsed;
      return ctx;
    }
  };
}
