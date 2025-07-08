-- Initial schema setup for Prompt Board
-- This migration sets up the basic tables and functions

-- Enable the uuid-ossp extension for UUID generation
create extension if not exists "uuid-ossp";

-- Create profiles table for user data
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create prompts table for storing user prompts
create table if not exists public.prompts (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    content text not null,
    category text,
    tags text[],
    is_public boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.prompts enable row level security;

-- Create policies for profiles
create policy "Users can view own profile" on public.profiles
    for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
    for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
    for insert with check (auth.uid() = id);

-- Create policies for prompts
create policy "Users can view own prompts" on public.prompts
    for select using (auth.uid() = user_id);

create policy "Users can view public prompts" on public.prompts
    for select using (is_public = true);

create policy "Users can insert own prompts" on public.prompts
    for insert with check (auth.uid() = user_id);

create policy "Users can update own prompts" on public.prompts
    for update using (auth.uid() = user_id);

create policy "Users can delete own prompts" on public.prompts
    for delete using (auth.uid() = user_id);

-- Create a function to handle user profile creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, full_name)
    values (new.id, new.email, new.raw_user_meta_data->>'full_name');
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
