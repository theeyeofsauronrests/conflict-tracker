# UI Walkthrough

This walkthrough explains each visible part of Conflict Tracker in simple terms.

## Screen layout

The app is split into two main areas:

- Left: map, timeline, and legend
- Right: detail drawer for selected events

## Timeline slider (top-left)

Label: `Timeline window (hours)`

What it does:

- Controls how far back events appear on the map
- Lower value = only very recent events
- Higher value = broader historical view

When to use it:

- 24h for daily review
- 72h+ for short trend analysis

## Map area (center-left)

What you see:

- Event-specific icons (missile, drone, intercept, unknown target)
- Force and asset positions (delayed public view)
- Spatial distribution across the region

How to interact:

- Click an event icon to open details
- Pan and zoom to inspect local clusters
- Hovering a clickable entity changes the cursor so you can tell it is interactive

Tip:

- If the map feels crowded, reduce timeline window first.

## Legend (below map)

What it does:

- Shows nationality color mapping
- Helps you quickly separate actors visually

Use it for:

- Fast attribution scanning
- Pattern checks by actor grouping

## Detail drawer (right panel)

What appears after clicking an event:

- Event type (`STRIKE` or `INTERCEPT`)
- Matching event icon (same icon family used on the map)
- Confidence percentage
- Event time
- Raw report text

## Local analyst note field

Inside the detail drawer there is a text area:

- `Local analyst note (browser-only)`

Important behavior:

- Notes are saved in your browser only
- Notes are not uploaded to the database
- Notes stay tied to the selected event key

Use it for:

- Verification status
- Contradictions
- Follow-up tasks

## Suggested analysis flow in UI

1. Set timeline to your target window.
2. Scan clusters and outliers on the map.
3. Click events with highest relevance.
4. Read details and source text.
5. Add short local notes.
6. Repeat after next ingest cycle.

## If something looks wrong

- No events visible:
  - Run `pnpm ingest`
  - Refresh browser
- Events look old:
  - Increase timeline window
- Missing notes:
  - Confirm same browser and same event selected
