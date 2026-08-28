import { Capacitor } from '@capacitor/core'
import {
  DefaultWebViewOptions,
  InAppBrowser,
  ToolbarPosition,
} from '@capacitor/inappbrowser'
import { supabase } from '../lib/supabase'

const DSH_ORIGIN = 'https://dsh.yg1224.com'

async function getFreshAccessToken() {
  if (!supabase) throw new Error('网站登录服务尚未配置。')

  const { data, error } = await supabase.auth.refreshSession()
  if (error || !data.session?.access_token) {
    throw new Error('登录状态已过期，请退出账号后重新登录。')
  }

  return data.session.access_token
}

async function createLaunchUrl(accessToken) {
  const response = await fetch(`${DSH_ORIGIN}/__dsh/sso-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: new URLSearchParams({ access_token: accessToken }),
  })

  if (!response.ok) {
    const result = await response.json().catch(() => ({}))
    if (response.status === 403 && result.error === 'account_not_allowed') {
      throw new Error('当前登录账号还没有 DSH 访问权限。')
    }
    if (response.status === 401) throw new Error('登录状态已过期，请退出账号后重新登录。')
    if (response.status === 429) throw new Error('打开次数有点多，请稍等一会儿再试。')
    throw new Error('暂时无法打开 DSH，请确认电脑上的 DSH 正在运行。')
  }

  const result = await response.json()
  const launchUrl = new URL(result.launchUrl)
  if (launchUrl.origin !== DSH_ORIGIN || launchUrl.pathname !== '/__dsh/launch') {
    throw new Error('DSH 返回了无效的打开地址。')
  }

  return launchUrl
}

function openWebsiteDsh(launchUrl) {
  window.location.assign(launchUrl.href)
}

async function openNativeDsh(launchUrl) {
  await InAppBrowser.openInWebView({
    url: launchUrl.href,
    options: {
      ...DefaultWebViewOptions,
      showURL: false,
      clearCache: false,
      clearSessionCache: false,
      closeButtonText: '返回小世界',
      toolbarPosition: ToolbarPosition.TOP,
      showNavigationButtons: true,
      android: {
        ...DefaultWebViewOptions.android,
        allowZoom: true,
        hardwareBack: true,
        pauseMedia: true,
        isIsolated: true,
      },
      iOS: {
        ...DefaultWebViewOptions.iOS,
        enableViewportScale: true,
        allowInLineMediaPlayback: true,
        allowsBackForwardNavigationGestures: true,
      },
    },
  })
}

export async function openDsh() {
  const accessToken = await getFreshAccessToken()
  const launchUrl = await createLaunchUrl(accessToken)
  if (Capacitor.isNativePlatform()) return openNativeDsh(launchUrl)
  openWebsiteDsh(launchUrl)
  return undefined
}
