import { initialContent, siteConfig } from './siteConfig'

export function createInitialData() {
  return JSON.parse(JSON.stringify({
    ...initialContent,
    siteSettings: siteConfig,
  }))
}
