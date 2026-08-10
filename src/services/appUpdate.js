import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'

export const UPDATE_MANIFEST_URL = 'https://yg1224.com/app-updates/latest.json'

function compareVersions(left, right) {
  const leftParts = String(left).split('.').map((part) => Number(part) || 0)
  const rightParts = String(right).split('.').map((part) => Number(part) || 0)
  const length = Math.max(leftParts.length, rightParts.length)
  for (let index = 0; index < length; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0)
    if (difference !== 0) return difference
  }
  return 0
}

export async function checkForAppUpdate() {
  const nativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
  if (!nativeAndroid) {
    return { supported: false, available: false, currentVersion: '网页版' }
  }

  const [appInfo, response] = await Promise.all([
    App.getInfo(),
    fetch(`${UPDATE_MANIFEST_URL}?time=${Date.now()}`, { cache: 'no-store' }),
  ])
  if (!response.ok) throw new Error('暂时无法读取更新信息，请稍后再试。')

  const manifest = await response.json()
  if (!manifest.version || !manifest.downloadUrl) throw new Error('更新信息格式不完整。')

  return {
    supported: true,
    available: compareVersions(manifest.version, appInfo.version) > 0,
    currentVersion: appInfo.version,
    currentBuild: Number(appInfo.build),
    ...manifest,
  }
}

export async function openAppUpdate(downloadUrl) {
  if (!downloadUrl) throw new Error('没有找到下载地址。')
  await Browser.open({ url: downloadUrl, presentationStyle: 'popover' })
}
