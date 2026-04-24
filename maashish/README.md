# MA Aashish — Knitting Production Dashboard

A real-time internal operations website for MA Aashish textile knitting production. Pulls live data from Google Sheets every 5 minutes.

## Pages

| Page | Description |
|------|-------------|
| `/` | Home — today's snapshot: active machines, rolls, operators |
| `/machines` | Machine Info — full table with filters, operator cards, insights |
| `/dashboard` | Production Dashboard — charts, trends, heatmap, analytics |
| `/tools` | Tools — idle tracker, monthly operator summary, daily report generator |
| `/packing` | Packing — placeholder (coming soon) |

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Google Sheets API
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → Enable **Google Sheets API**
3. Credentials → **Create API Key** → Restrict to Google Sheets API
4. Open your Google Sheet → **Share** → Anyone with the link → Viewer

### 3. Configure environment variables
```bash
cp .env.example .env.local
```
Edit `.env.local` and paste your Google API key.

### 4. Run development server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000)

### 5. Build for production
```bash
npm run build
npm start
```

## Data Schema (Google Sheet)

| Column | Field | Notes |
|--------|-------|-------|
| A | Date | DD/MM/YYYY |
| B | Machine Number | Integer |
| C | Operator Name | Empty if idle |
| D | Shift | Day / Night |
| E | Rolls | Number produced |
| F | RPM | Numeric, "NA", or "sampling" |
| G | Ex Counter | Expected counter |
| H | Act Counter | Actual counter |

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```
Add your environment variables in Vercel dashboard → Settings → Environment Variables.

## Tech Stack
- **Next.js 14** — React framework
- **Tailwind CSS** — Styling
- **Recharts** — Charts
- **SWR** — Data fetching with auto-refresh
- **Lucide React** — Icons
- **Google Sheets API v4** — Data source
