-- Indexes supporting the query patterns currently used by the Expo client.

create index closet_items_user_created_at_idx
  on public.closet_items (user_id, created_at desc);

create index group_members_user_id_idx
  on public.group_members (user_id);

create unique index group_members_one_owner_per_group_idx
  on public.group_members (group_id)
  where role = 'owner';

create index borrowed_items_borrower_returned_at_idx
  on public.borrowed_items (borrower_id, returned_at);

create index borrowed_items_owner_returned_at_idx
  on public.borrowed_items (owner_id, returned_at);

create index borrowed_items_group_returned_at_idx
  on public.borrowed_items (group_id, returned_at);

create unique index borrowed_items_one_active_borrower_idx
  on public.borrowed_items (closet_item_id)
  where returned_at is null;

comment on index public.borrowed_items_one_active_borrower_idx is
  'Database-level concurrency guard: a closet item can have only one active borrowing record.';
