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

**Prerequisites:** Node.js and npm

1. Copy the environment template:

```bash
cp .env.example .env.local
```

2. Put the target Supabase project URL and public anon/publishable key in
   `.env.local`.
3. Configure that Supabase project with the migrations and storage buckets.

```bash
npm ci
npm start
```

Expo embeds variables prefixed with `EXPO_PUBLIC_` in the client bundle. The
Supabase anon/publishable key is designed for client use; authorization still
depends on correct database and storage policies. Never put a service-role key
in an `EXPO_PUBLIC_` variable.

To switch between production and staging, stop Expo, replace the two values in
the ignored `.env.local` file, then restart with a cleared cache:

```bash
npx expo start --clear
```

Then choose iOS, Android, or Web in the terminal, or run:

- `npm run ios`
- `npm run android`
- `npm run web`

## Quality checks

Install the exact dependency versions from the lockfile and run the complete
local verification suite:

```bash
npm ci
npm run verify
```

The combined verification command checks Expo dependency compatibility, runs
ESLint, verifies formatting, executes smoke tests, and creates a production web
export in `dist/`.

Checks can also be run separately:

- `npm run doctor` — validate Expo configuration and dependency compatibility
- `npm run lint` — lint JavaScript source and configuration
- `npm run format:check` — check formatting without changing files
- `npm test` — run the Node-based smoke tests
- `npm run build:web` — create the production web export
- `npm run format` — apply the repository's formatting rules
