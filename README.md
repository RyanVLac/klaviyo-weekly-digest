# Klaviyo Weekly Digest (Hackathon Demo)

A lightweight, end-to-end demo that simulates a small e-commerce browsing session, tracks engagement into **Klaviyo** (Page Viewed + Product Viewed), then pulls the last *N* days of events back from Klaviyo to generate a **weekly digest**.

The digest includes:
- A deterministic rollup (page views, product views, dwell time, top topics, top products)
- An **AI-generated narrative + inferred topics + recommendations** using the OpenAI API

This is designed for a short demo: set an email → click around the demo store → generate a digest on the dashboard.

---

## What this project demonstrates

- **Server-side event tracking** into Klaviyo via custom API routes  
- **Reading real engagement events back from Klaviyo** (not hardcoded)
- **Digest aggregation** (topics/products/stats) from those events
- **AI summarization + topic inference** (OpenAI) to produce a more human-friendly digest
-  A simple UI flow to make the demo easy for people to follow.

---

## The problem you are solving and its impact

Most teams can track user behavior (page views, product views, dwell time), but turning that raw event stream into something **human-readable and actionable** usually takes extra dashboards, manual analysis, or engineering work. In this day in age, there are so much content everywhere, that it can get overwhelming for individuals. My app aims to help consolidate all the your favorite products and events in to one digestable summary at the end of the weak.

**Impact**
- **Marketers / product teams / consumers** get a quick weekly “what happened” summary instead of digging through event logs.
- **Personalization** becomes easier: inferred interests + suggested products/topics can drive smarter follow-ups.
- **Faster iteration**: you can see how engagement changes week-to-week from real event data.

---

## How the solution works

1) **Identity (Signup)**
- User enters an email on `/signup`
- The app **upserts a Klaviyo profile** for that email and stores the email locally (localStorage) to simulate a returning user.

2) **Generate events (Demo Store)**
- `/demo` and its sub-pages simulate a small store experience.
- When the user opens a category/content/product page, the app sends:
  - **Page Viewed** events (`/api/track/page-view`)
  - **Product Viewed** events (`/api/track/product-view`)
- These events are written into **Klaviyo** via the Klaviyo API.

3) **Digest generation (Dashboard)**
- On `/dashboard`, clicking **Generate Digest** calls `/api/digest/generate`
- That endpoint:
  - Pulls the last **N days** of events from **Klaviyo** for the email’s profile
  - Aggregates them into a deterministic digest:
    - totals (page views, product views, dwell time)
    - top topics
    - top products
  - Then optionally runs AI to produce a more natural summary + inferred topics + recommendations.

---

## How you used AI effectively (if at all)

AI is used to **improve and humanize the digest**, not to replace the underlying analytics.

Specifically:
- **Topic inference:** when events have missing or weak topic labels, the AI infers interests using signals like:
  - URL path
  - page title
  - product name / product id
- **Natural language digest:** AI produces a clear weekly narrative (“what you spent time on, what stood out”)
- **Recommendations:** AI returns product suggestions tied to actual browsing evidence (and uses known products when available)

Important: the app still produces a deterministic digest from real Klaviyo events even if AI is disabled.

## How to run locally
see below


---

## Architecture / Design Decisions

### Why a “Demo Store”?
The demo store UI is intentionally small and “hardcoded” *as a sandbox* to generate realistic browse events consistently during judging.

**What is NOT hardcoded:**  
The digest output is generated from **real events pulled back from Klaviyo**, every time you click “Generate Digest”.

### Why store email in localStorage?
- Keeps the demo simple and judge-friendly (no authentication/database required)
- Makes the UI behave like a returning user session

### Why deterministic + AI?
- Deterministic digest ensures the app still works even if AI is disabled
- AI improves readability, infers missing topics, and adds recommendations

---

## Tech Stack

**Frontend**
- Next.js (App Router)
- React
- TypeScript
- CSS (globals.css)

**Backend**
- Next.js Route Handlers (`/api/*`)
- Node.js runtime (via Next dev server)

**Integrations**
- Klaviyo API (Profiles + Events + Events Read) (more about this below)
- OpenAI API (AI digest generation)

**Dev Tools**
- npm
- PowerShell/cURL or `Invoke-RestMethod` (for manual endpoint testing)

---

## Klaviyo API / SDK / MCP Usage (What Klaviyo API were used)

This project uses Klaviyo’s **REST APIs** (no Klaviyo SDK, no MCP server).

### APIs used
- **Profiles API**
  - Look up / create profiles (for “signup” and to resolve a profileId from email)
- **Events API**
  - Create events (Page Viewed / Product Viewed)
  - Read/list events back to build the digest (filtered by profile + time window)

### Key Klaviyo endpoints (typical)
- `GET /api/profiles/` (filter by email)
- `POST /api/profiles/` (create profile)
- `POST /api/events/` (create event)
- `GET /api/events/` (list events for profile in last N days)

> All calls include `Authorization: Klaviyo-API-Key <PRIVATE_KEY>` and `Revision: <YYYY-MM-DD>`.

---

## App Flow (Demo Script)

1) **Signup**
- Set an email address (stored in localStorage)
- Upserts a Klaviyo profile for that email

2) **Demo Store**
- Click categories / content / products
- Automatically sends **Page Viewed** and **Product Viewed** events to Klaviyo

3) **Dashboard**
- Pulls the last *N* days of events from Klaviyo
- Builds a deterministic digest (stats/topics/products)
- Calls OpenAI to generate an AI digest (headline/summary/inferred topics/recommendations)

---

## Environment Variables

Create a `.env` file (or copy from `.env.example`) and fill in:

### Klaviyo
- `KLAVIYO_PRIVATE_API_KEY` - your Klaviyo private API key
- `KLAVIYO_REVISION` - the Klaviyo API revision date (example: `2024-10-15`)

### OpenAI
- `OPENAI_API_KEY` - your OpenAI API key
- `OPENAI_MODEL` - model name used for digest generation (example: `gpt-4.1-mini` or whatever you configured)

> Never commit `.env` files. Use `.env.example` for templates.

---

## How to Run Locally

### 1. Clone the repo
```bash
git clone <YOUR_REPO_URL>
cd klaviyo-weekly-digest
```
### 2. Install dependencies
```bash
npm install
```
### 3. Set up environment variables
```bash
Copy the example env file and edit it:
cp .env.example .env

Then open .env and add your keys:
Klaviyo Private API Key
Klaviyo Revision
OpenAI API Key (+ model if applicable)
```
### 4. Start the dev server
```bash
npm run dev

The app will run on http://localhost:3000
```
---

## Testing / Error Handling

### How I tested (manual API verification)
I tested the full end-to-end flow by hitting our local Next.js API routes directly using **PowerShell `Invoke-RestMethod`**. This let us verify:

- The server is running and responding
- Klaviyo writes are succeeding (track endpoints)
- Klaviyo reads are succeeding (digest generation pulls real events)
- OpenAI summarization runs and returns valid JSON

#### 1) Health check
```powershell
Invoke-RestMethod -Method Get `
  -Uri "http://localhost:3000/api/health"
```
#### 2) Upsert profile (Signup)
```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3000/api/profiles/upsert" `
  -ContentType "application/json" `
  -Body '{"email":"you@example.com"}' | ConvertTo-Json -Depth 10
```
#### 3) Track a Page Viewed event
```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3000/api/track/page-view" `
  -ContentType "application/json" `
  -Body '{"email":"you@example.com","urlPath":"/demo/boots","title":"Boots Collection","topic":"boots","dwellSeconds":42}' |
ConvertTo-Json -Depth 10
```
#### 4) Track a Product Viewed event
```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3000/api/track/product-view" `
  -ContentType "application/json" `
  -Body '{"email":"you@example.com","productId":"boot-001","productName":"Classic Leather Boot","price":129.99,"urlPath":"/demo/products/boot-001","title":"Classic Leather Boot","topic":"boots"}' |
ConvertTo-Json -Depth 10
```
#### 5) Generate digest (reads from Klaviyo + AI)
```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3000/api/digest/generate" `
  -ContentType "application/json" `
  -Body '{"email":"you@example.com","days":7}' |
ConvertTo-Json -Depth 10
```
### What I look for
- ok: true
- profileId present
- meta.fetchedEvents increases after tracking events
- digest.stats reflects expected counts
- aiUsed: true and aiDigest present when OpenAI is configured

I also have alot catch blocks through the code to ensure errors are caught. Further testing was hands on with physically going through the page making sure everything was working.

## Video Link


