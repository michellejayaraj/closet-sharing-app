-- Reveal only whether a visible closet item has an active borrowing record.
-- Borrower identity and borrowing-group details remain private.

create or replace function public.get_unavailable_closet_item_ids(
  item_ids_input uuid[]
)
returns table (closet_item_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct active_borrow.closet_item_id
  from public.borrowed_items as active_borrow
  join public.closet_items as item
    on item.id = active_borrow.closet_item_id
  where auth.uid() is not null
    and active_borrow.returned_at is null
    and active_borrow.closet_item_id = any (
      coalesce(item_ids_input, array[]::uuid[])
    )
    and (
      item.user_id = auth.uid()
      or exists (
        select 1
        from public.group_members as mine
        join public.group_members as owner_membership
          on owner_membership.group_id = mine.group_id
        where mine.user_id = auth.uid()
          and owner_membership.user_id = item.user_id
      )
    );
$$;

comment on function public.get_unavailable_closet_item_ids(uuid[]) is
  'Returns active-borrow item IDs visible to the caller without exposing borrower identity.';

revoke all
  on function public.get_unavailable_closet_item_ids(uuid[])
  from public;

grant execute
  on function public.get_unavailable_closet_item_ids(uuid[])
  to authenticated;
