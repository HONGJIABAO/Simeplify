-- ============================================================================
-- Migration: 20261021000000_ai_usage.sql
-- Table: public.ai_usage
-- Purpose: Persist and track daily AI bill reading and reanalysis calls per household
-- ============================================================================

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  kind text not null check (kind in ('read', 'reanalyze')),
  created_at timestamptz not null default now()
);

-- Index for efficient daily window filtering by household
create index idx_ai_usage_household_created on public.ai_usage (household_id, created_at);

-- Security: Enable and force Row Level Security
alter table public.ai_usage enable row level security;
alter table public.ai_usage force row level security;

-- No policies granted for authenticated or anon roles.
-- Only service_role can read and insert into public.ai_usage.
