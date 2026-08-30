# S3Vector Console — Attu-style web client for AWS S3 Vectors

A single-page, pure static web client for **AWS S3 Vectors**. No backend required — the browser calls AWS S3 Vectors directly via `@aws-sdk/client-s3vectors` with user-supplied credentials.

## Features

Full coverage of all 16 S3 Vectors API actions, grouped as:

| Group          | Actions                                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bucket** (7) | CreateVectorBucket, DeleteVectorBucket, GetVectorBucket, ListVectorBuckets, PutVectorBucketPolicy, GetVectorBucketPolicy, DeleteVectorBucketPolicy |
| **Index** (4)  | CreateIndex, DeleteIndex, GetIndex, ListIndexes                                                                                                    |
| **Vector** (5) | PutVectors, GetVectors, ListVectors, DeleteVectors, QueryVectors                                                                                   |

UI includes Dashboard overview, bucket/index drill-down views, policy editor, JSON metadata viewer, confirm dialogs for destructive operations, and a similarity Query console.

## Quick start

```bash
npm install
npm run dev       # Vite dev server on port 5173
npm run build     # tsc + vite build → dist/
npm test          # vitest watch mode
npm run test:run  # vitest single run
npm run lint      # ESLint + Prettier check
```

## Deployment

The `dist/` folder is a static page deployable to any static host:

- **AWS S3 website** + CloudFront
- **GitHub Pages** (`gh-pages` or Actions)
- **nginx / caddy** — just serve the `dist/` directory
- Any other static file host

No server-side runtime is needed. Open the page in a browser and enter your credentials in Settings.

## Settings

The Settings page lets you configure:

| Field                 | Description                                                                            | Default                   |
| --------------------- | -------------------------------------------------------------------------------------- | ------------------------- |
| **Access Key ID**     | AWS access key                                                                         | —                         |
| **Secret Access Key** | AWS secret key                                                                         | —                         |
| **Session Token**     | Optional, for temporary credentials                                                    | —                         |
| **Region**            | AWS region                                                                             | `us-east-1`               |
| **API Endpoint**      | Override base URL (for proxies, see CORS below)                                        | —                         |
| **Session-only mode** | If enabled, credentials are stored in `sessionStorage` and cleared when the tab closes | Off (uses `localStorage`) |

Credentials never leave the browser and are never baked into the build. Use the **Clear credentials** action to remove stored keys immediately.

## CORS

Browser-direct calls to AWS S3 Vectors work where the AWS endpoint allows CORS. The default target is `s3vectors.<region>.api.aws`.

If a corporate network or missing CORS headers block direct calls, the app displays an actionable error. To work around it **without code changes**: use the **Settings → API Endpoint** field to point at a tiny reverse proxy that adds CORS headers:

- **Caddy** — one line: `reverse_proxy s3vectors.us-east-1.api.aws`
- **Cloudflare Worker** — forward requests and inject `Access-Control-Allow-Origin: *`
- **nginx** — proxy_pass with CORS headers

The app routes all requests through the configured endpoint automatically.

## Architecture

React 18 + TypeScript + Vite + Ant Design 5 + Zustand state management. Service layer in `src/api/` wraps the AWS SDK with typed functions per API group (buckets, indexes, vectors). Unit tests via Vitest + Testing Library, SDK mocked at the service boundary.

## API Coverage

| #   | API Action               | UI Location                                      |
| --- | ------------------------ | ------------------------------------------------ |
| 1   | ListVectorBuckets        | Dashboard, Vector Buckets page                   |
| 2   | CreateVectorBucket       | Vector Buckets page → Create button              |
| 3   | GetVectorBucket          | Bucket Detail page                               |
| 4   | DeleteVectorBucket       | Bucket Detail page → Delete action               |
| 5   | PutVectorBucketPolicy    | Bucket Detail → Policy tab (JSON editor)         |
| 6   | GetVectorBucketPolicy    | Bucket Detail → Policy tab                       |
| 7   | DeleteVectorBucketPolicy | Bucket Detail → Policy tab → Delete action       |
| 8   | ListIndexes              | Bucket Detail page (index table)                 |
| 9   | CreateIndex              | Bucket Detail → Create Index button              |
| 10  | GetIndex                 | Index Detail page                                |
| 11  | DeleteIndex              | Index Detail → Delete action                     |
| 12  | ListVectors              | Index Detail page (vector table with pagination) |
| 13  | PutVectors               | Index Detail → Put Vectors (JSON editor)         |
| 14  | GetVectors               | Index Detail → Get Vectors                       |
| 15  | DeleteVectors            | Index Detail → Delete Vectors                    |
| 16  | QueryVectors             | Query Console page (topK, metric display)        |
