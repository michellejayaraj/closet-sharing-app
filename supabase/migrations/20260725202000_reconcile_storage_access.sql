-- Remove duplicate legacy policies and require user-scoped object paths for
-- every write. Buckets remain public for the URLs used by the current client.

drop policy if exists "Allow public to view avatars" on storage.objects;
drop policy if exists "Allow users to update their own avatar" on storage.objects;
drop policy if exists "Allow users to upload their own avatar" on storage.objects;
drop policy if exists "Avatar Update" on storage.objects;
drop policy if exists "Avatar Upload" on storage.objects;
drop policy if exists "Avatar View" on storage.objects;
drop policy if exists "Images are publicly accessible" on storage.objects;
drop policy if exists "Users can upload their own images" on storage.objects;

create policy public_read_application_images
on storage.objects
for select
to public
using (bucket_id in ('avatars', 'closet-images'));

create policy users_insert_own_application_images
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('avatars', 'closet-images')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy users_update_own_application_images
on storage.objects
for update
to authenticated
using (
  bucket_id in ('avatars', 'closet-images')
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id in ('avatars', 'closet-images')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy users_delete_own_application_images
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('avatars', 'closet-images')
  and (storage.foldername(name))[1] = auth.uid()::text
);

