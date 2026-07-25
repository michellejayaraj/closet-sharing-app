-- Additive reconciliation for the schema observed in the hosted project.
-- This migration is also safe after the fresh-database baseline migrations.

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

alter table public.profiles
  add column if not exists updated_at timestamptz;
alter table public.closet_items
  add column if not exists updated_at timestamptz;
alter table public.groups
  add column if not exists updated_at timestamptz;

update public.profiles
set
  created_at = coalesce(created_at, timezone('utc', now())),
  updated_at = coalesce(updated_at, created_at, timezone('utc', now()))
where created_at is null or updated_at is null;

update public.closet_items
set
  borrowed = coalesce(borrowed, false),
  created_at = coalesce(created_at, timezone('utc', now())),
  updated_at = coalesce(updated_at, created_at, timezone('utc', now()))
where borrowed is null or created_at is null or updated_at is null;

update public.groups
set
  created_at = coalesce(created_at, timezone('utc', now())),
  updated_at = coalesce(updated_at, created_at, timezone('utc', now()))
where created_at is null or updated_at is null;

update public.group_members
set
  role = coalesce(role, 'member'),
  joined_at = coalesce(joined_at, timezone('utc', now()))
where role is null or joined_at is null;

update public.borrowed_items
set borrowed_at = coalesce(borrowed_at, timezone('utc', now()))
where borrowed_at is null;

alter table public.profiles
  alter column created_at set default timezone('utc', now()),
  alter column created_at set not null,
  alter column updated_at set default timezone('utc', now()),
  alter column updated_at set not null;

alter table public.closet_items
  alter column name set default '',
  alter column image_url drop default,
  alter column image_url set not null,
  alter column borrowed set default false,
  alter column borrowed set not null,
  alter column created_at set default timezone('utc', now()),
  alter column created_at set not null,
  alter column updated_at set default timezone('utc', now()),
  alter column updated_at set not null;

alter table public.groups
  alter column created_by set not null,
  alter column invite_code set not null,
  alter column created_at set default timezone('utc', now()),
  alter column created_at set not null,
  alter column updated_at set default timezone('utc', now()),
  alter column updated_at set not null;

alter table public.group_members
  alter column group_id set not null,
  alter column user_id set not null,
  alter column role set default 'member',
  alter column role set not null,
  alter column joined_at set default timezone('utc', now()),
  alter column joined_at set not null;

alter table public.borrowed_items
  alter column borrower_id set not null,
  alter column owner_id set not null,
  alter column closet_item_id set not null,
  alter column group_id set not null,
  alter column borrowed_at set default timezone('utc', now()),
  alter column borrowed_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.groups'::regclass
      and conname = 'groups_name_length_check'
  ) then
    alter table public.groups
      add constraint groups_name_length_check
      check (length(btrim(name)) between 1 and 120);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.group_members'::regclass
      and conname = 'group_members_role_check'
  ) then
    alter table public.group_members
      add constraint group_members_role_check
      check (role in ('owner', 'member'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.borrowed_items'::regclass
      and conname = 'borrowed_items_different_users'
  ) then
    alter table public.borrowed_items
      add constraint borrowed_items_different_users
      check (borrower_id <> owner_id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.borrowed_items'::regclass
      and conname = 'borrowed_items_return_order'
  ) then
    alter table public.borrowed_items
      add constraint borrowed_items_return_order
      check (returned_at is null or returned_at >= borrowed_at);
  end if;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists closet_items_set_updated_at on public.closet_items;
create trigger closet_items_set_updated_at
before update on public.closet_items
for each row execute function public.set_updated_at();

drop trigger if exists groups_set_updated_at on public.groups;
create trigger groups_set_updated_at
before update on public.groups
for each row execute function public.set_updated_at();

create index if not exists closet_items_user_created_at_idx
  on public.closet_items (user_id, created_at desc);

create index if not exists group_members_user_id_idx
  on public.group_members (user_id);

create unique index if not exists group_members_one_owner_per_group_idx
  on public.group_members (group_id)
  where role = 'owner';

create index if not exists borrowed_items_borrower_returned_at_idx
  on public.borrowed_items (borrower_id, returned_at);

create index if not exists borrowed_items_owner_returned_at_idx
  on public.borrowed_items (owner_id, returned_at);

create index if not exists borrowed_items_group_returned_at_idx
  on public.borrowed_items (group_id, returned_at);

do $$
begin
  if to_regclass('public.borrowed_items_one_active_borrower_idx') is null
    and to_regclass('public.one_active_borrow_per_item') is null then
    create unique index borrowed_items_one_active_borrower_idx
      on public.borrowed_items (closet_item_id)
      where returned_at is null;
  end if;
end;
$$;

