-- Canonical application schema inferred from the Expo client's Supabase usage.
--
-- IMPORTANT: This migration is safe for a fresh local or staging database. It
-- intentionally uses plain CREATE TABLE statements so it aborts instead of
-- silently changing an existing, uninspected production schema. Before this is
-- ever applied to the hosted project, pull the live schema and reconcile it as
-- described in supabase/README.md.

create extension if not exists pgcrypto with schema extensions;

create or replace function public.generate_invite_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select upper(pg_catalog.encode(extensions.gen_random_bytes(5), 'hex'));
$$;

comment on function public.generate_invite_code() is
  'Generates a 10-character uppercase hexadecimal group invite code.';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  avatar_original_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.profiles is
  'Application-facing user profile data associated one-to-one with auth.users.';
comment on column public.profiles.email is
  'Email copied from auth.users for the current friend-search implementation.';

create table public.closet_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null default '',
  image_url text not null,
  borrowed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.closet_items is
  'Clothing items owned by a user and displayed in personal and group closets.';
comment on column public.closet_items.borrowed is
  'Compatibility field used by the current client; active borrowing records remain the authoritative history.';

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 120),
  created_by uuid not null references public.profiles (id) on delete cascade,
  invite_code text not null default public.generate_invite_code(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint groups_invite_code_format
    check (invite_code = upper(invite_code) and invite_code ~ '^[A-F0-9]{10}$'),
  constraint groups_invite_code_key unique (invite_code)
);

comment on table public.groups is
  'Shared closets that users create or join with an invite code.';

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (group_id, user_id),
  constraint group_members_role_check check (role in ('owner', 'member'))
);

comment on table public.group_members is
  'Membership and owner/member role assignments for shared closet groups.';

create table public.borrowed_items (
  id uuid primary key default gen_random_uuid(),
  borrower_id uuid not null references public.profiles (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  closet_item_id uuid not null references public.closet_items (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  borrowed_at timestamptz not null default timezone('utc', now()),
  returned_at timestamptz,
  constraint borrowed_items_different_users check (borrower_id <> owner_id),
  constraint borrowed_items_return_order
    check (returned_at is null or returned_at >= borrowed_at)
);

comment on table public.borrowed_items is
  'Borrow and return history for closet items shared within groups.';

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger closet_items_set_updated_at
before update on public.closet_items
for each row execute function public.set_updated_at();

create trigger groups_set_updated_at
before update on public.groups
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), '')
  )
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Creates the public profile required by application foreign keys after signup.';

create trigger on_auth_user_created
after insert or update of email on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, email, display_name)
select
  users.id,
  users.email,
  nullif(btrim(users.raw_user_meta_data ->> 'display_name'), '')
from auth.users as users
on conflict (id) do update
  set email = excluded.email;

alter table public.profiles enable row level security;
alter table public.closet_items enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.borrowed_items enable row level security;

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete
  on public.profiles,
     public.closet_items,
     public.groups,
     public.group_members,
     public.borrowed_items
  to authenticated;
grant all
  on public.profiles,
     public.closet_items,
     public.groups,
     public.group_members,
     public.borrowed_items
  to service_role;

-- Phase 3 will add explicit RLS policies. Until then, authenticated Data API
-- access to a fresh local database is intentionally denied by RLS.
