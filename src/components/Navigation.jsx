import {
  CalendarHeart,
  Camera,
  Heart,
  Home,
  ListChecks,
  LoaderCircle,
  MessageCircleHeart,
  NotebookTabs,
  SquareTerminal,
  Cloud,
  CloudOff,
} from 'lucide-react'
import AccountMenu from './AccountMenu'
import BackupControls from './BackupControls'

const navigationItems = [
  { id: 'home', label: '首页', icon: Home },
  { id: 'timeline', label: '时光轴', icon: NotebookTabs },
  { id: 'daily', label: '日常', icon: Heart },
  { id: 'gallery', label: '相册', icon: Camera },
  { id: 'wishes', label: '心愿', icon: ListChecks },
  { id: 'anniversaries', label: '纪念日', icon: CalendarHeart },
  { id: 'messages', label: '留言', icon: MessageCircleHeart },
  { id: 'dsh', label: 'DSH', icon: SquareTerminal, external: true },
]

export default function Navigation({ activePage, onNavigate, data, onImport, user, dshAccessToken, siteSettings, syncStatus, onOpenAdmin, onOpenAnalytics, onOpenPermissions, onOpenUpdate, onStartPageEdit, pageEditing, onSignOut }) {
  const SyncIcon = syncStatus === 'error' ? CloudOff : syncStatus === 'saving' || syncStatus === 'loading' ? LoaderCircle : Cloud
  const syncLabel = syncStatus === 'error' ? '仅本机保存' : syncStatus === 'saving' || syncStatus === 'loading' ? '同步中' : '已同步'

  const openDsh = () => {
    if (!dshAccessToken) return

    const form = document.createElement('form')
    form.method = 'POST'
    form.action = 'https://dsh.yg1224.com/__dsh/sso'
    form.target = '_self'
    form.hidden = true

    const token = document.createElement('input')
    token.type = 'hidden'
    token.name = 'access_token'
    token.value = dshAccessToken
    form.append(token)

    document.body.append(form)
    form.submit()
    form.remove()
  }

  return (
    <>
      <header className="site-header">
        <button type="button" className="brand" onClick={() => onNavigate('home')}>
          <span className="brand-mark"><Heart size={18} fill="currentColor" /></span>
          <span>{siteSettings.siteName}</span>
        </button>
        <nav className="desktop-nav" aria-label="主要导航">
          {navigationItems.map(({ id, label, external }) => external ? (
            <button key={id} type="button" onClick={openDsh} disabled={!dshAccessToken} title="使用当前账号打开 DSH">
              {label}
            </button>
          ) : (
            <button
              type="button"
              key={id}
              className={activePage === id ? 'active' : ''}
              onClick={() => onNavigate(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <BackupControls data={data} onImport={onImport} />
          <span className={`sync-state sync-state--${syncStatus}`} title={syncLabel}>
            <SyncIcon className={syncStatus === 'saving' || syncStatus === 'loading' ? 'spin' : ''} size={16} />
            <span>{syncLabel}</span>
          </span>
          <AccountMenu user={user} onOpenAdmin={onOpenAdmin} onOpenAnalytics={onOpenAnalytics} onOpenPermissions={onOpenPermissions} onOpenUpdate={onOpenUpdate} onStartPageEdit={onStartPageEdit} pageEditing={pageEditing} onSignOut={onSignOut} />
        </div>
      </header>

      <nav className="mobile-nav" aria-label="手机端主要导航">
        {navigationItems.map(({ id, label, icon: Icon, external }) => external ? (
          <button key={id} type="button" onClick={openDsh} disabled={!dshAccessToken} title="使用当前账号打开 DSH">
            <Icon size={19} strokeWidth={1.8} />
            <span>{label}</span>
          </button>
        ) : (
          <button
            type="button"
            key={id}
            className={activePage === id ? 'active' : ''}
            onClick={() => onNavigate(id)}
          >
            <Icon size={19} strokeWidth={activePage === id ? 2.4 : 1.8} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
