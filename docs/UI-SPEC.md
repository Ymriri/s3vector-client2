# S3Vectors Console — UI Specification

A page-by-page layout spec for the AWS S3 Vectors admin console. All pages follow the design tokens in `DESIGN.md`: dark canvas, Vector Cyan primary accent, data-dense tables, JetBrains Mono for code/JSON, and confirm dialogs for every destructive action.

---

## Global patterns

### App shell
- **Layout:** fixed 240px left sidebar (`{components.sidebar}`) + fluid main stage. Top nav (`{components.top-nav}`) is 56px and spans the full width above the shell.
- **Sidebar nav items:** Dashboard, Vector Buckets, Query Console, Settings.
- **Active state:** `{components.sidebar-item-active}` — left cyan border, lifted surface.
- **Drill-down context:** when viewing a bucket or index, the bucket/index name appears as an indented sub-item under Vector Buckets with a subtle muted label.
- **Footer region:** compact status bar at the bottom of the sidebar showing connection status and SDK region if configured.

### Error banner pattern
Every page uses the same `{components.error-banner}` pattern:
- Triggered by any rejected AWS SDK call or invalid local state.
- Shows the AWS error name (e.g., `CredentialsProviderError`, `NoSuchBucket`, `NetworkingError`) in `{typography.title-sm}`.
- Shows a human-readable sentence in `{typography.body-md}`.
- Includes a **Dismiss** text button on the right.
- If the error is CORS-related, the banner includes a secondary link to the documented proxy escape hatch.
- Sticky below the page header so it remains visible during scroll.

### Loading state pattern
- Page-level loading: a `{colors.surface-soft}` skeleton block replacing the main table or card content with a subtle pulse animation.
- Inline loading: a 16px cyan spinner next to the triggering button or table footer.
- Skeleton rows match the table row height (48px) so the layout does not jump when data arrives.

### Empty state pattern
- For list pages: `{components.empty-state-card}` centered inside the table panel with an icon, a one-line explanation, and a primary create action.
- For detail pages: an empty card with dashed border and a call-to-action (e.g., "No indexes yet — create one").

### Destructive-op confirm pattern
All destructive actions (delete bucket, delete index, delete vectors, overwrite policy) open a `{components.confirm-dialog}`:
- Title in `{typography.title-lg}`: "Delete {resource type}?"
- Body in `{typography.body-md}`: explains the action and names the affected resource in `{colors.error}`.
- Requires the user to click the danger button; no typed confirmation is required for the console scope.
- Cancel is the default/left button; the danger action is right-aligned.
- The danger button uses `{components.button-danger}`.
- On confirm, the dialog closes, an inline spinner appears on the danger button, and the table refreshes. On failure, the dialog stays open and the error is shown inside the dialog footer as `{components.error-banner}`.

---

## 1. Dashboard

### Layout
- **Page header:** title "Dashboard" left, connection-test button right.
- **Content:** a 3-column card grid (`{spacing.lg}` gap) at desktop.
- **Cards:**
  1. **Buckets summary card** — total bucket count (`{typography.stat-display}`), healthy/error badge, quick link to Vector Buckets.
  2. **Indexes summary card** — total index count across all buckets, per-bucket breakdown if ≤5 buckets else "N buckets".
  3. **Vectors summary card** — estimated total vector count (sum of `Index.VectorCount` if available), fallback "—" if the API does not expose counts.
- **Bottom row:** a `{components.info-banner}` explaining that credentials are stored locally and never sent to a server.

### Components
- `{components.card}` for summary tiles.
- `{components.badge-success}` / `{components.badge-error}` for connection status.
- `{components.button-secondary}` for "Refresh".
- `{components.button-primary}` for "Test connection".
- `{components.info-banner}` for the local-storage notice.

### States
- **Loading:** three skeleton cards.
- **Empty/No credentials:** a single `{components.card-elevated}` with a CTA to open Settings and configure credentials.
- **Error:** `{components.error-banner}` below the page header; cards show "—".
- **Data:** cards render with live counts and status badges.

---

## 2. Bucket list page

### Layout
- **Page header:** title "Vector Buckets" left, `{components.button-primary}` "Create bucket" right.
- **Page toolbar:** `{components.search-pill}` placeholder "Search buckets…" left; `{components.category-tab}` filters (All / With policy / Without policy) right.
- **Main panel:** `{components.data-table}` inside a `{components.card}` panel.
- **Table columns:** Name, ARN, Created, Indexes count, Policy status, Actions.
- **Actions column:** row buttons — View, Delete (icon-only trash).
- **Footer:** `{components.pagination}` below the table.

### Components
- `{components.page-header}`, `{components.page-toolbar}`.
- `{components.search-pill}`, `{components.category-tab}`.
- `{components.data-table}`, `{components.data-table-header}`, `{components.data-table-row}`, `{components.data-table-cell}`.
- `{components.badge-success}` / `{components.badge-pill}` for policy status.
- `{components.button-icon-circular}` for delete action.
- `{components.pagination}`.
- `{components.empty-state-card}` with "Create bucket" CTA.

### States
- **Loading:** skeleton table rows (8 rows).
- **Empty (no buckets):** empty-state card with icon + "No buckets yet" + "Create bucket" button.
- **Empty (search/filter no match):** inline message inside the table panel: "No buckets match your search." + "Clear filters" link.
- **Error:** `{components.error-banner}` sticky below header; table area replaced with inline error card.
- **Data:** table renders with pagination. Search filters client-side by name/ARN. Tabs filter by policy presence.

### Destructive-op confirm
- **Delete bucket:** confirm dialog names the bucket and warns that all indexes and vectors inside it will be lost. Danger button label: "Delete bucket".

---

## 3. Bucket detail page

### Layout
- **Page header:** bucket name as title left, breadcrumbs "Vector Buckets / {bucketName}" above, primary action "Create index" right.
- **Sub-header:** ARN, creation date, and region rendered as muted mono text.
- **Tabs:** `{components.segmented-tab}` pair — Indexes | Policy.
- **Indexes tab:**
  - Toolbar: search pill + "Create index" button.
  - Table columns: Index name, Dimension, Distance metric, Vector count, Created, Actions.
  - Row actions: View, Delete.
- **Policy tab:**
  - Split layout: left 60% `{components.json-viewer-card}` showing current bucket policy; right 40% `{components.card}` with policy editor.
  - Editor: `{components.textarea}` for JSON, `{components.button-primary}` "Save policy", `{components.button-secondary}` "Delete policy" (disabled if no policy), `{components.button-secondary}` "Format JSON".

### Components
- `{components.page-header}` with breadcrumb.
- `{components.segmented-tab}` / `{components.segmented-tab-active}`.
- `{components.data-table}` for indexes.
- `{components.json-viewer-card}` for policy display.
- `{components.textarea}` for policy editing.
- `{components.button-primary}`, `{components.button-secondary}`, `{components.button-danger}`.
- `{components.empty-state-card}` when there are no indexes.

### States
- **Loading:** page header skeleton + tab skeleton + table skeleton.
- **Empty (Indexes tab):** empty-state card "No indexes in this bucket" + "Create index" CTA.
- **Empty (Policy tab):** JSON viewer shows `"No policy attached to this bucket."`; editor empty with placeholder.
- **Error:** `{components.error-banner}` below header; tabs disabled.
- **Data:** indexes table populated; policy JSON formatted with syntax highlighting.

### Destructive-op confirm
- **Delete index:** confirm dialog names the index and bucket.
- **Delete policy:** confirm dialog warns that access-control policy will be removed.
- **Save policy (overwrite):** if a policy exists, the save button triggers a confirm dialog "Overwrite existing policy?" before calling `PutVectorBucketPolicy`.

---

## 4. Create / edit index drawer

This is a slide-out drawer, not a standalone page, reachable from Bucket detail and Vector Buckets context menus.

### Layout
- Drawer width 480px, background `{colors.surface-elevated}`, 1px left border.
- Form fields stacked with `{spacing.md}` gaps:
  - Index name (`{components.text-input}`)
  - Dimension (`{components.text-input}`, number)
  - Distance metric (`{components.category-tab}` or select: Euclidean / Cosine / InnerProduct)
- Footer: `{components.button-primary}` "Create index" + `{components.button-secondary}` "Cancel".

### States
- **Loading:** submit button shows inline spinner.
- **Validation error:** inline `{components.error-banner}` inside the drawer for missing/invalid fields.
- **API error:** `{components.error-banner}` with SDK error name.
- **Success:** drawer closes, parent table refreshes.

---

## 5. Index detail page

### Layout
- **Page header:** index name as title, breadcrumbs "Vector Buckets / {bucketName} / {indexName}" above, primary action "Put vectors" right.
- **Sub-header:** dimension, distance metric, vector count rendered as muted mono text.
- **Page toolbar:** `{components.search-pill}` placeholder "Search vector IDs…"; `{components.button-secondary}` "Refresh"; `{components.button-secondary}` "Delete selected" (disabled until rows selected).
- **Main panel:** `{components.data-table}` with row selection checkboxes.
- **Table columns:** Checkbox, ID, Metadata (truncated JSON preview), Vectors (preview first 3 dimensions + "…"), Actions.
- **Row actions:** View, Delete.
- **Footer:** `{components.pagination}` with page size selector (20 / 50 / 100).

### Components
- `{components.page-header}` with breadcrumb.
- `{components.page-toolbar}`.
- `{components.search-pill}`.
- `{components.data-table}` with `{components.data-table-row-selected}`.
- `{components.badge-pill}` for vector count.
- `{components.json-viewer-card}` used in the vector detail drawer (see below).
- `{components.pagination}`.

### States
- **Loading:** skeleton table rows.
- **Empty (no vectors):** empty-state card "No vectors in this index" + "Put vectors" CTA.
- **Empty (search no match):** inline message inside table panel.
- **Error:** `{components.error-banner}` below header.
- **Data:** table renders with pagination. Search filters by vector ID prefix. Batch delete enabled after selection.

### Destructive-op confirm
- **Delete vector(s):** single-vector delete uses a simple confirm dialog naming the ID. Batch delete shows "Delete N selected vectors?".

---

## 6. Vector detail drawer

A slide-out drawer reachable by clicking a vector row.

### Layout
- Drawer width 560px.
- Top section: vector ID in `{typography.title-lg}` (mono), copy button.
- Tabs: Vectors | Metadata | Raw JSON.
- **Vectors tab:** `{components.code-window-card}` showing the full float array with line numbers.
- **Metadata tab:** `{components.json-viewer-card}` showing metadata object.
- **Raw JSON tab:** `{components.json-viewer-card}` showing the full SDK response object.
- Footer: `{components.button-danger}` "Delete vector" + `{components.button-secondary}` "Close".

### States
- **Loading:** skeleton text blocks.
- **Error:** `{components.error-banner}` inside drawer.
- **Data:** full vector payload rendered.

### Destructive-op confirm
- **Delete vector:** confirm dialog names the vector ID; on confirm, drawer closes and parent table refreshes.

---

## 7. Put vectors page / drawer

Reachable from Index detail or Vector Buckets drill-down.

### Layout
- Full-page form (preferred) or drawer width 640px.
- Two input modes presented as `{components.segmented-tab}`:
  - **JSON** — one `{components.textarea}` for an array of `{ id, metadata?, vector: number[] }` objects.
  - **Single** — separate inputs for ID, metadata JSON, and vector array JSON.
- Toolbar: `{components.button-primary}` "Put vectors", `{components.button-secondary}` "Format JSON", `{components.button-secondary}` "Cancel".
- Validation helper text below the textarea: "Expected JSON array of vector objects."

### Components
- `{components.textarea}` (code style).
- `{components.segmented-tab}`.
- `{components.button-primary}`, `{components.button-secondary}`.
- `{components.info-banner}` with payload-size hint.

### States
- **Loading:** submit button spinner.
- **Validation error:** inline `{components.error-banner}` for malformed JSON.
- **API error:** `{components.error-banner}` with SDK error name.
- **Success:** redirect back to index detail with `{components.success}`-style toast/banner "N vectors upserted."

---

## 8. Query Console

### Layout
- **Page header:** title "Query Console" left, saved-query dropdown / clear button right.
- **Three-pane layout:**
  1. **Left query panel (35%):**
     - Bucket select (`{components.text-input}`-styled dropdown or AntD Select).
     - Index select.
     - TopK input (`{components.text-input}`, number, default 10).
     - Query vector textarea (`{components.textarea}`) — accepts JSON array of floats.
     - Filter expression textarea (`{components.textarea}`) — optional metadata filter.
     - `{components.button-primary}` "Run query" full width.
     - `{components.button-secondary}` "Load example".
  2. **Center results panel (40%):**
     - `{components.data-table}` of results: Rank, ID, Score, Metadata preview, Actions.
     - Row action: View full vector (opens vector detail drawer).
     - `{components.pagination}` if results exceed page size.
  3. **Right output panel (25%):**
     - `{components.json-viewer-card}` showing the raw `QueryVectors` SDK response.
     - Copy-to-clipboard icon.

### Components
- `{components.page-header}`.
- `{components.text-input}`, `{components.textarea}`.
- `{components.button-primary}`, `{components.button-secondary}`.
- `{components.data-table}`.
- `{components.json-viewer-card}`.
- `{components.pagination}`.
- `{components.empty-state-card}` "Build a query to see results".

### States
- **Initial:** left form empty/default, center and right panels show empty-state cards.
- **Loading:** query button spinner, results panel skeleton rows, raw output shows `{}`.
- **Empty results:** center panel shows "No vectors matched your query." with "Adjust topK or filters" hint.
- **Validation error:** inline `{components.error-banner}` for invalid JSON vector or missing bucket/index.
- **API error:** `{components.error-banner}` below header with SDK error name.
- **Data:** results table + raw JSON populated.

### Destructive-op confirm
None on this page. The query is read-only.

---

## 9. Settings

### Layout
- **Page header:** title "Settings" left.
- **Content:** two-column layout at desktop:
  - **Left column (60%):** `{components.card}` containing the credentials form.
  - **Right column (40%):** `{components.card}` containing connection test + help.
- **Form fields (credentials card):**
  - Access Key ID (`{components.text-input}`, password toggle optional).
  - Secret Access Key (`{components.text-input}`, type="password").
  - Session Token (`{components.textarea}`) — optional.
  - Region (`{components.text-input}`) — default "us-east-1".
  - Endpoint (`{components.text-input}`) — optional custom endpoint / proxy base URL.
  - "Session-only" toggle (`{components.category-tab}`-style switch or AntD Switch) — when on, credentials are not persisted to localStorage.
- **Connection card:**
  - `{components.button-primary}` "Test connection".
  - Result area: empty by default; on success shows `{components.badge-success}` "Connected" + region + account alias if available; on failure shows `{components.error-banner}`.
  - `{components.info-banner}` explaining CORS and the optional proxy escape hatch.

### Components
- `{components.page-header}`.
- `{components.card}`.
- `{components.text-input}`, `{components.textarea}`.
- `{components.button-primary}`, `{components.button-secondary}`.
- `{components.badge-success}` / `{components.badge-error}`.
- `{components.info-banner}` / `{components.error-banner}`.
- Toggle/switch component.

### States
- **Loading:** test button spinner; form inputs disabled during test.
- **Empty (first visit):** form empty, no result banner, info banner visible.
- **Saved (return visit):** form populated from store; secret key masked; session-only toggle reflects stored preference.
- **Validation error:** inline error under required fields (AK/SK/region).
- **Test success:** success badge + green status line.
- **Test error:** `{components.error-banner}` with AWS error name and actionable message.

### Destructive-op confirm
- **Clear credentials:** if the user clicks "Clear saved credentials", a confirm dialog warns that settings will be removed from the browser. Danger button label: "Clear credentials".

---

## Component-to-page matrix

| Component | Dashboard | Buckets | Bucket detail | Index detail | Vector drawer | Query | Settings |
|---|---|---|---|---|---|---|---|
| `page-header` | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| `page-toolbar` | — | ✓ | ✓ | ✓ | — | — | — |
| `sidebar` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `data-table` | — | ✓ | ✓ | ✓ | — | ✓ | — |
| `json-viewer-card` | — | — | ✓ | ✓ | ✓ | ✓ | — |
| `code-window-card` | — | — | — | — | ✓ | — | — |
| `search-pill` | — | ✓ | ✓ | ✓ | — | — | — |
| `segmented-tab` | — | — | ✓ | — | ✓ | ✓ | — |
| `category-tab` | — | ✓ | — | — | — | — | — |
| `confirm-dialog` | — | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| `error-banner` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `empty-state-card` | ✓ | ✓ | ✓ | ✓ | — | ✓ | — |
| `pagination` | — | ✓ | — | ✓ | — | ✓ | — |

---

## Navigation map

```
Dashboard
Vector Buckets
  ├── Bucket: {name}
  │     ├── Indexes
  │     └── Policy
  │     └── Index: {name}
  │           └── Vectors (browser)
  │                 └── Vector: {id} (drawer)
Query Console
Settings
```

All routes use React Router v6. The sidebar highlights the nearest parent route when viewing a child detail page.
