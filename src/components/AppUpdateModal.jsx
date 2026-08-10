import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Download, LoaderCircle, RefreshCw, ShieldCheck, Smartphone } from 'lucide-react'
import { checkForAppUpdate, openAppUpdate } from '../services/appUpdate'
import Modal from './Modal'

export default function AppUpdateModal({ initialUpdate = null, onClose }) {
  const [update, setUpdate] = useState(initialUpdate)
  const [loading, setLoading] = useState(!initialUpdate)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  const check = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setUpdate(await checkForAppUpdate())
    } catch (checkError) {
      setError(checkError?.message || '检查更新失败，请稍后再试。')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialUpdate) check()
  }, [check, initialUpdate])

  const download = async () => {
    setDownloading(true)
    setError('')
    try {
      await openAppUpdate(update.downloadUrl)
    } catch (downloadError) {
      setError(downloadError?.message || '暂时无法打开下载页面。')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Modal title="APP 版本更新" onClose={onClose}>
      <div className="update-panel">
        <div className="update-panel__icon"><Smartphone size={30} /></div>
        {loading ? (
          <div className="update-panel__state"><LoaderCircle className="spin" size={20} /> 正在检查最新版本…</div>
        ) : update?.supported === false ? (
          <div className="update-panel__state">网页版会自动使用线上最新内容，不需要下载安装包。</div>
        ) : update?.available ? (
          <>
            <div className="update-version-row">
              <span>当前版本 <strong>v{update.currentVersion}</strong></span>
              <span>最新版本 <strong>v{update.version}</strong></span>
            </div>
            <div className="update-notes">
              <strong>本次更新</strong>
              <p>{update.notes || '功能改进与稳定性优化。'}</p>
              {update.publishedAt && <small>发布时间：{new Date(update.publishedAt).toLocaleString('zh-CN')}</small>}
            </div>
            <button type="button" className="button primary update-download" onClick={download} disabled={downloading}>
              {downloading ? <LoaderCircle className="spin" size={18} /> : <Download size={18} />}
              {downloading ? '正在打开下载…' : '下载并覆盖更新'}
            </button>
            <p className="update-help">下载完成后点击 APK，选择“更新”。使用同一正式签名，不需要卸载，账号和数据都会保留。</p>
          </>
        ) : update ? (
          <div className="update-panel__latest"><CheckCircle2 size={24} /> 已经是最新版本 v{update.currentVersion}</div>
        ) : null}

        {error && <p className="form-message form-message--error" role="alert">{error}</p>}
        <button type="button" className="button secondary update-refresh" onClick={check} disabled={loading}>
          <RefreshCw size={16} /> 重新检查
        </button>
        <p className="update-security"><ShieldCheck size={15} /> 安卓会验证正式签名，无法静默安装是系统的安全保护。</p>
      </div>
    </Modal>
  )
}
