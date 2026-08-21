# Route Ledger

Setu-RTN — Complete Frontend Master Prompt (Lovable)

Scope: frontend only, connecting to an existing Supabase backend (schema, RLS, and Edge Functions already built separately). Visual system below replaces any prior design direction — apply it exactly. No API keys are included in this document.

Do not use Lovable Cloud. Connect to the existing Supabase project via Settings → Connectors → Supabase → Connect existing project.

STEP 0 — CONNECTION (placeholders only, fill in your own values inside Lovable)

SUPABASE_URL=<your Supabase project URL>

SUPABASE_ANON_KEY=<your Supabase anon/public key>

MAPPLS_API_KEY=<your Mappls developer key>

Enter the URL and anon key through Lovable's Supabase connector UI, never hardcoded in source. Add MAPPLS_API_KEY as an environment variable for the map SDK. Never add the service role key anywhere in this project — all writes go through existing Edge Functions, never direct table writes from the browser.

After connecting, confirm Lovable's Supabase panel shows your real tables (route, touchpoint, vehicle, leg_event, booking, rate_tier, prediction, threepl_partner, profile). An empty auto-generated schema means the connection defaulted to Lovable Cloud — reconnect before building anything.

STEP 1 — DESIGN SYSTEM (apply exactly, use these token names in code)

Direction: premium, light-first editorial tech interface. Whitespace over components. Typography and spacing carry the hierarchy — not icons, not color, not shadows. One idea per section, nothing decorative without a functional purpose. This fits Setu-RTN specifically: a government logistics system needs to read as calm, precise, and trustworthy under judge scrutiny, not busy or decorative.

Color — exactly one accent, used only on interactive/actionable elements:

--color-bg-light: #FFFFFF;

--color-bg-light-secondary: #F2F2F4;

--color-bg-dark: #0E0F11;

--color-text-primary: #0B0B0C;

--color-text-secondary: #6E6E73;

--color-text-muted: #C5C5C5;

--color-accent: #0071E3;

--color-accent-hover: #2A8CFF;

--color-accent-pressed: #005BB5;

--color-border-light: rgba(0,0,0,0.08);

--color-border-dark: rgba(255,255,255,0.15);

--color-success: #2DD36F;

--color-warning: #FFB020;

--color-danger: #FF5A5F;

--radius-sm: 8px;

--radius-md: 12px;

--radius-lg: 16px;

--radius-pill: 9999px;

Spacing scale — every margin/padding/gap uses only these values: 4, 8, 12, 16, 24, 32, 48, 64, 96, 120px.

--color-accent appears only on: links, button borders/text, focus rings, the active nav item, and key data highlights (e.g. the currently-selected vehicle, the currently-scrubbed timestamp). It never fills icons, backgrounds, or dividers decoratively. Status colors (success/warning/danger) are used only for real states — a confidence level, a risk threshold, a validation error — never as page decoration.

Typography:

Display face: Inter Tight (headings, large numbers) — weights 500/600 only, tracking -0.02 to -0.04em.

Body face: Inter — weights 400/500, line-height 1.5–1.7, 16–18px minimum, never below 16px on mobile.

Micro-labels (status tags, timestamps, IDs): 12–13px uppercase, +0.1em tracking, --color-text-secondary.

Numeric columns (%, ₹ amounts, tonnage) use font-variant-numeric: tabular-nums so figures don't jitter across rows.

Icons: Lucide (lucide-react), one library only, fixed stroke width 1.5–2px throughout. Icons inherit current text color unless representing a status (then use the matching status color). Fixed sizes: 16px inline, 20px in buttons, 24px in nav.

Layout: 12-column grid, page max-width 1200–1400px, body text max-width 600px, margins 64–96px desktop / 20–24px mobile. Sections separated by 64–120px vertical space. One dominant element per screen — never two equally-loud focal points competing (e.g. a big number and a bold CTA at equal visual weight in the same view).

Cards: one reused card style everywhere — 1px --color-border-light border, --radius-md (12px), --color-bg-light-secondary background, 24–32px internal padding, no shadows, 2–4px hover lift maximum. Grid gap between cards: 24–32px minimum, never touching.

Buttons: one filled-solid primary CTA per page maximum; everywhere else, Primary = --color-accent border + text on transparent background, pill or --radius-sm. Secondary = plain text link with a small arrow icon. Ghost = text only, no border. Every button implements: default / hover / active / focus / disabled / loading. 12–16px vertical, 20–24px horizontal internal padding. Buttons of the same priority are the same height/padding everywhere in the app — no per-page variants.

Forms: label above field (never placeholder-only). Validate on blur, not on every keystroke. Error text sits directly under its field, same width, in --color-danger — never a toast for field-level errors. Disabled fields visibly muted. Submit buttons disable + show a loading state during submission, never allow double-submit.

Loading / empty / error states — design all three for every data view, never just the happy path:

Loading: a skeleton matching the final layout's shape, occupying the same space as the real content (no layout shift when it resolves) — never a spinner floating in empty space.

Empty: a short, plain-language line plus a primary action where relevant ("No predictions yet for this vehicle") — never a blank white area.

Error: what happened, in plain language, plus a retry action — never a raw error code alone.

Elevation: depth from spacing/borders/background contrast, not shadows. If any shadow is used at all, exactly two levels (resting, hovered), reused everywhere. Z-index scale: base content 0 · sticky nav 100 · dropdown/popover 200 · modal 300 · toast 400.

Motion: entry fade + translateY(20–30px), 400–500ms ease-out, used sparingly. Hover transitions 200–300ms, subtle only. A brief highlight state (background shifts to --color-accent at low opacity, fading back over ~800ms) marks any row/card that updates via a live subscription, so real-time changes are actually noticed — this is functional, not decorative. Respect prefers-reduced-motion; substitute a static border highlight instead of the fade. Maximum 2–3 deliberate motion moments per page.

Responsive: grid columns step 4 → 2 → 1 (desktop → tablet → mobile), not just shrinking. Nav collapses to a drawer/hamburger on mobile using the same tokens. Tables collapse to stacked cards on mobile rather than shrinking text. Minimum touch target 44×44px on mobile. Breakpoints: 375px, 768px, 1024px, 1440px.

Accessibility: WCAG AA contrast on every text/background pairing, especially accent-on-light and accent-on-dark. Visible focus rings in --color-accent on every interactive element. Full keyboard navigation.

STEP 2 — WHAT THE FRONTEND CALLS

Reads come directly from tables via the Supabase JS client (RLS-gated, safe with the anon key). Writes go through these existing Edge Functions via supabase.functions.invoke(name, {body}) — never re-implement their logic in the frontend:

submit-capacity-event

override-capacity-event

confirm-booking

create-listing

get-ulip-contract-sample

simulate-forward-capacity

explain-prediction

Display each function's actual returned error message inline, per the Forms/Error-state rules above — never substitute a generic message.

STEP 3 — AUTH & NAV

Supabase Auth (email/password), role read from the profile table (dispatcher / 3pl / directorate).

Login screen: centered card (card style from Step 1) on --color-bg-light, "Setu-RTN" in Display face, tagline "Live capacity. Real routes." in Body/secondary color beneath it. Standard email/password form following the Forms rules. Below a clear divider, a distinctly labeled secondary path: "Enter as Judge — Demo Access" as a Secondary-style button (text + arrow icon), visually separated so it never reads as a third form field.

Nav: sticky top nav, light surface fill, --color-accent for the active link and hover state. Collapses to a drawer on mobile using the same tokens. 5 role-gated links: Capacity Engine, Marketplace, Digital Twin, ULIP Contract, Predictive Panel. 3PL-role users simply don't see Capacity Engine, Digital Twin, or ULIP Contract — not shown-disabled, not present at all.

Live Ledger Strip (signature element, present on every screen): a slim horizontal strip directly beneath the nav, light background (--color-bg-light-secondary), streaming the most recent leg_event rows (vehicle registration, event type, timestamp — all in tabular-nums/micro-label styling) with a small pulsing --color-accent dot marking "live." This is functional, not decorative: it's the one element present on every screen that visibly proves all 5 features read from the same live ledger, and it's what a judge should notice a breakdown event pass through before watching it cascade into the Digital Twin and Predictive panels.

STEP 4 — SCREEN 1: Capacity Engine

Layout: fleet-overview card row at the top (one card per vehicle, reused card style) — registration, current touchpoint, current % in Display-face large numbers, and a small status dot in --color-success/--color-warning/--color-text-muted mapped to high/medium/low confidence. Below, a detail panel for the selected vehicle: a horizontal touchpoint progress track using --color-accent for the active segment, and the live-editable form to its side or below.

3 high-priority gaps, built as UI:

Judge-editable recompute with real validation. Standard form (Step 1 rules): touchpoint dropdown, weight input, event-type dropdown, submit button that disables + shows loading during the call. On success, the relevant %'s card gets the live-update highlight. On rejection, the exact returned error renders under the input in --color-danger, and any resubmission goes through a confirm modal (z-index 300).

Confidence tags + override with audit trail. Clicking a confidence dot opens a small popover (z-index 200) showing source/confidence_flag and an "Override this reading" action, which opens a confirm modal before submitting. On success, show a simple before/after list ("Ajmer: was 90%, now 94%") and an expandable accordion below the progress track listing every event for that vehicle (including superseded ones) with timestamp and entered_by, in micro-label/tabular-nums styling.

Fleet overview. The card row itself — all vehicles' live % visible at once without navigating away.

Loading/empty/error: fleet cards render as skeleton cards matching final shape while loading; if no vehicles exist yet, show "No vehicles on this route yet" with a plain-language line, no blank grid.

Demo moment: run the seeded sequence, then hand the input form to a judge.

STEP 5 — SCREEN 2: 3PL Marketplace

Layout: responsive card grid (4 → 2 → 1 columns per the grid-stepping rule), one card per listing. Each card: leg name, spare tonnage, a price breakdown line in tabular-nums ("₹12.5/tonne-km × 2t × 220km = ₹5,500"), and a status label — --color-success text for "available," --color-text-secondary for "sold" (sold is a neutral outcome, not a warning). One filled-solid primary "Buy" button per available card (this screen's one primary CTA use, per card).

3 high-priority gaps, built as UI:

Real pricing mechanism, visible as a formula, not a flat number — the price-breakdown line above.

Real synced transaction with visible feedback. "Buy" opens a confirm modal ("Confirm purchase of 2 tonnes for ₹5,500?"). On confirm, calls confirm-booking; Realtime subscription on booking triggers the highlight state on the affected card across both dispatcher and 3PL views without a refresh. On a conflict, the button is replaced with disabled text: "Already allocated to another partner."

Policy statements, always visible in a light callout strip at the top of the screen (--color-bg-light-secondary, not a tooltip): "3PL cargo is held in segregated, logged compartments per booking — not co-mingled with mail." and "Single-asset-owner capacity exchange — like an airline selling spare cargo hold space, not a two-sided freight marketplace."

Loading/empty/error: listing grid uses skeleton cards; zero available listings shows "No spare capacity currently listed" with the dispatcher's "Create Listing" action foregrounded if that role is viewing.

Demo moment: two browser tabs, dispatcher + 3PL, buy live, watch both update.

STEP 6 — SCREEN 3: Digital Twin Route Replay

Layout: full-width Mappls map with route line and vehicle marker, a horizontal scrub-bar timeline beneath it with tick marks in --color-danger (breakdown) and --color-accent (reroute — a key data highlight, not a decorative use). Vehicle selector dropdown above the map (supports both seeded vehicles). Side panel (card style) showing the current scrub position's details: capacity %, event type if any, timestamp, in tabular-nums.

3 high-priority gaps, built as UI:

Seeded breakdown scenario with markers — the colored ticks above, positioned exactly at the recorded timestamps.

Privacy-safe framing. Panel titled "Asset & Route History." Only vehicle registration, position, %, and event type are shown or queried — no driver-identity field exists in the schema or the UI.

Retention policy, visible. A micro-label caption under the scrub bar: "Full-detail replay retained 90 days, aggregated summary retained thereafter."

Demo moment: hand the scrub bar to a judge, let them rewind/replay the breakdown → reroute → 3PL allocation sequence themselves.

STEP 7 — SCREEN 4: ULIP Contract Viewer

Layout: two-column panel (stacks on mobile). Left: the one-sentence context statement in Display-medium size, then the verbatim disclaimer inside a callout box with a --color-warning left border (a real informational-notice state, not decoration). Right: the live-populated contract rendered on --color-bg-dark (the page's one sanctioned full-bleed dark section, used exactly once here) with --color-bg-light-secondary-tinted text, tabular-nums for values, clearly labeled endpoint/method/headers/request/response sections. A Secondary-style "Refresh with latest booking data" button above it.

3 high-priority gaps, built as UI:

Verbatim disclaimer, prominent: "Mocked to ULIP's exact contract shape. Ready to onboard. Not yet onboarded — real ULIP access requires registered-partner NDA."

Context sentence before the contract: "ULIP is real Government of India logistics infrastructure, already used by multiple companies, processing 100+ crore transactions."

Contract populated with live data — the request body reflects real current booking/leg/tonnage numbers from Screen 2, refreshed on demand.

Demo moment: show this screen, state plainly it's designed to plug into infrastructure that already processes over 100 crore transactions.

STEP 8 — SCREEN 5: Predictive Panel

Layout: three cards side by side (stacks 3 → 1 on mobile per the responsive rule), one per horizon (+15/+30/+60 min): predicted % in Display face, a small confidence indicator colored by risk (--color-success low risk, --color-warning medium, --color-danger above the 95% threshold), and a bulleted contributing-factors list below in Body text. A --color-danger "High risk — reassignment check triggered" badge appears on any card past threshold. Below the three cards, a "Prediction Accuracy" table (1px borders, tabular-nums) with predicted-vs-actual columns for resolved predictions.

3 high-priority gaps, built as UI:

Forward-simulation with visible reasoning basis — each card states its basis under the %, e.g. "Based on 3 pending load events and 1 scheduled unload."

Explainability — the confidence indicator + contributing-factors list per card; if the backend's explanation is unavailable (fallback case), the list shows "Explanation unavailable" rather than rendering empty.

Predicted-vs-actual accuracy table, populated from seeded resolved predictions.

This screen auto-updates (Realtime subscription or short-interval poll on prediction) with the live-update highlight when a new event is submitted elsewhere while this screen is open.

Demo moment: after the breakdown/reroute plays out on Screen 3 and capacity gets reallocated on Screen 2, show this panel's forecast shift live in response.

STEP 9 — COMPONENT BEHAVIOR REQUIREMENTS (apply uniformly, not per-screen)

Every button that triggers an Edge Function call implements the full idle → hover → focus → pressed → loading → success/error → disabled state set from Step 1, with no exceptions across the 7 functions.

Every irreversible action (confirm-booking, override-capacity-event) goes through a confirm modal before firing.

Every data view has its loading skeleton, empty state, and error state designed — not just its happy path.

Every live-updating value (Realtime or polled) uses the highlight-state motion so the update is actually noticed, not just technically synced.

Reuse one card style, one button style per priority level, one input style, and one radius per component type across all 5 screens — no page invents its own variant.

STEP 10 — THE CONTINUOUS DEMO LOOP

Capacity Engine: run/observe the seeded Ahmedabad→Ajmer→Jaipur sequence, hand the input form to a judge.

Breakdown event appears on the Live Ledger Strip → switch to Digital Twin, show it on the scrub bar.

Switch to Predictive Panel, show the risk spike and high-risk badge.

Switch to Marketplace (two tabs, dispatcher + 3PL), confirm a live purchase, watch both cards highlight and update.

Switch to ULIP Contract, show it populated with the numbers from step 4.

Return to Digital Twin, hand the scrub bar to a judge to replay the whole thing themselves.

Target: under 4 minutes, every screen reachable from the nav, no page requiring a manual refresh.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/233dfe1b-5467-491d-a082-b72c16edf6b3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
