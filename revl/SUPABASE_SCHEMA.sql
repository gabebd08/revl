-- Run this entire block in Supabase SQL Editor

-- PROFILES
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  email text,
  age int,
  sex text,
  height text,
  weight numeric,
  target_weight numeric,
  goal text,
  experience text,
  training_days text,
  lifts jsonb default '{}',
  diet_type text,
  allergies text[] default '{}',
  meals_per_day text,
  plan jsonb,
  onboarded boolean default false,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Users can manage own profile" on profiles for all using (auth.uid() = id);

-- WORKOUT LOGS
create table if not exists workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  date date not null,
  exercises jsonb default '[]',
  notes text,
  created_at timestamptz default now(),
  unique(user_id, date)
);
alter table workout_logs enable row level security;
create policy "Users manage own workout logs" on workout_logs for all using (auth.uid() = user_id);

-- MEAL LOGS
create table if not exists meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  date date not null,
  meals jsonb default '[]',
  totals jsonb default '{}',
  created_at timestamptz default now(),
  unique(user_id, date)
);
alter table meal_logs enable row level security;
create policy "Users manage own meal logs" on meal_logs for all using (auth.uid() = user_id);

-- WEIGHT LOGS
create table if not exists weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  date date not null,
  weight numeric not null,
  created_at timestamptz default now(),
  unique(user_id, date)
);
alter table weight_logs enable row level security;
create policy "Users manage own weight logs" on weight_logs for all using (auth.uid() = user_id);

-- FRIENDSHIPS
create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references profiles(id) on delete cascade,
  recipient_id uuid references profiles(id) on delete cascade,
  status text default 'accepted',
  created_at timestamptz default now(),
  unique(requester_id, recipient_id)
);
alter table friendships enable row level security;
create policy "Users manage own friendships" on friendships for all using (auth.uid() = requester_id or auth.uid() = recipient_id);

-- Allow leaderboard to read all profiles (username, lifts, weight, goal only)
create policy "Public can read profiles for leaderboard" on profiles for select using (true);
