import { useCallback, useEffect, useState } from 'react'
import AuthGate from './components/AuthGate'
import Navigation from './components/Navigation'
import { siteConfig } from './data/siteConfig'
import { usePersistentData } from './hooks/usePersistentData'
import AnniversariesPage from './pages/AnniversariesPage'
import DailyPage from './pages/DailyPage'
import GalleryPage from './pages/GalleryPage'
import HomePage from './pages/HomePage'
import MessagesPage from './pages/MessagesPage'
import TimelinePage from './pages/TimelinePage'
import WishesPage from './pages/WishesPage'

const pageIds = new Set(['home', 'timeline', 'daily', 'gallery', 'wishes', 'anniversaries', 'messages'])

function pageFromHash() {
  const hash = window.location.hash.replace('#/', '')
  return pageIds.has(hash) ? hash : 'home'
}

function SiteApp({ session, onSignOut }) {
  const [data, setData, { syncStatus, syncError }] = usePersistentData(session.user.id)
  const [activePage, setActivePage] = useState(pageFromHash)

  useEffect(() => {
    const handleHashChange = () => setActivePage(pageFromHash())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigate = useCallback((page) => {
    window.location.hash = `/${page}`
    setActivePage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const addItem = (section, item) => {
    setData((current) => ({ ...current, [section]: [item, ...current[section]] }))
  }

  const updateItem = (section, item) => {
    setData((current) => ({
      ...current,
      [section]: current[section].map((entry) => (entry.id === item.id ? item : entry)),
    }))
  }

  const deleteItem = (section, id) => {
    setData((current) => ({
      ...current,
      [section]: current[section].filter((entry) => entry.id !== id),
    }))
  }

  const sharedActions = { addItem, updateItem, deleteItem }
  const pages = {
    home: <HomePage data={data} onNavigate={navigate} onHeroPhotoUploaded={(path) => setData((current) => ({ ...current, heroPhotoPath: path }))} />,
    timeline: <TimelinePage items={data.timeline} {...sharedActions} />,
    daily: <DailyPage items={data.daily} {...sharedActions} />,
    gallery: <GalleryPage items={data.gallery} />,
    wishes: <WishesPage items={data.wishes} {...sharedActions} />,
    anniversaries: <AnniversariesPage items={data.anniversaries} {...sharedActions} />,
    messages: <MessagesPage items={data.messages} {...sharedActions} />,
  }

  return (
    <div className="app-shell">
      <Navigation
        activePage={activePage}
        onNavigate={navigate}
        data={data}
        onImport={setData}
        user={session.user}
        syncStatus={syncStatus}
        onSignOut={onSignOut}
      />
      {syncError && <div className="sync-banner" role="status">{syncError}</div>}
      <main className="site-main" key={activePage}>{pages[activePage]}</main>
      <footer className="site-footer">
        <span aria-hidden="true">♡</span> {siteConfig.footerText}
        <small>登录后的记录会保存到私有云端，也建议定期导出备份。</small>
      </footer>
    </div>
  )
}

function App() {
  return (
    <AuthGate>
      {({ session, signOut }) => <SiteApp session={session} onSignOut={signOut} />}
    </AuthGate>
  )
}

export default App
