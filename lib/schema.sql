-- Schema for FlashBid Auction Application

-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create auctions table
CREATE TABLE IF NOT EXISTS public.auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  starting_price DECIMAL(10, 2) NOT NULL,
  reserve_price DECIMAL(10, 2),
  category TEXT NOT NULL,
  condition TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  images TEXT[] NOT NULL,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  shipping_locations TEXT DEFAULT 'domestic',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'canceled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create bids table
CREATE TABLE IF NOT EXISTS public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID REFERENCES public.auctions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE (auction_id, user_id, amount)
);

-- Create watchlist table
CREATE TABLE IF NOT EXISTS public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  auction_id UUID REFERENCES public.auctions(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE (user_id, auction_id)
);

-- RLS Policies

-- Profiles: users can read all profiles, but only update their own
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auctions: public read, creator can update
CREATE POLICY "Auctions are viewable by everyone" 
  ON public.auctions FOR SELECT USING (true);

CREATE POLICY "Users can create auctions" 
  ON public.auctions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own auctions" 
  ON public.auctions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own auctions" 
  ON public.auctions FOR DELETE USING (auth.uid() = user_id AND status != 'ended');

-- Bids: public read, authenticated users can place bids
CREATE POLICY "Bids are viewable by everyone" 
  ON public.bids FOR SELECT USING (true);

CREATE POLICY "Authenticated users can place bids" 
  ON public.bids FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Watchlist: private to the user
CREATE POLICY "Users can view their own watchlist" 
  ON public.watchlist FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlist" 
  ON public.watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove items from their watchlist" 
  ON public.watchlist FOR DELETE USING (auth.uid() = user_id);

-- Storage Policies
-- Create a policy to allow authenticated users to upload images to the auction-images bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('auction-images', 'auction-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'auction-images' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'auction-images');

-- Functions and Triggers
-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the timestamp trigger to auctions and profiles
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.auctions
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp(); 