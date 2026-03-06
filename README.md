# Closet

A React (Expo/React Native) app for a platform where users can add clothing items, join groups, view group members' closets, borrow and return items, and manage their profile.

## Features

- **My Closet** — Add items (with photo and name), view grid, delete items, pull-to-refresh
- **Groups** — Create groups, join by invite code, share invite code, swipe to delete (owners) or leave (members)
- **Group Detail** — View group members as tabs with avatars, browse each member's closet in a grid, tap items to borrow, edit group name
- **Borrowed Items** — List borrowed items with owner, date, and Return button; pull-to-refresh
- **Profile** — Avatar (with crop editor), display name, find friends search, sign out

## Tech stack

- **Expo** (~54) with React 19.1, React Native 0.81
- **Supabase** — Auth, PostgreSQL (profiles, closet_items, groups, group_members, borrowed_items), Storage (avatars, closet-images)
- **React Navigation** — Native stack with Layout/Navbar
- **expo-image-picker** — Avatar and item photos
- **expo-image-manipulator** — Avatar crop and resize
- **react-native-gesture-handler** — Swipeable (Groups), crop gestures (Profile)
- **react-native-keyboard-aware-scroll-view** — Profile friend search
- **@expo/vector-icons** — Feather icons
- **lucide-react-native** — Trash icon (ClosetItem)
- Targets: iOS, Android, Web (`expo start --web`)

## Project structure

- `index.js` — App entry, auth state, navigation stack (Auth, authenticated screens)
- `pages/` — Auth, MyCloset, Groups, GroupDetail, BorrowedItems, Profile
- `components/` — layout (Layout, Navbar), closet (ClosetGrid, ClosetItem), modals (AddItemModal, ItemDetailModal)
- `hooks/useCloset.js` — My closet state from Supabase (add, delete, refetch)
- `lib/supabase.js` — Supabase client

## Supabase tables

- **profiles** — id, email, display_name, avatar_url, avatar_original_url
- **closet_items** — id, user_id, name, image_url
- **groups** — id, name, created_by, invite_code
- **group_members** — group_id, user_id, role (owner/member)
- **borrowed_items** — id, borrower_id, owner_id, closet_item_id, group_id, borrowed_at, returned_at

## Storage buckets

- **avatars** — `{userId}/avatar.jpg` (cropped 400x400), `{userId}/avatar_original.jpg` (full original)
- **closet-images** — `{userId}/{timestamp}.ext` for item photos

## Getting started

**Prerequisites:** Node.js, npm (or yarn), Expo CLI

1. Configure Supabase: create project, add tables and RLS policies, storage buckets (avatars, closet-images)
2. Update `lib/supabase.js` with your Supabase URL and anon key if needed

```bash
npm install
npm start
```

Then choose iOS, Android, or Web in the terminal, or run:

- `npm run ios`
- `npm run android`
- `npm run web`
