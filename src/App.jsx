import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { Layout } from './components/layout/Layout.jsx'
import { BorrowedItems } from './pages/BorrowedItems.jsx'
import { FriendsCloset } from './pages/FriendsCloset.jsx'
import { MyCloset } from './pages/MyCloset.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<MyCloset />} />
          <Route path="/friends" element={<FriendsCloset />} />
          <Route path="/borrowed" element={<BorrowedItems />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
