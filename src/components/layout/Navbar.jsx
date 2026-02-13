import { NavLink } from 'react-router-dom'

const baseLink =
  'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 hover:text-zinc-900'

const activeLink = 'bg-white text-zinc-900 shadow-sm'
const inactiveLink = 'text-zinc-600'

export function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <div className="text-sm font-semibold tracking-tight">Closet Sharing App</div>

        <nav className="flex items-center gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${baseLink} ${isActive ? activeLink : inactiveLink}`
            }
          >
            My Closet
          </NavLink>
          <NavLink
            to="/friends"
            className={({ isActive }) =>
              `${baseLink} ${isActive ? activeLink : inactiveLink}`
            }
          >
            Friend&apos;s Closet
          </NavLink>
          <NavLink
            to="/borrowed"
            className={({ isActive }) =>
              `${baseLink} ${isActive ? activeLink : inactiveLink}`
            }
          >
            Borrowed
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
