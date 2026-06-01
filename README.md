# Vegetable Price Tracker

A personal Next.js application to scrape vegetable prices from online stores and track them over time using Supabase.

## Features

- **Web Scraping**: Scrape product data from any vegetable/food store website using configurable CSS selectors
- **Demo Mode**: Built-in demo scraper with sample vegetable data to test the dashboard immediately
- **Price Tracking**: Automatic price history logging every time you scrape
- **Interactive Dashboard**: 
  - Line charts showing price trends over time
  - Statistics cards (products tracked, average price, price changes)
  - Sortable and filterable product table
  - Category filtering
  - Search functionality
- **Supabase Integration**: All data persisted to PostgreSQL database

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)
- Recharts (Charts)
- Cheerio (Server-side scraping)
- Lucide React (Icons)

## Setup

### 1. Install Dependencies

```bash
cd vegetable-price-tracker
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the migration from `supabase/migrations.sql`
4. Copy your project URL and anon key from Settings > API

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The service role key is needed for the scraper API to insert data without auth.

To protect admin-only scraping and scheduling features, also configure Google OAuth and the email allowlist:

```
AUTH_SECRET=generate_a_long_random_secret
AUTH_GOOGLE_ID=your_google_oauth_client_id
AUTH_GOOGLE_SECRET=your_google_oauth_client_secret
ADMIN_EMAILS=you@example.com,teammate@example.com
```

Only emails listed in `ADMIN_EMAILS` can sign in to `/admin` and use the scrape/schedule APIs.

For local-only testing without Google sign-in, you can temporarily enable:

```
LOCAL_AUTH_BYPASS=true
```

This bypasses admin authentication for local development so `/admin` and admin APIs can be tested without signing in. Do not enable it in production.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

### Demo Scrape
Sign in at `/admin` with an allowlisted Google account, or enable `LOCAL_AUTH_BYPASS=true` for local testing, then click **"Run Demo Scrape"** to populate the database with sample vegetable data and see the dashboard in action.

### Custom Website Scraping
After signing in at `/admin`, click **"Custom Website"** to configure scraper settings:

- **Website URL**: The page to scrape
- **Store Name**: Identifier for the store
- **Product Container**: CSS selector for each product card (e.g., `.product`)
- **Name Selector**: Selector for product name within container (e.g., `.title`)
- **Price Selector**: Selector for price (e.g., `.price`)
- **Image Selector**: Selector for product image (e.g., `img`)
- **Link Selector**: Selector for product link (e.g., `a`)

### Example Configuration

For a hypothetical store with this HTML:
```html
<div class="product-card">
  <h3 class="product-name">Organic Carrots</h3>
  <span class="product-price">$2.49</span>
  <img src="carrots.jpg" />
  <a href="/product/carrots">View</a>
</div>
```

Configure:
- Product Container: `.product-card`
- Name Selector: `.product-name`
- Price Selector: `.product-price`
- Image Selector: `img`
- Link Selector: `a`

## Database Schema

### Products Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | Text | Product name |
| category | Text | Product category |
| price | Decimal | Current price |
| currency | Text | Price currency |
| unit | Text | Unit of measurement |
| image_url | Text | Product image URL |
| source_url | Text | Original product link |
| store_name | Text | Store identifier |
| in_stock | Boolean | Availability |
| created_at | Timestamp | First seen |
| updated_at | Timestamp | Last updated |

### Price History Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| product_id | UUID | Reference to product |
| price | Decimal | Price at scrape time |
| currency | Text | Currency |
| in_stock | Boolean | Stock status |
| scraped_at | Timestamp | When scraped |

## Scheduling Scrapes (Optional)

The admin schedule UI lives at `/admin` and is protected by Google OAuth plus the `ADMIN_EMAILS` allowlist.

For automatic price tracking on Vercel, keep the weekly cron in `vercel.json` and call the protected cron endpoint server-to-server:

```bash
curl -X POST http://your-app.com/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"useDemo":false,"config":{"url":"...","storeName":"...","selectors":{...}}}'
```

## Important Notes

- This tool is for **personal use only**
- Always respect websites' `robots.txt` and Terms of Service
- Don't scrape too frequently to avoid overwhelming servers
- Some websites may block scraping - you may need to add delays or use proxies
