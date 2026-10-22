-- Migration: 20261020000001_storage_buckets.sql
-- Simeplify / EcoTwin Supabase Backend Stage 3
-- Configures storage buckets (bills, waste-photos) and row-level security policies on storage.objects

begin;

-- ============================================================================
-- 1. STORAGE BUCKETS CONFIGURATION
-- Configures 'bills' and 'waste-photos' as private household-isolated buckets.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'bills',
    'bills',
    false,
    10485760, -- 10 MB limit for bill photos and PDF documents
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]
  ),
  (
    'waste-photos',
    'waste-photos',
    false,
    5242880,  -- 5 MB limit for waste item photos
    array['image/jpeg', 'image/png', 'image/webp']::text[]
  )
on conflict (id) do update set
  name               = excluded.name,
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ============================================================================
-- 2. STORAGE RLS POLICIES ON storage.objects
-- All policies enforce household folder isolation: (storage.foldername(name))[1]
-- ============================================================================

-- ----------------------------------------------------------------------------
-- BUCKET: bills
-- Allowed operations: SELECT, INSERT, UPDATE, DELETE (Scoped to own household folder)
-- Path convention: bills/{household_id}/{filename}
-- ----------------------------------------------------------------------------

drop policy if exists "bills_select_own_household" on storage.objects;
create policy "bills_select_own_household"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'bills'
    and (storage.foldername(name))[1] = (select private.current_household_id())::text
  );

drop policy if exists "bills_insert_own_household" on storage.objects;
create policy "bills_insert_own_household"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'bills'
    and (storage.foldername(name))[1] = (select private.current_household_id())::text
  );

drop policy if exists "bills_update_own_household" on storage.objects;
create policy "bills_update_own_household"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'bills'
    and (storage.foldername(name))[1] = (select private.current_household_id())::text
  )
  with check (
    bucket_id = 'bills'
    and (storage.foldername(name))[1] = (select private.current_household_id())::text
  );

drop policy if exists "bills_delete_own_household" on storage.objects;
create policy "bills_delete_own_household"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'bills'
    and (storage.foldername(name))[1] = (select private.current_household_id())::text
  );

-- ----------------------------------------------------------------------------
-- BUCKET: waste-photos
-- Allowed operations: SELECT, INSERT, DELETE (Scoped to own household folder)
-- Path convention: waste-photos/{household_id}/{filename}
--
-- Note on UPDATE: waste-photos has no UPDATE policy, so clients must upload
-- with unique filenames (timestamp or UUID) and must not use upsert.
--
-- Security rationale for client INSERT: Client INSERT into waste-photos is allowed
-- because waste_scans, deeds and points are writable only by Edge Functions (service_role),
-- so an uploaded file alone cannot award points.
-- ----------------------------------------------------------------------------

drop policy if exists "waste_photos_select_own_household" on storage.objects;
create policy "waste_photos_select_own_household"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'waste-photos'
    and (storage.foldername(name))[1] = (select private.current_household_id())::text
  );

drop policy if exists "waste_photos_insert_own_household" on storage.objects;
create policy "waste_photos_insert_own_household"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'waste-photos'
    and (storage.foldername(name))[1] = (select private.current_household_id())::text
  );

drop policy if exists "waste_photos_delete_own_household" on storage.objects;
create policy "waste_photos_delete_own_household"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'waste-photos'
    and (storage.foldername(name))[1] = (select private.current_household_id())::text
  );

commit;
