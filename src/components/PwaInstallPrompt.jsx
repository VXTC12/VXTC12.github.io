import { useEffect, useState } from 'react'
import { Download, Share2, X } from 'lucide-react'

const DISMISSED_KEY = 'yg-pwa-install-dismissed-v1'

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

export default function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null)
  const [visible, setVisible] = useState(false)
  const [showIosHelp, setShowIosHelp] = useState(false)

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISSED_KEY) === '1') return undefined

    const handleInstallPrompt = (event) => {
      event.preventDefault()
      setInstallEvent(event)
      setVisible(true)
    }
    const timer = window.setTimeout(() => {
      if (isIos()) setVisible(true)
    }, 3500)

    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
    }
  }, [])

  if (!visible) return null

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  const install = async () => {
    if (installEvent) {
      await installEvent.prompt()
      const choice = await installEvent.userChoice
      if (choice.outcome === 'accepted') setVisible(false)
      return
    }
    setShowIosHelp(true)
  }

  return (
    <aside className="pwa-install" aria-label="安装到手机">
      <button type="button" className="pwa-install__close" onClick={dismiss} aria-label="关闭安装提示"><X size={17} /></button>
      <div className="pwa-install__icon"><Download size={21} /></div>
      <div>
        <strong>把 YG嘻嘻站装到手机</strong>
        {showIosHelp ? (
          <p><Share2 size={15} /> 在 Safari 底部点“分享”，再点“添加到主屏幕”。</p>
        ) : (
          <p>不需要 App Store，也不需要支付 Apple 开发者费用。</p>
        )}
      </div>
      <button type="button" className="pwa-install__button" onClick={install}>{installEvent ? '安装' : '查看方法'}</button>
    </aside>
  )
}
