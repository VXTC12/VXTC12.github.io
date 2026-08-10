import { Capacitor } from '@capacitor/core'

export const PERMISSION_WELCOME_KEY = 'yg-permission-welcome-v1'

export function shouldShowPermissionWelcome() {
  return Capacitor.isNativePlatform() && window.localStorage.getItem(PERMISSION_WELCOME_KEY) !== 'done'
}

export function rememberPermissionWelcome() {
  window.localStorage.setItem(PERMISSION_WELCOME_KEY, 'done')
}
