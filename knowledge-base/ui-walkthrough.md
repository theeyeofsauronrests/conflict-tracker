# UI Walkthrough

This walkthrough explains each visible part of Conflict Tracker in simple terms.

## Screen layout

The app is split into two main areas:

- Left: map, timeline, and legend
- Right: detail drawer for selected events

## Timeline slider (top-left)

Label: `Timeline window (records-bounded)`

What it does:

- Uses one timeline track with a draggable selected window
- Drag the window body to move across time
- Drag the window edges to resize start/end bounds
- Updates map events immediately as you drag
- Shows Start and End timestamps explicitly in local time
- Only allows ranges where records exist (based on available event timestamps)
- Includes a `Show actor-to-target arcs` toggle if you want a quieter map view

When to use it:

- Tight window for rapid triage
- Wider window for trend comparison across recent days

## Map area (center-left)

What you see:

- Event-specific icons (missile, drone, intercept, unknown target)
- Event icon location is always the target impact location for that report
- Optional curved pulsing arcs connect actor nation anchor points to target event icons
- Spatial distribution across the region

How to interact:

- Click an event icon to open details
- Pan and zoom to inspect local clusters
- Click a cluster count bubble to open a modal list of all events in that cluster
- Click any row in the cluster modal to open that event in the detail panel
- Hovering a clickable entity changes the cursor so you can tell it is interactive
- Scroll and pinch gestures over the map are captured by the map area so the browser page does not zoom unexpectedly

Tip:

- If the map feels crowded, move the start bound closer to the end bound.

## Legend (below map)

What it does:

- Shows nationality color mapping
- Shows actor/target match highlight rings when an event is selected
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
- Local bookmark toggle for quick revisit

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

## Bookmarks (browser-only)

You can bookmark events without sending anything to the database:

- In map detail drawer, click `Bookmark event`
- In table view, use the star column to add/remove bookmarks
- Use `Bookmarked only` in table filters to focus your short list

Important behavior:

- Bookmarks are stored in your browser only
- Bookmarks are tied to event dedupe keys
- Bookmarks do not sync between different browsers/devices

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
- Too many unknown actor/target fields:
  - Run `pnpm ingest:reparse`
- Events look old:
  - Move the end bound toward the newest records
- Missing notes:
  - Confirm same browser and same event selected
