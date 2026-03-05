# Use Cases

These are practical ways OSINT analysts can use Conflict Tracker.

## 1) Morning activity review

Goal: Quickly understand what happened overnight.

Workflow:

1. Run `pnpm ingest`.
2. Open the map.
3. Set timeline to the last 24 hours.
4. Click high-confidence events and read source text.
5. Add local note for events that need follow-up.

Output:

- A short list of notable strikes/intercepts for the day.

## 2) Incident triage

Goal: Decide which events deserve deeper verification.

Workflow:

1. Filter visually by time window.
2. Prioritize events with stronger confidence and clearer sources.
3. Check geography for clustering near key areas.
4. Save your judgment in the local note box.

Output:

- Ranked event queue for deeper source validation.

## 3) Pattern spotting over multiple days

Goal: Identify possible escalation patterns.

Workflow:

1. Ingest fresh data.
2. Move timeline slider from 24h to 72h or 168h.
3. Compare density and location shifts.
4. Review repeated areas or repeated event types.

Output:

- Early warning observations about trend direction.

## 4) Team handoff preparation

Goal: Prepare clean context for another analyst.

Workflow:

1. Review selected events in detail drawer.
2. Keep concise local notes explaining why each event matters.
3. Export/share findings through your team’s normal reporting channel.

Output:

- Clear handoff summary with event-level context.

## 5) Training and practice

Goal: Train new analysts on basic map-first OSINT workflows.

Workflow:

1. Use seeded data (`pnpm seed`) if live ingest is unavailable.
2. Practice identifying event type, location, and confidence.
3. Compare analyst notes between trainees.

Output:

- Faster onboarding for new analysts.

## Good analyst habits in this tool

- Treat every item as a lead, not final truth.
- Use source links and timestamps before drawing conclusions.
- Write short notes with rationale, not just opinions.
- Re-check after the next ingest cycle for updates.
