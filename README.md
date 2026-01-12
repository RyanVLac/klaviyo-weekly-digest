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
-  A simple UI flow to make the demo easy for judges to follow

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
- Klaviyo API (Profiles + Events + Events Read)
- OpenAI API (AI digest generation)

**Dev Tools**
- npm
- PowerShell/cURL or `Invoke-RestMethod` (for manual endpoint testing)

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

## Notes
- The demo store content is intentionally “small” and hardcoded only as a sandbox UI to generate realistic events.
- The digest itself is not hardcoded:
- It pulls real events back from Klaviyo each time you generate it.
- The AI narrative is generated fresh from the pulled event data.
