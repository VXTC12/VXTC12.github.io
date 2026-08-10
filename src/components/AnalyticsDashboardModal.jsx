import { useEffect, useMemo, useState } from 'react'
import { Activity, BarChart3, Eye, LoaderCircle, MonitorSmartphone, RefreshCw, Users } from 'lucide-react'
import { loadAnalytics } from '../services/analytics'
import Modal from './Modal'

const pageNames = {
  home: '首页',
  timeline: '时光轴',
  daily: '日常',
  gallery: '相册',
  wishes: '心愿',
  anniversaries: '纪念日',
  messages: '留言',
}

const platformNames = {
  web: '网页',
  android: 'Android',
  ios: 'iPhone',
}

function localDayKey(value) {
  const date = new Date(value)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function shortDayLabel(key) {
  const [, month, day] = key.split('-')
  return `${Number(month)}/${Number(day)}`
}

function formatVisitTime(value) {
  return new Date(value).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function summarize(rows, days, currentUserId) {
  const pageViews = rows.filter((row) => row.event_type === 'page_view')
  const sessions = rows.filter((row) => row.event_type === 'session')
  const activeUsers = new Set(rows.map((row) => row.user_id)).size

  const dailyMap = new Map()
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - offset)
    dailyMap.set(localDayKey(date), 0)
  }
  pageViews.forEach((row) => {
    const key = localDayKey(row.created_at)
    if (dailyMap.has(key)) dailyMap.set(key, dailyMap.get(key) + 1)
  })
  const daily = [...dailyMap.entries()].map(([date, count]) => ({ date, count }))

  const pageMap = new Map()
  pageViews.forEach((row) => pageMap.set(row.page_id, (pageMap.get(row.page_id) ?? 0) + 1))
  const pages = [...pageMap.entries()]
    .map(([page, count]) => ({ page, count }))
    .sort((a, b) => b.count - a.count)

  const platformMap = new Map()
  sessions.forEach((row) => platformMap.set(row.platform, (platformMap.get(row.platform) ?? 0) + 1))
  const platforms = [...platformMap.entries()]
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count)

  return {
    pageViews,
    sessions,
    activeUsers,
    daily,
    pages,
    platforms,
    recentSessions: sessions.slice(0, 8).map((row) => ({
      ...row,
      account: row.user_id === currentUserId ? '当前账号' : '另一账号',
    })),
  }
}

export default function AnalyticsDashboardModal({ user, onClose }) {
  const [days, setDays] = useState(7)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    loadAnalytics(days)
      .then((result) => { if (active) setData(result) })
      .catch((loadError) => { if (active) setError(loadError.message || '访问数据暂时无法读取。') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [days, refreshKey])

  useEffect(() => {
    const timer = window.setInterval(() => setRefreshKey((value) => value + 1), 30000)
    return () => window.clearInterval(timer)
  }, [])

  const summary = useMemo(() => summarize(data?.rows ?? [], days, user.id), [data, days, user.id])
  const maxDaily = Math.max(1, ...summary.daily.map((item) => item.count))
  const maxPage = Math.max(1, ...summary.pages.map((item) => item.count))

  return (
    <Modal title="访问流量监控" onClose={onClose} wide>
      <div className="analytics-toolbar">
        <div className="analytics-period" role="group" aria-label="统计时间范围">
          {[7, 30].map((period) => <button type="button" key={period} className={days === period ? 'active' : ''} onClick={() => setDays(period)}>近 {period} 天</button>)}
        </div>
        <button type="button" className="button secondary small" onClick={() => setRefreshKey((value) => value + 1)} disabled={loading}><RefreshCw className={loading ? 'spin' : ''} size={16} /> 刷新</button>
      </div>

      {loading && <div className="analytics-loading"><LoaderCircle className="spin" size={25} /> 正在整理访问数据…</div>}
      {!loading && error && <div className="analytics-error"><Activity size={23} /><strong>监控暂时还不能使用</strong><p>{error}</p></div>}

      {!loading && !error && data && (
        <div className="analytics-dashboard">
          <section className="analytics-metrics" aria-label="访问概览">
            <article><span><Eye size={18} /></span><div><small>今日浏览</small><strong>{data.todayViews}</strong></div></article>
            <article><span><BarChart3 size={18} /></span><div><small>累计浏览</small><strong>{data.totalViews}</strong></div></article>
            <article><span><MonitorSmartphone size={18} /></span><div><small>访问会话</small><strong>{data.totalSessions}</strong></div></article>
            <article><span><Users size={18} /></span><div><small>近 {days} 天活跃账号</small><strong>{summary.activeUsers}</strong></div></article>
          </section>

          <section className="analytics-panel analytics-trend-panel">
            <div className="analytics-heading"><div><p className="eyebrow">VISIT TREND</p><h3>每天浏览趋势</h3></div><span>近 {days} 天共 {summary.pageViews.length} 次浏览</span></div>
            <div className={`analytics-bars ${days === 30 ? 'analytics-bars--wide' : ''}`}>
              {summary.daily.map((item) => (
                <div className="analytics-bar-item" key={item.date} title={`${item.date}：${item.count} 次`}>
                  <strong>{item.count}</strong>
                  <span><i style={{ height: `${Math.max(4, (item.count / maxDaily) * 100)}%` }} /></span>
                  <small>{shortDayLabel(item.date)}</small>
                </div>
              ))}
            </div>
          </section>

          <div className="analytics-grid">
            <section className="analytics-panel">
              <div className="analytics-heading"><div><p className="eyebrow">POPULAR PAGES</p><h3>页面浏览排行</h3></div></div>
              {summary.pages.length ? <div className="analytics-ranking">{summary.pages.map((item) => (
                <div key={item.page}><div><strong>{pageNames[item.page] ?? item.page}</strong><span>{item.count} 次</span></div><i><b style={{ width: `${(item.count / maxPage) * 100}%` }} /></i></div>
              ))}</div> : <p className="analytics-empty">这段时间还没有页面浏览记录。</p>}
            </section>

            <section className="analytics-panel">
              <div className="analytics-heading"><div><p className="eyebrow">PLATFORMS</p><h3>访问平台</h3></div></div>
              {summary.platforms.length ? <div className="analytics-platforms">{summary.platforms.map((item) => (
                <div key={item.platform}><span><MonitorSmartphone size={17} /> {platformNames[item.platform] ?? item.platform}</span><strong>{item.count} 次会话</strong></div>
              ))}</div> : <p className="analytics-empty">这段时间还没有新的访问会话。</p>}
            </section>
          </div>

          <section className="analytics-panel">
            <div className="analytics-heading"><div><p className="eyebrow">RECENT VISITS</p><h3>最近访问</h3></div><span>仅显示账号、平台与时间</span></div>
            {summary.recentSessions.length ? <div className="analytics-recent">{summary.recentSessions.map((item) => (
              <div key={`${item.session_id}-${item.created_at}`}><span className="analytics-dot" /><strong>{item.account}</strong><span>{platformNames[item.platform] ?? item.platform} · {item.device_type}</span><time>{formatVisitTime(item.created_at)}</time></div>
            ))}</div> : <p className="analytics-empty">还没有访问记录，之后打开网站或 APP 就会开始统计。</p>}
          </section>

          <p className="analytics-privacy">隐私说明：只统计登录后的页面、访问时间、平台和设备类型，不采集 IP、密码、照片内容或精确位置。</p>
        </div>
      )}
    </Modal>
  )
}
