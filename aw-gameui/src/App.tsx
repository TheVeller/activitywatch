import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProfileHome from './pages/ProfileHome'
import LovemarkLibrary from './pages/LovemarkLibrary'
import AppDetail from './pages/AppDetail'
import TrophyRoom from './pages/TrophyRoom'
import ActivityFeed from './pages/ActivityFeed'
import Settings from './pages/Settings'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<ProfileHome />} />
          <Route path="/library" element={<LovemarkLibrary />} />
          <Route path="/app/:appId" element={<AppDetail />} />
          <Route path="/trophies" element={<TrophyRoom />} />
          <Route path="/feed" element={<ActivityFeed />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
