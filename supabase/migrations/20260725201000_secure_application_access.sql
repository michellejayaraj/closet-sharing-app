-- Replace the hosted project's permissive and incomplete policies with a
-- membership-aware access model. Group creation and invite redemption are
-- transactional RPCs so invite codes never need a public table policy.

create or replace function public.is_group_member(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = target_group_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_group_owner(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = target_group_id
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

create or replace function public.create_group(group_name_input text)
returns public.groups
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  created_group public.groups;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if length(btrim(group_name_input)) not between 1 and 120 then
    raise exception 'Group name must be between 1 and 120 characters'
      using errcode = '22023';
  end if;

  insert into public.groups (name, created_by)
  values (btrim(group_name_input), auth.uid())
  returning * into created_group;

  insert into public.group_members (group_id, user_id, role)
  values (created_group.id, auth.uid(), 'owner');

  return created_group;
end;
$$;

create or replace function public.join_group_by_invite_code(
  invite_code_input text
)
returns public.groups
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  matched_group public.groups;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select *
  into matched_group
  from public.groups
  where invite_code = upper(btrim(invite_code_input));

  if not found then
    raise exception 'Invalid invite code' using errcode = 'P0002';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (matched_group.id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;

  return matched_group;
end;
$$;

revoke all on function public.is_group_member(uuid) from public;
revoke all on function public.is_group_owner(uuid) from public;
revoke all on function public.create_group(text) from public;
revoke all on function public.join_group_by_invite_code(text) from public;

grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.is_group_owner(uuid) to authenticated;
grant execute on function public.create_group(text) to authenticated;
grant execute on function public.join_group_by_invite_code(text) to authenticated;

alter table public.profiles enable row level security;
alter table public.closet_items enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.borrowed_items enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles',
        'closet_items',
        'groups',
        'group_members',
        'borrowed_items'
      )
  loop
    execute format(
      'drop policy %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end;
$$;

revoke all on public.profiles from anon, authenticated;
revoke all on public.closet_items from anon, authenticated;
revoke all on public.groups from anon, authenticated;
revoke all on public.group_members from anon, authenticated;
revoke all on public.borrowed_items from anon, authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.closet_items to authenticated;
grant select, update, delete on public.groups to authenticated;
grant select, delete on public.group_members to authenticated;
grant select, insert on public.borrowed_items to authenticated;
grant update (returned_at) on public.borrowed_items to authenticated;

create policy profiles_read_authenticated
on public.profiles
for select
to authenticated
using (true);

create policy profiles_insert_self
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy closet_items_read_group_closets
on public.closet_items
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.group_members as mine
    join public.group_members as theirs
      on theirs.group_id = mine.group_id
    where mine.user_id = auth.uid()
      and theirs.user_id = closet_items.user_id
  )
);

create policy closet_items_insert_self
on public.closet_items
for insert
to authenticated
with check (user_id = auth.uid());

create policy closet_items_update_self
on public.closet_items
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy closet_items_delete_self
on public.closet_items
for delete
to authenticated
using (user_id = auth.uid());

create policy groups_read_members
on public.groups
for select
to authenticated
using (
  created_by = auth.uid()
  or public.is_group_member(id)
);

create policy groups_update_owners
on public.groups
for update
to authenticated
using (public.is_group_owner(id))
with check (
  public.is_group_owner(id)
  and created_by = auth.uid()
);

create policy groups_delete_owners
on public.groups
for delete
to authenticated
using (public.is_group_owner(id));

create policy group_members_read_shared_groups
on public.group_members
for select
to authenticated
using (public.is_group_member(group_id));

create policy group_members_leave_self
on public.group_members
for delete
to authenticated
using (
  user_id = auth.uid()
  and role <> 'owner'
);

create policy borrowed_items_read_group_members
on public.borrowed_items
for select
to authenticated
using (
  borrower_id = auth.uid()
  or owner_id = auth.uid()
  or public.is_group_member(group_id)
);

create policy borrowed_items_insert_valid_borrow
on public.borrowed_items
for insert
to authenticated
with check (
  borrower_id = auth.uid()
  and borrower_id <> owner_id
  and public.is_group_member(group_id)
  and exists (
    select 1
    from public.group_members
    where group_id = borrowed_items.group_id
      and user_id = borrowed_items.owner_id
  )
  and exists (
    select 1
    from public.closet_items
    where id = borrowed_items.closet_item_id
      and user_id = borrowed_items.owner_id
  )
);

create policy borrowed_items_return_participant
on public.borrowed_items
for update
to authenticated
using (
  borrower_id = auth.uid()
  or owner_id = auth.uid()
)
with check (
  borrower_id = auth.uid()
  or owner_id = auth.uid()
);

