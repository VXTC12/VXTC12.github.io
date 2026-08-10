import { useCallback, useEffect, useState } from 'react'
import AdminSettingsModal from './components/AdminSettingsModal'
import AuthGate from './components/AuthGate'
import Navigation from './components/Navigation'
import { siteConfig } from './data/siteConfig'
import { normalizeSiteData, usePersistentData } from './hooks/usePersistentData'
import AnniversariesPage from './pages/AnniversariesPage'
import DailyPage from './pages/DailyPage'
import GalleryPage from './pages/GalleryPage'
import HomePage from './pages/HomePage'
import MessagesPage from './pages/MessagesPage'
import TimelinePage from './pages/TimelinePage'
import WishesPage from './pages/WishesPage'
import { createId } from './utils/id'

const pageIds = new Set(['home', 'timeline', 'daily', 'gallery', 'wishes', 'anniversaries', 'messages'])

function isRelationshipAnniversary(item) {
  return item.id === 'anniversary-1'
    || item.title === '纪念日'
    || item.title?.includes('恋爱')
}

function settingsWithRelationshipDate(settings, date) {
  return {
    ...settings,
    couple: { ...settings.couple, relationshipStart: date },
  }
}

function pageFromHash() {
  const hash = window.location.hash.replace('#/', '')
  return pageIds.has(hash) ? hash : 'home'
}

function SiteApp({ session, onSignOut }) {
  const [data, setData, { syncStatus, syncError }] = usePersistentData(session.user.id)
  const [activePage, setActivePage] = useState(pageFromHash)
  const [adminOpen, setAdminOpen] = useState(false)
  const settings = data.siteSettings ?? siteConfig

  useEffect(() => {
    const handleHashChange = () => setActivePage(pageFromHash())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    document.title = settings.siteName
  }, [settings.siteName])

  const navigate = useCallback((page) => {
    window.location.hash = `/${page}`
    setActivePage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const addItem = (section, item) => {
    setData((current) => ({
      ...current,
      [section]: [item, ...current[section]],
      siteSettings: section === 'anniversaries' && isRelationshipAnniversary(item)
        ? settingsWithRelationshipDate(current.siteSettings, item.date)
        : current.siteSettings,
    }))
  }

  const updateItem = (section, item) => {
    setData((current) => ({
      ...current,
      [section]: current[section].map((entry) => (entry.id === item.id ? item : entry)),
      siteSettings: section === 'anniversaries' && isRelationshipAnniversary(item)
        ? settingsWithRelationshipDate(current.siteSettings, item.date)
        : current.siteSettings,
    }))
  }

  const deleteItem = (section, id) => {
    setData((current) => ({
      ...current,
      [section]: current[section].filter((entry) => entry.id !== id),
    }))
  }

  const saveSiteSettings = (nextSettings) => {
    setData((current) => {
      let relationshipAnniversaryFound = false
      const anniversaries = current.anniversaries.map((item) => {
        if (!isRelationshipAnniversary(item) || relationshipAnniversaryFound) return item
        relationshipAnniversaryFound = true
        return { ...item, date: nextSettings.couple.relationshipStart, repeatYearly: true }
      })

      if (!relationshipAnniversaryFound) {
        anniversaries.unshift({
          id: createId('anniversary'),
          title: '恋爱纪念日',
          date: nextSettings.couple.relationshipStart,
          repeatYearly: true,
          note: '每年都要认真庆祝我们又多了一年的故事。',
        })
      }

      return { ...current, siteSettings: nextSettings, anniversaries }
    })
  }

  const sharedActions = { addItem, updateItem, deleteItem }
  const pages = {
    home: <HomePage data={data} settings={settings} onNavigate={navigate} onHeroPhotoUploaded={(path) => setData((current) => ({ ...current, heroPhotoPath: path }))} />,
    timeline: <TimelinePage items={data.timeline} {...sharedActions} />,
    daily: <DailyPage items={data.daily} {...sharedActions} />,
    gallery: <GalleryPage items={data.gallery} />,
    wishes: <WishesPage items={data.wishes} {...sharedActions} />,
    anniversaries: <AnniversariesPage items={data.anniversaries} {...sharedActions} />,
    messages: <MessagesPage items={data.messages} settings={settings} {...sharedActions} />,
  }

  return (
    <div className="app-shell">
      <Navigation
        activePage={activePage}
        onNavigate={navigate}
        data={data}
        onImport={(imported) => setData(normalizeSiteData(imported))}
        user={session.user}
        siteSettings={settings}
        syncStatus={syncStatus}
        onOpenAdmin={() => setAdminOpen(true)}
        onSignOut={onSignOut}
      />
      {syncError && <div className="sync-banner" role="status">{syncError}</div>}
      <main className="site-main" key={activePage}>{pages[activePage]}</main>
      <footer className="site-footer">
        <span aria-hidden="true">♡</span> {settings.footerText}
        <small>登录后的记录会保存到私有云端，也建议定期导出备份。</small>
      </footer>
      {adminOpen && (
        <AdminSettingsModal
          settings={settings}
          onSave={saveSiteSettings}
          onClose={() => setAdminOpen(false)}
        />
      )}
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
