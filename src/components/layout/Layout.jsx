import { Outlet } from 'react-router-dom'

import { Navbar } from './Navbar.jsx'

export function Layout() {
  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
