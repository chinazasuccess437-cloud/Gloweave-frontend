-- Gloweave PostgreSQL Schema for Supabase Auth Integration
-- Run this migration in your Supabase SQL Editor.

create extension if not exists "pgcrypto";

-- 1. Public user profiles linked 1:1 with auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  role_identity text not null,
  other_role text,
  country text not null,
  interests text[] not null default '{}',
  primary_goal text not null,
  contribution_style text not null,
  avatar_url text,
  onboarding_completed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Structured onboarding responses audit log
create table if not exists public.onboarding_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  role_identity text not null,
  other_role text,
  interests text[] not null default '{}',
  country text not null,
  primary_goal text not null,
  contribution_style text not null,
  preferred_name text not null,
  completed_at timestamptz not null default now()
);

-- Enable Row-Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.onboarding_responses enable row level security;

-- Policies: Users can only read and write their own profile and onboarding data
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can view own onboarding responses"
  on public.onboarding_responses for select
  using (auth.uid() = user_id);

create policy "Users can insert own onboarding responses"
  on public.onboarding_responses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own onboarding responses"
  on public.onboarding_responses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
