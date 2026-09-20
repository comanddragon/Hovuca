---
name: HOVUCA Course Field Handbook
description: An editorial learning system that turns course discovery and study into a clear, dignified field handbook.
colors:
  forest: "#183b35"
  forest-deep: "#102c28"
  coral: "#d85c43"
  coral-dark: "#b84733"
  warm-gold: "#e0aa18"
  mineral-paper: "#f6f3eb"
  paper-light: "#fcfbf7"
  ink: "#193832"
  muted-ink: "#53645f"
  selected-paper: "#f0e5c5"
  reader-paper: "#f1ead8"
  white: "#ffffff"
typography:
  display:
    fontFamily: "var(--font-atkinson), Arial, sans-serif"
    fontSize: "clamp(2.8rem, 4.2vw, 4.1rem)"
    fontWeight: 700
    lineHeight: 0.94
    letterSpacing: "-0.02em"
  folio-display:
    fontFamily: "var(--font-atkinson), Arial, sans-serif"
    fontSize: "clamp(3.2rem, 5vw, 4.8rem)"
    fontWeight: 700
    lineHeight: 0.94
    letterSpacing: "-0.04em"
  body:
    fontFamily: "var(--font-atkinson), Arial, sans-serif"
    fontSize: "0.98rem"
    fontWeight: 400
    lineHeight: 1.55
  editorial-body:
    fontFamily: "var(--font-atkinson), Arial, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 700
    lineHeight: 1.62
  label:
    fontFamily: "var(--font-atkinson), Arial, sans-serif"
    fontSize: "0.68rem"
    fontWeight: 800
    lineHeight: 1.35
    letterSpacing: "0.16em"
rounded:
  square: "0px"
spacing:
  hairline-gap: "0.35rem"
  compact: "0.75rem"
  control: "0.9rem"
  gutter: "1.25rem"
  section: "1.5rem"
  rail: "2.65rem"
components:
  button-primary:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.white}"
    rounded: "{rounded.square}"
    padding: "0.9rem 1.05rem"
    height: "3.5rem"
  button-primary-hover:
    backgroundColor: "{colors.coral-dark}"
    textColor: "{colors.white}"
    rounded: "{rounded.square}"
  button-secondary:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.white}"
    rounded: "{rounded.square}"
    padding: "0.75rem 0.9rem"
  filter-selected:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.white}"
    rounded: "{rounded.square}"
    padding: "0.65rem 0.9rem"
  module-selected:
    backgroundColor: "{colors.selected-paper}"
    textColor: "{colors.forest-deep}"
    rounded: "{rounded.square}"
    padding: "0.9rem 0.65rem"
---

# Design System: HOVUCA Course Field Handbook

## Overview

**Creative North Star: "The Field Handbook"**

HOVUCA learning surfaces feel like a serious manual opened for use: calm, editorial, and humane. Deep forest anchors institutional trust; mineral paper, warm rules, numbered folios, and square geometry make dense curriculum material easy to navigate without slipping into course-marketplace or generic SaaS patterns.

The system persuades through a concise course entry, then becomes a reading environment. Documentary photography is used as an isolated, replaceable plate rather than decoration. The current `course-hero-photo.png` and `lesson-photo.png` assets are temporary local stand-ins: their final art direction, consent clearance, provenance, and visual fidelity are intentionally pending and must not be presented as approved imagery.

**Key Characteristics:**

- Editorial hierarchy built from folios, rules, contents rails, and one highly legible sans-serif family.
- Deep forest, mineral paper, coral actions, and sparing warm-gold orientation cues.
- Crisp square geometry with almost no decorative depth.
- Real course facts and access state are visible proof, never invented marketing claims.
- Dignity-led photography is isolated so plates can be replaced without disturbing layout.

## Colors

The palette is earthy and high-contrast: forest provides authority, paper keeps long-form reading warm, coral concentrates action, and gold marks orientation.

### Primary

- **Deep Forest:** The dominant masthead, navigation, selected-filter, and secondary-action color.
- **Forest Depth:** The darkest overlay and high-emphasis text color.

### Secondary

- **Action Coral:** Reserved for primary actions, folio numerals, and open-state icons.
- **Coral Shadow:** Hover state for coral actions and emphasized text links.

### Tertiary

- **Warm Gold:** A scarce navigational signal for rules, progress, folios, selection, and focus.

### Neutral

- **Mineral Paper:** The course-page ground.
- **Paper Light:** The handbook spread and sticky mobile selector.
- **Ink:** Primary copy on paper.
- **Muted Ink:** Supporting metadata and secondary explanations.
- **Selected Paper:** Active modules and rows.
- **Reader Paper:** Inline chapter-reader surface.
- **White:** Text and controls on forest or coral.

### Named Rules

**The Gold Is a Signal Rule.** Use gold for location, progress, rules, and keyboard focus—not as broad decoration.

**The Coral Is an Action Rule.** Coral identifies consequential actions and small navigational cues; it should never compete with the forest structure.

## Typography

**Unified Font:** Atkinson Hyperlegible Next (with Arial and sans-serif fallbacks)

**Character:** Atkinson Hyperlegible Next gives the whole experience UNFPA-like clarity and accessibility. Hierarchy comes from scale, weight, color, tracking, and line height rather than changing families.

### Hierarchy

- **Display:** Bold Atkinson at the largest scale, tightly tracked and balanced for masthead and catalog titles.
- **Folio Display:** Bold Atkinson for the active module title, distinguished by scale and color rather than a second face.
- **Section Headline:** Bold Atkinson at roughly 1.35–2.5rem for rail titles, chapter titles, readers, and empty states.
- **Editorial Body:** Regular Atkinson at 1.05–1.1rem with generous leading for module and chapter prose.
- **Body:** Regular Atkinson near 1rem for summaries and explanatory copy.
- **Label:** Bold uppercase Atkinson at 0.65–0.7rem with 0.12–0.18em tracking for metadata and section markers.

### Named Rules

**The One Family Rule.** Atkinson Hyperlegible Next is the only text family. Create hierarchy through size, weight, color, spacing, and line height.

## Layout

Course detail begins with a compact photographic masthead, then a full-width handbook spread capped at 96rem. At desktop, the spread uses persistent 20% / 60% / 20% columns: contents, active chapter stage, and course facts. Both rails remain sticky below the public navigation while the central reading column moves.

At 1100px and below, the layout becomes a 14rem contents rail plus reading column, with facts following beneath the reading content. At 760px and below, it becomes a single reading sequence; the module selector is a sticky, horizontally scrollable strip beneath the navigation. At 440px, catalog rows further compress to two columns and stack metadata. Mobile gutters are 1.25rem; desktop rails use 2.65rem vertical padding and fluid horizontal padding.

Catalog entries are editorial register rows, not cards. Search and level filters sit on a ruled tool shelf, followed by numbered course rows with title, excerpt, facts, and a directional arrow.

## Elevation & Depth

The system is flat by default. Tonal paper changes, fine forest rules, sticky positioning, photographic overlays, and column boundaries create depth. The only standing shadow is a restrained low forest shadow beneath the sticky mobile module selector; buttons move by 2px and rows by 0.35rem on hover without acquiring card shadows.

### Named Rules

**The Printed Page Rule.** Add hierarchy with paper tone and rules before considering shadow; shadows are structural feedback, not decoration.

## Shapes

Controls, rows, reading panels, image plates, and rails use square corners. One-pixel borders and two-pixel gold rules provide the recurring geometry. Circular forms are reserved for existing iconography outside the handbook, not introduced as chips, pills, or course badges.

## Components

### Buttons

- **Shape:** Square and full-width when attached to the course facts rail.
- **Primary:** Coral with white type, a 3.5rem minimum height, strong weight, and an arrow or completion icon.
- **Hover / Focus:** Darken to coral shadow and translate upward 2px; use a 3px gold focus outline with 4px offset. Disable motion when reduced motion is requested.
- **Secondary:** Forest fill for the inline “mark complete” action.

### Search and Filters

- **Search:** Transparent paper field with only a bottom rule and Atkinson input type; no rounded container.
- **Filters:** Compact uppercase square controls with a forest border; selected state reverses to forest and white. Preserve native `aria-pressed` state.

### Course Register Rows

- **Structure:** Folio number, subject and title, excerpt, factual metadata, and directional arrow separated by horizontal rules.
- **State:** On hover, shift the row 0.35rem and warm the paper; never lift it into an isolated card.

### Module Selector

- **Structure:** Number plus short module title in a ruled list. Selected state uses selected paper and `aria-current="page"`.
- **Responsive Behavior:** A sticky vertical contents rail on desktop becomes a sticky horizontal strip on mobile. Selection updates the active folio without hiding the course map.

### Chapter Rows and Reader

- **Rows:** Square numbered markers, chapter title, type/duration/preview metadata, and an open or locked icon. Disabled rows keep their structure and communicate access state.
- **Reader:** Opens inline on reader paper between two gold rules. Authenticated users may open preview chapters; enrolled users may open all chapters and mark completion.

### Course Facts and Progress

- **Content:** Render serializer-backed difficulty, estimated time, module count, chapter count, explicit age bands, optional instructor, cost, enrollment, and progress. Omit optional data instead of inventing it.
- **Progress:** A thin neutral track with a gold fill and a numeric percentage label.

### Navigation

- **Desktop:** Deep forest bar with white links, gold active/hover cues, and a square coral partnership action.
- **Mobile:** Compact HOVUCA wordmark plus square menu control. Keep the sticky handbook selector below this navigation layer.

## Do's and Don'ts

### Do:

- **Do** preserve the field-handbook grammar: folios, fine rules, contents navigation, paper fields, and factual side rails.
- **Do** use real serializer data and explicit access states as the course’s evidence.
- **Do** keep module selection visible and keyboard accessible across desktop and mobile.
- **Do** honor reduced-motion preferences for folio transitions, hover shifts, and loading shimmer.
- **Do** replace temporary photo plates independently, with dignity-led, consent-cleared imagery and useful alternative text.

### Don't:

- **Don't** turn courses into rounded marketplace cards, badge clouds, or dashboard-style SaaS panels.
- **Don't** invent downloadable resources, outcomes, testimonials, or course facts that the product does not supply.
- **Don't** treat the current course and lesson photos as final; image art direction and fidelity are intentionally pending.
- **Don't** use pity-led or sensational imagery of children and vulnerable communities.
- **Don't** remove age bands, authentication gates, preview rules, enrollment state, or progress in the name of visual simplification.
