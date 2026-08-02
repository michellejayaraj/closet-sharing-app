-- Return the current user's groups and their four newest closet images in one
-- bounded database request. This replaces two client requests per group.

create or replace function public.get_my_groups_with_previews()
returns table (
  id uuid,
  name text,
  invite_code text,
  created_by uuid,
  role text,
  preview_images text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    target_group.id,
    target_group.name,
    target_group.invite_code,
    target_group.created_by,
    membership.role,
    coalesce(previews.image_urls, array[]::text[]) as preview_images
  from public.group_members as membership
  join public.groups as target_group
    on target_group.id = membership.group_id
  left join lateral (
    select array_agg(recent_item.image_url order by recent_item.created_at desc)
      as image_urls
    from (
      select item.image_url, item.created_at
      from public.group_members as group_member
      join public.closet_items as item
        on item.user_id = group_member.user_id
      where group_member.group_id = target_group.id
        and item.image_url is not null
      order by item.created_at desc
      limit 4
    ) as recent_item
  ) as previews on true
  where membership.user_id = auth.uid()
  order by target_group.created_at desc;
$$;

comment on function public.get_my_groups_with_previews() is
  'Returns only the caller groups with at most four recent preview images per group.';

revoke all on function public.get_my_groups_with_previews() from public, anon;
grant execute on function public.get_my_groups_with_previews() to authenticated;
