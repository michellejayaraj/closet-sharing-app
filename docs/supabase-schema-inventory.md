# Supabase schema inventory

This inventory was derived from the application source and a read-only hosted
database catalog audit completed on July 25, 2026. No application rows were
selected during the audit.

## Tables

| Table            | Read by                                              | Written by                   | Required columns                                                                            |
| ---------------- | ---------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------- |
| `profiles`       | Profile, Group Detail, Borrowed Items, friend search | Profile                      | `id`, `email`, `display_name`, `avatar_url`, `avatar_original_url`                          |
| `closet_items`   | My Closet, Groups, Group Detail, Borrowed Items      | My Closet                    | `id`, `user_id`, `name`, `image_url`, `borrowed`, `created_at`                              |
| `groups`         | Groups, Group Detail                                 | Groups, Group Detail         | `id`, `name`, `created_by`, `invite_code`                                                   |
| `group_members`  | Groups, Group Detail, Profile                        | Groups                       | `group_id`, `user_id`, `role`                                                               |
| `borrowed_items` | Group Detail, Borrowed Items, Profile                | Group Detail, Borrowed Items | `id`, `borrower_id`, `owner_id`, `closet_item_id`, `group_id`, `borrowed_at`, `returned_at` |

## Relationships required by PostgREST

- `group_members.group_id` → `groups.id`
- `group_members.user_id` → `profiles.id`
- `borrowed_items.closet_item_id` → `closet_items.id`
- User-owned and membership identifiers ultimately reference `auth.users.id`
  through `profiles.id`

These relationships support nested selections such as
`groups(id, name, invite_code, created_by)`,
`profiles(id, email, display_name, avatar_url)`, and
`closet_items(id, name, image_url)`.

## Query and index map

| Query pattern                          | Supporting index or constraint                                            |
| -------------------------------------- | ------------------------------------------------------------------------- |
| User closet ordered newest-first       | `closet_items(user_id, created_at desc)`                                  |
| Groups for a user                      | `group_members(user_id)`                                                  |
| Group membership lookup                | Primary key `group_members(group_id, user_id)`                            |
| Invite-code lookup                     | Unique `groups(invite_code)`                                              |
| Active borrowed count/list by borrower | `borrowed_items(borrower_id, returned_at)`                                |
| Active lent count by owner             | `borrowed_items(owner_id, returned_at)`                                   |
| Active borrowing state within a group  | `borrowed_items(group_id, returned_at)`                                   |
| Prevent simultaneous active borrows    | Partial unique `borrowed_items(closet_item_id) where returned_at is null` |

## Storage

| Bucket          | Current object path                                        | Current access model |
| --------------- | ---------------------------------------------------------- | -------------------- |
| `avatars`       | `<user-id>/avatar.jpg` and `<user-id>/avatar_original.jpg` | Public URL           |
| `closet-images` | `<user-id>/<timestamp>.<extension>`                        | Public URL           |

The local configuration preserves public buckets for compatibility. The
reconciliation migrations replace duplicate hosted policies with authenticated,
user-folder-scoped upload, update, and delete policies. A later image-lifecycle
phase should evaluate private buckets and signed URLs.

## Hosted schema differences observed

- `profiles`, `closet_items`, and `groups` were missing `updated_at`.
- Several relationship, timestamp, and state columns were nullable even though
  every hosted row contained a value.
- `closet_items.name` and `closet_items.image_url` had the literal default
  `NOT NULL`; the reconciliation removes that accidental image default and
  restores a safe empty-name default.
- Hosted `group_members` uses a surrogate `id` primary key plus a unique
  `(group_id, user_id)` constraint. The fresh baseline uses the natural
  composite primary key. The additive reconciliation leaves the hosted `id`
  intact to avoid a destructive rewrite.
- The hosted database already has a partial unique active-borrow index under
  the name `one_active_borrow_per_item`.
- `profiles` had RLS disabled. Other application tables had a mix of overly
  broad and incomplete policies.
- Group invite codes were visible through a policy permitting every group row
  to be selected. Invite redemption is now designed as an atomic RPC so that
  policy is no longer required.

## Known schema-level limitations

- The client writes `closet_items.borrowed`, but borrowing and returning do not
  update it. `borrowed_items` is therefore the reliable borrowing history.
- Group creation and owner membership use one transactional RPC.
- Invite redemption and membership creation use one transactional RPC.
- Borrow policies verify the borrower, owner, item ownership, and shared group
  membership before insert.
- Profile email is duplicated from `auth.users` for client-side friend search.
- All signed-in users can currently read profile emails because friend search
  depends on them. A later privacy phase should replace this with a narrow
  search RPC.
