# Closet-Sharing App

A React MVP that allows users to:
- Add clothing items using image URLs
- View a friend’s closet
- Borrow and return items
- Persist data using localStorage

Built with React, Vite, React Router, and Tailwind CSS.

---

## Tech Stack

- React
- Vite
- React Router (v6)
- Tailwind CSS
- localStorage (no backend)

---

## Project Structure
App
└── Layout
    ├── Navbar
    └── Router
        ├── MyCloset
        │   ├── ClosetItem (multiple)
        │   ├── AddItemModal
        │   └── ItemDetailModal
        │
        ├── FriendsCloset
        │   ├── ClosetItem (multiple)
        │   └── ItemDetailModal (with borrow button)
        │
        └── BorrowedItems
            ├── ClosetItem (multiple)
            └── ItemDetailModal (with return button)
