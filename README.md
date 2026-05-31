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

The service role key is needed for the scraper API to insert data without auth (since this is for personal use).

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

### Demo Scrape
Click **"Run Demo Scrape"** on the dashboard to populate the database with sample vegetable data and see the dashboard in action.

### Custom Website Scraping
Click **"Custom Website"** to configure scraper settings:

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

For automatic price tracking, set up a cron job or use a service like GitHub Actions, Vercel Cron, or a simple serverless function to call the scrape API regularly:

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
