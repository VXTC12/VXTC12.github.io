import { useEffect } from 'react'
import { trackPageVisit } from '../services/analytics'

export default function useAnalyticsTracking(userId, activePage) {
  useEffect(() => {
    trackPageVisit(userId, activePage).catch(() => undefined)
  }, [userId, activePage])
}
