---
version: alpha
name: S3Vectors-console-design
description: A dark-mode, data-dense admin console for AWS S3 Vectors. The system borrows the engineering-grade density of a database UI — near-black canvas, a single luminous cyan accent for actions and focus, and a stepladder of slate surfaces for tables, code viewers, and sidebar chrome. AWS orange appears only as a brand signature on the app logo/wordmark, never as a functional accent. The console is always dark; there is no light mode.

colors:
  primary: "#22d3ee"
  primary-active: "#06b6d4"
  primary-disabled: "#164e63"
  on-primary: "#0b0f14"
  brand-aws: "#ff9900"
  ink: "#f0f4f8"
  body: "#cbd5e1"
  muted: "#94a3b8"
  muted-soft: "#64748b"
  hairline: "#1e293b"
  hairline-strong: "#334155"
  canvas: "#0b0f14"
  surface-soft: "#0f172a"
  surface-card: "#151e2e"
  surface-elevated: "#1e293b"
  surface-primary-band: "#22d3ee"
  on-dark: "#f0f4f8"
  on-dark-muted: "#94a3b8"
  accent-emerald: "#22c55e"
  accent-rose: "#ef4444"
  accent-amber: "#f59e0b"
  accent-blue: "#3b82f6"
  success: "#22c55e"
  warning: "#f59e0b"
  error: "#ef4444"
  info: "#3b82f6"

typography:
  display-xl:
    fontFamily: "Inter, sans-serif"
    fontSize: 56px
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: -2px
  display-lg:
    fontFamily: "Inter, sans-serif"
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -1.5px
  display-md:
    fontFamily: "Inter, sans-serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -1px
  display-sm:
    fontFamily: "Inter, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.5px
  title-lg:
    fontFamily: "Inter, sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0
  title-md:
    fontFamily: "Inter, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  title-sm:
    fontFamily: "Inter, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  stat-display:
    fontFamily: "Inter, sans-serif"
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: -1px
  body-md:
    fontFamily: "Inter, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  body-sm:
    fontFamily: "Inter, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  caption:
    fontFamily: "Inter, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  caption-uppercase:
    fontFamily: "Inter, sans-serif"
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 1px
  code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  button:
    fontFamily: "Inter, sans-serif"
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0
  nav-link:
    fontFamily: "Inter, sans-serif"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 10px 18px
    height: 36px
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  button-primary-disabled:
    backgroundColor: "{colors.primary-disabled}"
    textColor: "{colors.muted-soft}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.on-dark}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 10px 18px
    height: 36px
  button-secondary-active:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.md}"
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.on-dark}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: 8px 12px
  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "#ffffff"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 10px 18px
    height: 36px
  button-danger-active:
    backgroundColor: "#b91c1c"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
  button-text-link:
    backgroundColor: transparent
    textColor: "{colors.on-dark}"
    typography: "{typography.button}"
  text-link:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
  button-icon-circular:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.full}"
    size: 32px
  top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.on-dark}"
    typography: "{typography.nav-link}"
    height: 56px
  sidebar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.on-dark-muted}"
    typography: "{typography.nav-link}"
    width: 240px
    borderRight: "1px solid {colors.hairline}"
  sidebar-item-active:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    borderLeft: "3px solid {colors.primary}"
  sidebar-item-hover:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
  page-header:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.display-sm}"
    padding: "{spacing.md} {spacing.lg}"
    borderBottom: "1px solid {colors.hairline}"
  page-toolbar:
    backgroundColor: "{colors.canvas}"
    padding: "{spacing.sm} {spacing.lg}"
    borderBottom: "1px solid {colors.hairline}"
  content-panel:
    backgroundColor: "{colors.canvas}"
    padding: "{spacing.lg}"
  card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    border: "1px solid {colors.hairline}"
  card-elevated:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    border: "1px solid {colors.hairline-strong}"
  code-window-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.on-dark}"
    typography: "{typography.code}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  json-viewer-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.on-dark}"
    typography: "{typography.code}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  empty-state-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.muted}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xxl}"
    border: "1px dashed {colors.hairline-strong}"
  error-banner:
    backgroundColor: "rgba(239, 68, 68, 0.12)"
    textColor: "{colors.error}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
    border: "1px solid rgba(239, 68, 68, 0.35)"
  warning-banner:
    backgroundColor: "rgba(245, 158, 11, 0.12)"
    textColor: "{colors.warning}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
    border: "1px solid rgba(245, 158, 11, 0.35)"
  info-banner:
    backgroundColor: "rgba(59, 130, 246, 0.12)"
    textColor: "{colors.info}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
    border: "1px solid rgba(59, 130, 246, 0.35)"
  text-input:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 9px 12px
    height: 36px
  text-input-focused:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.md}"
  textarea:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.on-dark}"
    typography: "{typography.code}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
  search-pill:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 9px 12px
    height: 36px
    border: "1px solid {colors.hairline}"
  category-tab:
    backgroundColor: transparent
    textColor: "{colors.muted}"
    typography: "{typography.nav-link}"
    rounded: "{rounded.md}"
    padding: 8px 14px
  category-tab-active:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.on-dark}"
    typography: "{typography.nav-link}"
    rounded: "{rounded.md}"
  segmented-tab:
    backgroundColor: transparent
    textColor: "{colors.muted}"
    typography: "{typography.title-sm}"
    padding: "{spacing.sm} {spacing.md}"
    border: "0 0 2px transparent solid"
  segmented-tab-active:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.title-sm}"
    border: "0 0 2px {colors.primary} solid"
  badge-pill:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.on-dark}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 3px 10px
  badge-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption-uppercase}"
    rounded: "{rounded.pill}"
    padding: 3px 10px
  badge-success:
    backgroundColor: "rgba(34, 197, 94, 0.16)"
    textColor: "{colors.success}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 3px 10px
  badge-warning:
    backgroundColor: "rgba(245, 158, 11, 0.16)"
    textColor: "{colors.warning}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 3px 10px
  badge-error:
    backgroundColor: "rgba(239, 68, 68, 0.16)"
    textColor: "{colors.error}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 3px 10px
  data-table:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
    border: "1px solid {colors.hairline}"
  data-table-header:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.caption-uppercase}"
    borderBottom: "1px solid {colors.hairline-strong}"
  data-table-row:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    borderBottom: "1px solid {colors.hairline}"
  data-table-row-hover:
    backgroundColor: "{colors.surface-soft}"
  data-table-row-selected:
    backgroundColor: "rgba(34, 211, 238, 0.08)"
  data-table-cell:
    padding: "{spacing.sm} {spacing.md}"
    height: 48px
  pagination:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.muted}"
    typography: "{typography.body-sm}"
    padding: "{spacing.sm} 0"
  stat-callout:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.stat-display}"
  confirm-dialog:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
    shadow: "0 24px 64px rgba(0, 0, 0, 0.5)"
  confirm-dialog-overlay:
    backgroundColor: "rgba(0, 0, 0, 0.65)"
  cta-band-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.display-md}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
  footer:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.muted-soft}"
    typography: "{typography.body-sm}"
    padding: "{spacing.md} {spacing.lg}"
    borderTop: "1px solid {colors.hairline}"
---

## Overview

S3Vectors Console is a browser-based admin interface for AWS S3 Vectors. It is a single-page application that is **always dark**. The visual foundation is a deep blue-black canvas (`{colors.canvas}` — #0b0f14) with a stepladder of slate surfaces (`{colors.surface-soft}`, `{colors.surface-card}`, `{colors.surface-elevated}`) used for sidebar selection, table hover, cards, and code viewers. The single functional accent is **Vector Cyan** (`{colors.primary}` — #22d3ee) — it handles primary actions, focus rings, active tab underlines, selected row tints, and key stat callouts. AWS Orange (`{colors.brand-aws}` — #ff9900) appears only on the app logo/wordmark as a brand signature; it is never used for buttons, badges, or focus states.

The console is **data-dense by default**. Tables dominate every list view, code viewers expose JSON policies and vector payloads, and the Query Console is centered on a SQL-like query experience with JSON results. Shadows are minimal; hierarchy is carried by surface lift and 1px hairline borders. Inter runs every UI label, button, and table cell; JetBrains Mono handles code, IDs, ARNs, and vector values.

**Key Characteristics:**
- Always-dark admin console (`{colors.canvas}` — #0b0f14).
- Single functional accent: Vector Cyan (`{colors.primary}` — #22d3ee).
- AWS Orange (`{colors.brand-aws}`) reserved for logo/wordmark only.
- Four-step surface ladder (canvas → surface-soft → surface-card → surface-elevated) for hierarchy.
- Data-dense tables with 48px rows, compact 36px buttons, and 36px inputs.
- Code/JSON viewers in JetBrains Mono inside `{colors.surface-card}` panels.
- Hairline borders, not shadows, define separation.
- Confirm dialogs for every destructive operation; error banners surface AWS SDK error names.

## Colors

> Source: adapted from ClickHouse database UI conventions; re-branded for S3Vectors console.

### Brand & Accent
- **Primary (Vector Cyan)** (`{colors.primary}` — #22d3ee): Primary buttons, focus rings, active tabs, selected table rows, stat callouts, inline action links.
- **Primary Active** (`{colors.primary-active}` — #06b6d4): Pressed/hovered primary buttons.
- **Primary Disabled** (`{colors.primary-disabled}` — #164e63): Disabled primary button background.
- **Brand AWS** (`{colors.brand-aws}` — #ff9900): Logo/wordmark accent only. Not used for functional UI.

### Surface
- **Canvas** (`{colors.canvas}` — #0b0f14): Page floor and sidebar background.
- **Surface Soft** (`{colors.surface-soft}` — #0f172a): Hovered/selected sidebar item, table row hover, subtle band backgrounds.
- **Surface Card** (`{colors.surface-card}` — #151e2e): Cards, inputs, code viewers, table panel background when framed.
- **Surface Elevated** (`{colors.surface-elevated}` — #1e293b): Confirm dialogs, dropdown menus, lifted panels.
- **Surface Primary Band** (`{colors.surface-primary-band}` — #22d3ee): Same hex as primary; used for full-bleed CTA bands only.
- **Hairline** (`{colors.hairline}` — #1e293b): 1px borders on cards, tables, dividers.
- **Hairline Strong** (`{colors.hairline-strong}` — #334155): Stronger borders for table headers, focused inputs, emphasized separators.

### Text
- **Ink** (`{colors.ink}` — #f0f4f8): Headlines, active nav labels, emphasized body.
- **Body** (`{colors.body}` — #cbd5e1): Default body and table cell text.
- **Muted** (`{colors.muted}` — #94a3b8): Secondary meta, captions, placeholders.
- **Muted Soft** (`{colors.muted-soft}` — #64748b): Disabled, footer, tertiary meta.
- **On Primary / On Dark** (`{colors.on-primary}` / `{colors.on-dark}` — #0b0f14 / #f0f4f8): Text on primary buttons and dark surfaces.
- **On Dark Muted** (`{colors.on-dark-muted}` — #94a3b8): Reduced-opacity text on dark surfaces.

### Semantic / Accent
- **Success** (`{colors.success}` — #22c55e): Healthy status, connection-test success, success banners.
- **Warning** (`{colors.warning}` — #f59e0b): CORS warnings, validation warnings, warning banners.
- **Error** (`{colors.error}` — #ef4444): Delete buttons, error banners, failed connection tests, validation errors.
- **Info** (`{colors.info}` — #3b82f6): Informational callouts, endpoint-help notes.
- **Accent Emerald / Rose / Amber / Blue**: Same as semantic set; reserved for status badges and syntax highlighting.

## Typography

### Font Family
The console runs **Inter** for all UI chrome, labels, tables, and buttons. **JetBrains Mono** handles code, JSON, ARNs, vector IDs, and metric values. Fallback stacks:
- Inter: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.
- JetBrains Mono: `ui-monospace, SF Mono, Menlo, Consolas, monospace`.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 56px | 700 | 1.05 | -2px | Marketing-style empty-state hero only |
| `{typography.display-lg}` | 40px | 700 | 1.10 | -1.5px | Dashboard total/hero metric |
| `{typography.display-md}` | 32px | 700 | 1.15 | -1px | Page title in standalone views |
| `{typography.display-sm}` | 24px | 700 | 1.20 | -0.5px | Page header title inside console |
| `{typography.title-lg}` | 20px | 600 | 1.30 | 0 | Card titles, dialog titles |
| `{typography.title-md}` | 16px | 600 | 1.40 | 0 | Section headings, form group labels |
| `{typography.title-sm}` | 14px | 600 | 1.40 | 0 | Table column headers, tab labels |
| `{typography.stat-display}` | 40px | 700 | 1.00 | -1px | Dashboard metric values |
| `{typography.body-md}` | 14px | 400 | 1.55 | 0 | Default body, input text, buttons |
| `{typography.body-sm}` | 13px | 400 | 1.55 | 0 | Table cells, metadata, captions |
| `{typography.caption}` | 12px | 500 | 1.40 | 0 | Badges, small labels |
| `{typography.caption-uppercase}` | 11px | 600 | 1.40 | 1px | Table header labels, overline tags |
| `{typography.code}` | 13px | 400 | 1.55 | 0 | JSON, policy text, vector arrays |
| `{typography.button}` | 13px | 600 | 1.00 | 0 | All button labels |
| `{typography.nav-link}` | 13px | 500 | 1.40 | 0 | Sidebar and top-bar links |

### Principles
- Display weights stay at 700; negative tracking keeps headlines tight.
- Body and labels stay at 400 / 500 / 600. Hierarchy is built on size and weight, not family contrast.
- Mono is for machine-readable data only: vector IDs, ARNs, JSON, policies, query payloads.
- Console UI is compact: default button/input height is 36px, table row height is 48px.

## Layout

### Spacing System
- **Base unit:** 4px.
- **Tokens:** `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 96px.
- **Console padding:** `{spacing.lg}` (24px) inside main content panels.
- **Toolbar padding:** `{spacing.sm}` vertical, `{spacing.lg}` horizontal.
- **Card internal padding:** `{spacing.lg}` (24px) for standard cards; `{spacing.md}` (16px) for code viewers.
- **Table cell padding:** `{spacing.sm}` vertical (12px), `{spacing.md}` horizontal (16px).

### Grid & Container
- **App shell:** 240px fixed left sidebar; remaining width is the main stage.
- **Main stage:** single-column flow with `{spacing.lg}` gaps between cards.
- **Page header:** full width, 56px height, 1px bottom border.
- **Page toolbar:** full width, sits directly below header.
- **Dashboard grid:** 3-column card grid at desktop, 2 at tablet, 1 at mobile.
- **Tables:** full-width inside `{colors.surface-card}` panel with 1px border; horizontal scroll on overflow.

### Whitespace Philosophy
The dark canvas is the whitespace. Panels lift onto `{colors.surface-card}` to group related controls. Between panels, `{spacing.lg}` (24px) is the standard gap. The console avoids atmospheric gradients; density and alignment create rhythm.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 (flat) | No shadow, no border | Body sections, sidebar background |
| 1 (hairline lift) | 1px `{colors.hairline}` border | Cards, tables, code viewers |
| 2 (surface lift) | `{colors.surface-card}` background + hairline | Inputs, dropdowns, selected sidebar |
| 3 (elevated) | `{colors.surface-elevated}` background + stronger border | Confirm dialogs, modals, menus |
| 4 (focus ring) | 2px `{colors.primary}` outline at 50% opacity | Focused inputs, focused buttons, keyboard navigation |

The console uses almost no drop shadows. The only exception is the confirm dialog, which uses a deep scrim + shadow to separate it from the data surface below.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 4px | Small chips, status badges, tag pills |
| `{rounded.sm}` | 6px | Ghost buttons, small inline buttons |
| `{rounded.md}` | 8px | Standard buttons, text inputs, search pills, banners, tabs |
| `{rounded.lg}` | 12px | Cards, code viewers, confirm dialogs, CTA bands |
| `{rounded.pill}` | 9999px | Status badges, filter pills |
| `{rounded.full}` | 9999px / 50% | Circular icon buttons, avatars |

## Components

### App Chrome

**`top-nav`** — 56px bar pinned to the top of the app shell. Background `{colors.canvas}`, 1px bottom border in `{colors.hairline}`. Left: S3Vectors wordmark (AWS orange dot + white text). Center-left: breadcrumb or page subtitle. Right: global connection-status badge + Settings icon button.

**`sidebar`** — 240px fixed left rail. Background `{colors.canvas}`, 1px right border in `{colors.hairline}`. Items stacked vertically with 40px height. Inactive: `{colors.on-dark-muted}` text. Hover: `{colors.surface-soft}` background. Active: `{colors.surface-soft}` background, `{colors.ink}` text, 3px left border in `{colors.primary}`. Primary nav items: Dashboard, Vector Buckets, Query Console, Settings. Drill-down context items (current bucket/index) appear indented below Vector Buckets when relevant.

**`page-header`** — Full-width bar below top nav. Left: page title in `{typography.display-sm}`; right: primary action button(s). 1px bottom border in `{colors.hairline}`.

**`page-toolbar`** — Full-width strip below page header. Holds search, filters, and secondary actions. 1px bottom border in `{colors.hairline}`.

### Buttons

**`button-primary`** — Vector Cyan CTA. Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button}`, padding 10px × 18px, height 36px, rounded `{rounded.md}`. Used for create, save, run query, and connection test actions.

**`button-primary-active`** — Pressed state darkens to `{colors.primary-active}`.

**`button-primary-disabled`** — Muted dark-cyan background `{colors.primary-disabled}`, text `{colors.muted-soft}`.

**`button-secondary`** — Charcoal surface button. Background `{colors.surface-card}`, text `{colors.on-dark}`. Used for secondary actions: cancel, refresh, export.

**`button-secondary-active`** — Background lifts to `{colors.surface-elevated}`.

**`button-ghost`** — Transparent background for low-priority actions inside tables or cards.

**`button-danger`** — Rose delete action. Background `{colors.error}`, white text. Used only inside confirm dialogs and table-row delete affordances.

**`button-text-link`** — Inline text button for "Sign out" or "Clear filters".

**`text-link`** — Inline body link in `{colors.primary}`.

**`button-icon-circular`** — 32px circular icon button on dark surface. Used for row actions, copy-to-clipboard, expand JSON.

### Inputs & Forms

**`text-input`** — Dark input. Background `{colors.surface-card}`, text `{colors.on-dark}`, rounded `{rounded.md}`, padding 9px × 12px, height 36px, 1px `{colors.hairline}` border. Focus: 2px `{colors.primary}` outline.

**`textarea`** — Same surface as text-input but uses `{typography.code}` for JSON/policy payloads.

**`search-pill`** — Compact search bar. Background `{colors.surface-card}`, placeholder `{colors.muted}`, rounded `{rounded.md}`, height 36px, 1px `{colors.hairline}` border, search icon left.

### Tabs

**`category-tab`** + **`category-tab-active`** — Pill-style tabs for coarse filters (e.g., "All / Active / Failed"). Inactive: transparent + muted text. Active: `{colors.surface-card}` background + `{colors.on-dark}` text.

**`segmented-tab`** + **`segmented-tab-active`** — Underline tabs for page-level switching (e.g., Bucket detail: Indexes / Policy). Inactive: muted text. Active: `{colors.primary}` text + 2px bottom border in `{colors.primary}`.

### Badges & Status

**`badge-pill`** — Neutral dark pill for counts and metadata.

**`badge-primary`** — Cyan pill for "New" or featured status.

**`badge-success`** / **`badge-warning`** / **`badge-error`** — Soft semantic pills for status values: healthy, warning, error.

### Tables

**`data-table`** — Full-width table inside a `{colors.surface-card}` panel with 1px `{colors.hairline}` border and `{rounded.lg}` corners. Text `{typography.body-sm}`.

**`data-table-header`** — Row background `{colors.surface-soft}`, text `{colors.ink}` in `{typography.caption-uppercase}`, bottom border `{colors.hairline-strong}`.

**`data-table-row`** — Background `{colors.canvas}`, bottom border `{colors.hairline}`. Hover: `{colors.surface-soft}`. Selected: rgba cyan tint.

**`data-table-cell`** — Vertical padding 12px, horizontal 16px, row height 48px.

**`pagination`** — Compact row below table: total count left, page size selector + prev/next + page numbers right.

### Code & JSON

**`code-window-card`** — Dark card for SQL-like query text or code snippets. Background `{colors.surface-card}`, type `{typography.code}`, rounded `{rounded.lg}`, padding `{spacing.md}`. Syntax highlighting uses the accent palette: cyan for keywords, emerald for strings, amber for numbers, rose for errors, blue for keys.

**`json-viewer-card`** — Same container as code-window-card but specialized for JSON payloads (policies, vector metadata, query results). Includes copy-to-clipboard icon and optional collapse/expand controls.

### Feedback

**`error-banner`** — Full-width or inline banner. Background `rgba(239, 68, 68, 0.12)`, text `{colors.error}`, 1px border `rgba(239, 68, 68, 0.35)`, rounded `{rounded.md}`. Shows AWS SDK error name + human-readable message + dismiss button.

**`warning-banner`** — Same structure as error banner with `{colors.warning}`.

**`info-banner`** — Same structure with `{colors.info}`.

### Empty & Loading

**`empty-state-card`** — Centered card with dashed border for empty lists. Background `{colors.surface-card}`, text `{colors.muted}`, rounded `{rounded.lg}`, padding `{spacing.xxl}`. Includes an icon + primary action.

Loading states use `{colors.surface-soft}` skeleton blocks with a subtle pulse; no custom loading component token is needed.

### Dialogs

**`confirm-dialog`** — Centered modal. Background `{colors.surface-elevated}`, rounded `{rounded.lg}`, padding `{spacing.xl}`, deep shadow. Title in `{typography.title-lg}`, description in `{typography.body-md}`, danger item name highlighted in `{colors.error}`, primary action button (danger or primary) + cancel button.

**`confirm-dialog-overlay`** — Scrim `rgba(0, 0, 0, 0.65)`.

### CTA / Footer

**`cta-band-primary`** — Full-bleed cyan band for onboarding empty states. Background `{colors.primary}`, text `{colors.on-primary}`.

**`footer`** — Compact status bar at the bottom of the sidebar or main stage. Background `{colors.canvas}`, text `{colors.muted-soft}`, 1px top border.

## Do's and Don'ts

### Do
- Use `{colors.canvas}` (#0b0f14) as the permanent page floor.
- Reserve `{colors.primary}` (Vector Cyan) for functional emphasis: primary buttons, focus rings, active tabs, selected rows.
- Use AWS Orange (`{colors.brand-aws}`) only in the logo/wordmark.
- Use the four-step surface ladder for hierarchy; avoid skipping levels.
- Show machine-readable data (ARNs, vector IDs, JSON, policies) in JetBrains Mono.
- Use tables with search + pagination for every list view.
- Show a friendly error banner with the AWS SDK error name when an API call fails.
- Confirm every destructive operation in a `{component.confirm-dialog}`.
- Keep buttons and inputs compact (36px height) to preserve data density.

### Don't
- Don't ship a light-mode variant.
- Don't use `{colors.brand-aws}` for buttons, badges, or focus states.
- Don't introduce a second functional accent color.
- Don't use drop shadows except inside `{component.confirm-dialog}`.
- Don't replace table rows with cards for list views.
- Don't show raw AWS errors without the error name and a human-readable prefix.
- Don't allow destructive actions without a typed or named confirmation.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 768px | Sidebar collapses to hamburger; tables horizontally scroll; cards stack 1-up |
| Tablet | 768–1024px | Sidebar stays fixed but narrows to 200px; dashboard 2-up |
| Desktop | 1024–1440px | Full 240px sidebar; dashboard 3-up; tables full width |
| Wide | > 1440px | Same layout with more outer margin; max content scales with viewport |

### Touch Targets
- Primary/secondary buttons: 36px height, 44px minimum touch target.
- Icon buttons: 32px visual size, 44px touch target.
- Table rows: 48px height.
- Form inputs: 36px height, 44px touch target.
- Sidebar items: 40px height.

### Collapsing Strategy
- **Sidebar** collapses to a hamburger drawer below 768px.
- **Page header** actions move to a single primary + overflow menu on narrow screens.
- **Tables** retain column layout; horizontal scroll inside the card panel rather than stacking.
- **Dashboard cards** reduce 3 → 2 → 1 columns.
- **Confirm dialogs** become full-screen sheets below 480px.

### Code / JSON Behavior
- Code viewers keep fixed font size; horizontal scroll on overflow.
- JSON viewers collapse deeply nested objects by default on mobile.

## Iteration Guide

1. Focus on ONE component at a time and reference it by its `components:` token name.
2. When adding a page, decide first which surface level each region lives on.
3. Default body text to `{typography.body-md}`; table cells to `{typography.body-sm}`.
4. Run `npx @google/design.md lint DESIGN.md` after edits.
5. Add new variants as separate component entries (`-active`, `-disabled`, `-hover`, `-selected`).
6. Keep Vector Cyan scarce at the element level but consistent at the action level.
7. Every list view leads with a search + table + pagination trio.

## Known Gaps

- Animation and transition timings are not formalized; recommend 150ms ease for hover/focus, 200ms for dialogs.
- Form validation success/error states beyond banners and disabled buttons are not fully extracted.
- Specific syntax-highlighting token mapping for JSON/SQL is described but not formalized as a sub-token set.
- The AWS S3 Vectors service iconography set is not included; use Lucide or Heroicons with `{colors.on-dark-muted}` fill.
- Drag-and-drop or resizable column widths are out of scope for the initial console.
