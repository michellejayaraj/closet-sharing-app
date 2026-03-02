# Closet

A React (Expo/React Native) MVP for a centralized platform where users can add clothing items, view a friend's closet, and borrow/return items.

## End goal (MVP features)

- **Add clothing items** — Users can add items to their own closet (with image URL and name).
- **View a friend's closet** — Browse a friend's closet in a grid; items show image and name.
- **Borrow and return items** — Borrow items from the friend's closet and return them from a dedicated "Borrowed Items" screen.

## Current status

### Implemented

- **My Closet** ([pages/MyCloset.js](pages/MyCloset.js)) — Add items via modal, view grid, open item detail, delete from own closet.
- **Friends Closet** ([pages/FriendsCloset.js](pages/FriendsCloset.js)) — View friend's items in a grid, borrow from grid or from item detail modal (borrowed state persisted).
- **Borrowed Items** ([pages/BorrowedItems.js](pages/BorrowedItems.js)) — List of currently borrowed items with "Return" action.
- **Data** ([hooks/useCloset.js](hooks/useCloset.js)) — Manages `myCloset` and `friendsCloset` with AsyncStorage; friend's closet is seeded with sample items on first run.
- **Navigation** ([index.js](index.js)) — React Navigation stack with Layout/Navbar; three screens: My Closet, Friends Closet, Borrowed.

## Tech stack

- **Expo** (~54) with React 19.1, React Native 0.81
- **React Navigation** (native stack) for screens
- **AsyncStorage** for local persistence
- **lucide-react-native** for icons
- Targets: iOS, Android, Web (`expo start --web`)

## Project structure

- `index.js` — App entry, navigation, Layout wrapper
- `pages/` — MyCloset, FriendsCloset, BorrowedItems
- `components/` — layout (Layout, Navbar), closet (ClosetGrid, ClosetItem), modals (AddItemModal, ItemDetailModal)
- `hooks/useCloset.js` — closet state and persistence (add, borrow, return, delete)

## Getting started

**Prerequisites:** Node.js, npm (or yarn)

```bash
npm install
npm start
```

Then choose iOS, Android, or Web in the terminal, or run:

- `npm run ios`
- `npm run android`
- `npm run web`
