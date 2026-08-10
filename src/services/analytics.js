import { Capacitor } from '@capacitor/core'
import { supabase } from '../lib/supabase'
import { createId } from '../utils/id'

const SESSION_KEY = 'little-world-analytics-session-v1'
const RECORDED_KEY = 'little-world-analytics-recorded-v1'

function readSessionValue(key) {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeSessionValue(key, value) {
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    // 浏览器禁止临时存储时，访问记录仍然可以正常写入。
  }
}

function deviceType() {
  const width = window.innerWidth
  if (width <= 620) return 'mobile'
  if (width <= 1024) return 'tablet'
  return 'desktop'
}

function analyticsSession(userId) {
  const sessionKey = `${SESSION_KEY}-${userId}`
  const recordedKey = `${RECORDED_KEY}-${userId}`
  let sessionId = readSessionValue(sessionKey)

  if (!sessionId) {
    sessionId = createId('visit')
    writeSessionValue(sessionKey, sessionId)
  }

  return {
    sessionId,
    recordedKey,
    isRecorded: readSessionValue(recordedKey) === sessionId,
  }
}

async function insertAnalyticsEvent(event) {
  if (!supabase) return false
  const { user_id: userId, event_type: eventType, ...content } = event
  const eventPrefix = eventType === 'page_view' ? 'view' : 'session'
  const { error } = await supabase.from('site_data').insert({
    id: `analytics:${eventPrefix}:${createId('event')}`,
    content: { ...content, event_type: eventType },
    updated_at: new Date().toISOString(),
    updated_by: userId,
  })
  return !error
}

export async function trackPageVisit(userId, pageId) {
  if (!userId || !pageId) return
  const session = analyticsSession(userId)
  const baseEvent = {
    user_id: userId,
    session_id: session.sessionId,
    platform: Capacitor.getPlatform(),
    device_type: deviceType(),
  }

  if (!session.isRecorded) {
    const recorded = await insertAnalyticsEvent({ ...baseEvent, event_type: 'session', page_id: pageId })
    if (recorded) writeSessionValue(session.recordedKey, session.sessionId)
  }

  await insertAnalyticsEvent({ ...baseEvent, event_type: 'page_view', page_id: pageId })
}

export async function loadAnalytics(days) {
  if (!supabase) throw new Error('网站还没有连接到云端数据。')

  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [recentResult, totalViewsResult, totalSessionsResult, todayViewsResult] = await Promise.all([
    supabase
      .from('site_data')
      .select('content,updated_at,updated_by')
      .like('id', 'analytics:%')
      .gte('updated_at', start.toISOString())
      .order('updated_at', { ascending: false })
      .limit(5000),
    supabase.from('site_data').select('id', { count: 'exact', head: true }).like('id', 'analytics:view:%'),
    supabase.from('site_data').select('id', { count: 'exact', head: true }).like('id', 'analytics:session:%'),
    supabase.from('site_data').select('id', { count: 'exact', head: true }).like('id', 'analytics:view:%').gte('updated_at', today.toISOString()),
  ])

  const error = recentResult.error || totalViewsResult.error || totalSessionsResult.error || todayViewsResult.error
  if (error) {
    throw error
  }

  return {
    rows: (recentResult.data ?? []).map((row) => ({
      ...(row.content ?? {}),
      created_at: row.updated_at,
      user_id: row.updated_by,
    })),
    totalViews: totalViewsResult.count ?? 0,
    totalSessions: totalSessionsResult.count ?? 0,
    todayViews: todayViewsResult.count ?? 0,
  }
}
