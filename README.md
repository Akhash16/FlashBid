# FlashBid - Auction Platform

A real-time auction platform built with Next.js and Supabase.

## Features

- User authentication with Supabase Auth
- Create and manage auctions
- Upload and store images with Supabase Storage
- Real-time bidding
- Watchlist for tracking auctions
- User profiles

## Technologies

- Next.js 14 (App Router)
- TypeScript
- Supabase (Auth, Database, Storage)
- Tailwind CSS
- Shadcn UI

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/FlashBid.git
cd FlashBid
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set up Supabase

1. Create a new Supabase project at [https://supabase.com](https://supabase.com)
2. Get your Supabase URL and anon key from the project API settings
3. Create a `.env.local` file in the root of your project with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

### 4. Set up the Database

You have two options:

#### Option 1: Run the setup script

```bash
npm install dotenv
npx dotenv -e .env.local -- node lib/setupDatabase.js
```

#### Option 2: Manual Setup

1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `lib/schema.sql` 
3. Run the SQL in your Supabase SQL Editor

### 5. Set up Storage

1. In the Supabase dashboard, go to the Storage section
2. Create a new bucket called `auction-images`
3. Set the bucket to public

### 6. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_KEY`: Your Supabase service role key (for admin access)

## Project Structure

- `app/`: Next.js app router pages and layouts
  - `auctions/`: Auction related pages
  - `auth/`: Authentication related pages
  - `api/`: API routes
- `components/`: Reusable React components
- `utils/`: Utility functions and helpers
  - `supabase/`: Supabase client configurations
- `lib/`: Library files and schemas

## Demo Account

A demo account is available for testing:
- Email: demo@example.com
- Password: demo123456 