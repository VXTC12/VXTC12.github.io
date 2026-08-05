import { initialContent } from './siteConfig'

export function createInitialData() {
  return JSON.parse(JSON.stringify(initialContent))
}
