import { Capacitor } from '@capacitor/core'
import {
  DefaultWebViewOptions,
  InAppBrowser,
  ToolbarPosition,
} from '@capacitor/inappbrowser'

const DSH_ORIGIN = 'https://dsh.yg1224.com'

function openWebsiteDsh(accessToken) {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = `${DSH_ORIGIN}/__dsh/sso`
  form.target = '_self'
  form.hidden = true

  const token = document.createElement('input')
  token.type = 'hidden'
  token.name = 'access_token'
  token.value = accessToken
  form.append(token)

  document.body.append(form)
  form.submit()
  form.remove()
}

async function openNativeDsh(accessToken) {
  const response = await fetch(`${DSH_ORIGIN}/__dsh/sso-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: new URLSearchParams({ access_token: accessToken }),
  })

  if (!response.ok) {
    if (response.status === 401) throw new Error('登录状态已过期，请退出账号后重新登录。')
    throw new Error('暂时无法打开 DSH，请确认电脑上的 DSH 正在运行。')
  }

  const result = await response.json()
  const launchUrl = new URL(result.launchUrl)
  if (launchUrl.origin !== DSH_ORIGIN || launchUrl.pathname !== '/__dsh/launch') {
    throw new Error('DSH 返回了无效的打开地址。')
  }

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

export async function openDsh(accessToken) {
  if (!accessToken) throw new Error('请先登录网站账号。')
  if (Capacitor.isNativePlatform()) return openNativeDsh(accessToken)
  openWebsiteDsh(accessToken)
  return undefined
}
