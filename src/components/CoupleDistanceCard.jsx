import { useCallback, useEffect, useMemo, useState } from 'react'
import { Clock3, LocateFixed, MapPinned, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'
import {
  distanceBetween,
  formatDistance,
  loadCoupleLocations,
  locationAgeLabel,
  shareMyLocation,
  stopSharingLocation,
} from '../services/coupleLocation'
import InlineEditableText from './InlineEditableText'

export default function CoupleDistanceCard({ user, pageText, editing = false, onTextChange }) {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('')
  const [message, setMessage] = useState('')

  const refresh = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true)
    try {
      setLocations(await loadCoupleLocations())
      if (!quiet) setMessage('')
    } catch (error) {
      if (!quiet) setMessage(error?.message || '位置读取失败，请稍后再试。')
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const timer = window.setInterval(() => refresh({ quiet: true }), 30000)
    return () => window.clearInterval(timer)
  }, [refresh])

  const myLocation = locations.find((location) => location.userId === user.id)
  const partnerLocation = locations.find((location) => location.userId !== user.id)
  const distance = useMemo(
    () => distanceBetween(myLocation, partnerLocation),
    [myLocation, partnerLocation],
  )

  const share = async () => {
    setAction('share')
    setMessage('正在获取手机位置…')
    try {
      await shareMyLocation(user)
      await refresh({ quiet: true })
      setMessage('我的位置已经安全更新。')
    } catch (error) {
      setMessage(error?.message || '共享位置失败，请稍后再试。')
    } finally {
      setAction('')
    }
  }

  const stopSharing = async () => {
    if (!window.confirm('停止后，对方将看不到你之前共享的位置。确定停止吗？')) return
    setAction('stop')
    setMessage('')
    try {
      await stopSharingLocation(user)
      await refresh({ quiet: true })
      setMessage('已停止共享，并清除了云端经纬度。')
    } catch (error) {
      setMessage(error?.message || '暂时无法停止共享，请稍后再试。')
    } finally {
      setAction('')
    }
  }

  return (
    <section className="distance-card" aria-labelledby="distance-title">
      <div className="distance-card__heading">
        <div className="distance-card__icon"><MapPinned size={25} /></div>
        <div>
          <p className="eyebrow"><InlineEditableText value={pageText.distanceEyebrow} editing={editing} onChange={(value) => onTextChange('distanceEyebrow', value)} ariaLabel="距离功能英文标题" /></p>
          <InlineEditableText as="h2" value={pageText.distanceTitle} editing={editing} onChange={(value) => onTextChange('distanceTitle', value)} ariaLabel="距离功能标题" />
          <InlineEditableText as="p" value={pageText.distanceDescription} editing={editing} onChange={(value) => onTextChange('distanceDescription', value)} ariaLabel="距离功能说明" />
        </div>
      </div>

      <div className="distance-card__result" aria-live="polite">
        <small>{myLocation && partnerLocation ? `${myLocation.display_name} ↔ ${partnerLocation.display_name}` : '等待两个人的位置'}</small>
        <strong>{loading ? '正在读取…' : formatDistance(distance)}</strong>
        <span>{distance !== null ? '这是两点之间的直线距离，实际路程会更长。' : '请分别登录两个账号并点击“共享我的位置”。'}</span>
      </div>

      <div className="location-status-grid">
        <article className={myLocation ? 'is-shared' : ''}>
          <span>我的位置</span>
          <strong>{myLocation ? '已共享' : '未共享'}</strong>
          <small><Clock3 size={13} /> {myLocation ? locationAgeLabel(myLocation.shared_at) : '只有点击后才会定位'}</small>
          {myLocation?.accuracy > 0 && <small>定位精度约 ±{myLocation.accuracy} 米</small>}
        </article>
        <article className={partnerLocation ? 'is-shared' : ''}>
          <span>对方位置</span>
          <strong>{partnerLocation ? `${partnerLocation.display_name} 已共享` : '等待对方共享'}</strong>
          <small><Clock3 size={13} /> {partnerLocation ? locationAgeLabel(partnerLocation.shared_at) : '对方共享后自动出现'}</small>
          {partnerLocation && Date.now() - new Date(partnerLocation.shared_at).getTime() > 6 * 60 * 60 * 1000 && <small className="location-stale">位置超过 6 小时，可能已经变化</small>}
        </article>
      </div>

      <div className="distance-card__actions">
        <button type="button" className="button primary" onClick={share} disabled={Boolean(action) || editing}>
          <LocateFixed size={17} /> {action === 'share' ? '正在定位…' : myLocation ? '更新我的位置' : '共享我的位置'}
        </button>
        <button type="button" className="button secondary" onClick={() => refresh()} disabled={loading || Boolean(action) || editing}>
          <RefreshCw size={16} /> 刷新距离
        </button>
        {myLocation && (
          <button type="button" className="button secondary location-stop" onClick={stopSharing} disabled={Boolean(action) || editing}>
            <Trash2 size={16} /> 停止共享
          </button>
        )}
      </div>

      {message && <p className="location-message" role="status">{message}</p>}
      <p className="location-privacy"><ShieldCheck size={15} /> 不会后台持续跟踪，也不显示具体坐标；停止共享会清除云端经纬度。</p>
    </section>
  )
}
