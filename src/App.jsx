import { useCallback, useEffect, useState } from 'react'
import AdminSettingsModal from './components/AdminSettingsModal'
import AuthGate from './components/AuthGate'
import InlineEditableText from './components/InlineEditableText'
import Navigation from './components/Navigation'
import PageEditToolbar from './components/PageEditToolbar'
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

function updateNestedValue(source, path, value) {
  const [key, ...rest] = path
  if (rest.length === 0) return { ...source, [key]: value }
  return { ...source, [key]: updateNestedValue(source[key] ?? {}, rest, value) }
}

function pageFromHash() {
  const hash = window.location.hash.replace('#/', '')
  return pageIds.has(hash) ? hash : 'home'
}

function SiteApp({ session, onSignOut }) {
  const [data, setData, { syncStatus, syncError }] = usePersistentData(session.user.id)
  const [activePage, setActivePage] = useState(pageFromHash)
  const [adminOpen, setAdminOpen] = useState(false)
  const [pageEditing, setPageEditing] = useState(false)
  const [editingSettings, setEditingSettings] = useState(null)
  const settings = data.siteSettings ?? siteConfig
  const displayedSettings = pageEditing && editingSettings ? editingSettings : settings

  useEffect(() => {
    const handleHashChange = () => setActivePage(pageFromHash())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    document.title = displayedSettings.siteName
  }, [displayedSettings.siteName])

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

  const startPageEditing = () => {
    setEditingSettings(JSON.parse(JSON.stringify(settings)))
    setPageEditing(true)
  }

  const updateSettingsText = (path, value) => {
    setEditingSettings((current) => updateNestedValue(current ?? settings, path, value))
  }

  const savePageEditing = () => {
    if (editingSettings) saveSiteSettings(editingSettings)
    setPageEditing(false)
    setEditingSettings(null)
  }

  const cancelPageEditing = () => {
    setPageEditing(false)
    setEditingSettings(null)
  }

  const pageTextProps = (page) => ({
    pageText: displayedSettings.pages[page],
    pageEditing,
    onPageTextChange: (field, value) => updateSettingsText(['pages', page, field], value),
  })

  const sharedActions = { addItem, updateItem, deleteItem }
  const pages = {
    home: <HomePage data={data} settings={displayedSettings} onNavigate={navigate} onHeroPhotoUploaded={(path) => setData((current) => ({ ...current, heroPhotoPath: path }))} pageEditing={pageEditing} onSettingsTextChange={updateSettingsText} />,
    timeline: <TimelinePage items={data.timeline} {...sharedActions} {...pageTextProps('timeline')} />,
    daily: <DailyPage items={data.daily} {...sharedActions} {...pageTextProps('daily')} />,
    gallery: <GalleryPage items={data.gallery} {...sharedActions} {...pageTextProps('gallery')} />,
    wishes: <WishesPage items={data.wishes} {...sharedActions} {...pageTextProps('wishes')} />,
    anniversaries: <AnniversariesPage items={data.anniversaries} {...sharedActions} {...pageTextProps('anniversaries')} />,
    messages: <MessagesPage items={data.messages} settings={displayedSettings} {...sharedActions} {...pageTextProps('messages')} />,
  }

  return (
    <div className="app-shell">
      <Navigation
        activePage={activePage}
        onNavigate={navigate}
        data={data}
        onImport={(imported) => setData(normalizeSiteData(imported))}
        user={session.user}
        siteSettings={displayedSettings}
        syncStatus={syncStatus}
        onOpenAdmin={() => { cancelPageEditing(); setAdminOpen(true) }}
        onStartPageEdit={startPageEditing}
        pageEditing={pageEditing}
        onSignOut={onSignOut}
      />
      {syncError && <div className="sync-banner" role="status">{syncError}</div>}
      <main className="site-main" key={activePage}>{pages[activePage]}</main>
      <footer className="site-footer">
        <span aria-hidden="true">♡</span> <InlineEditableText value={displayedSettings.footerText} editing={pageEditing} onChange={(value) => updateSettingsText(['footerText'], value)} ariaLabel="页脚文字" />
        <small>登录后的记录会保存到私有云端，也建议定期导出备份。</small>
      </footer>
      {pageEditing && <PageEditToolbar onSave={savePageEditing} onCancel={cancelPageEditing} />}
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
