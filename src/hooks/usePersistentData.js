import { useCallback, useEffect, useRef, useState } from 'react'
import { createInitialData } from '../data/sampleData'
import { supabase } from '../lib/supabase'

export const STORAGE_KEY = 'our-little-world-data-v1'
const CLOUD_ROW_ID = 'our-little-world'
const REQUIRED_SECTIONS = ['timeline', 'daily', 'gallery', 'wishes', 'anniversaries', 'messages']
const SYNC_POLL_INTERVAL = 5000

const sectionNotices = [
  ['wishes', '心愿', 'title'],
  ['daily', '日常', 'description'],
  ['timeline', '时光轴事件', 'title'],
  ['gallery', '相册照片', 'title'],
  ['anniversaries', '纪念日', 'title'],
  ['messages', '留言', 'title'],
]

function isValidSiteData(value) {
  return value && REQUIRED_SECTIONS.every((section) => Array.isArray(value[section]))
}

function relationshipDateFrom(anniversaries) {
  const anniversary = anniversaries?.find((item) => (
    item.id === 'anniversary-1'
    || item.title === '纪念日'
    || item.title?.includes('恋爱')
  ))
  return anniversary?.date
}

export function normalizeSiteData(value) {
  const defaults = createInitialData()
  if (!isValidSiteData(value)) return defaults

  const savedSettings = value.siteSettings ?? {}
  const savedCouple = savedSettings.couple ?? {}
  const savedHome = savedSettings.home ?? {}
  const savedPages = savedSettings.pages ?? {}
  const relationshipStart = savedCouple.relationshipStart
    || relationshipDateFrom(value.anniversaries)
    || defaults.siteSettings.couple.relationshipStart

  return {
    ...defaults,
    ...value,
    siteSettings: {
      ...defaults.siteSettings,
      ...savedSettings,
      couple: {
        ...defaults.siteSettings.couple,
        ...savedCouple,
        relationshipStart,
        personOne: {
          ...defaults.siteSettings.couple.personOne,
          ...(savedCouple.personOne ?? {}),
        },
        personTwo: {
          ...defaults.siteSettings.couple.personTwo,
          ...(savedCouple.personTwo ?? {}),
        },
      },
      home: {
        ...defaults.siteSettings.home,
        ...savedHome,
      },
      pages: Object.fromEntries(Object.entries(defaults.siteSettings.pages).map(([page, pageDefaults]) => [
        page,
        { ...pageDefaults, ...(savedPages[page] ?? {}) },
      ])),
    },
  }
}

function loadData() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved ? normalizeSiteData(JSON.parse(saved)) : createInitialData()
  } catch {
    return createInitialData()
  }
}

function remoteNoticeFor(previous, next) {
  for (const [section, label, titleField] of sectionNotices) {
    const previousIds = new Set((previous?.[section] ?? []).map((item) => item.id))
    const added = (next?.[section] ?? []).find((item) => !previousIds.has(item.id))
    if (added) {
      const detail = added[titleField] || added.content || ''
      return {
        message: `对方添加了新${label}${detail ? `：${String(detail).slice(0, 24)}` : ''}`,
        page: section === 'anniversaries' ? 'anniversaries' : section,
      }
    }
  }

  for (const [section, label] of sectionNotices) {
    if (JSON.stringify(previous?.[section]) !== JSON.stringify(next?.[section])) {
      return { message: `对方更新了${label}`, page: section }
    }
  }

  if (JSON.stringify(previous?.siteSettings) !== JSON.stringify(next?.siteSettings)) {
    return { message: '对方更新了网站界面内容', page: 'home' }
  }

  return { message: '对方更新了共同记录', page: 'home' }
}

export function usePersistentData(userId) {
  const [data, setData] = useState(loadData)
  const [syncStatus, setSyncStatus] = useState('loading')
  const [syncError, setSyncError] = useState('')
  const [remoteNotice, setRemoteNotice] = useState(null)
  const cloudReady = useRef(false)
  const dataRef = useRef(data)
  const cloudJson = useRef('')
  const cloudUpdatedAt = useRef('')
  const hasUnsavedChanges = useRef(false)
  const syncChannel = useRef(null)

  const updateData = useCallback((value) => {
    setData((current) => {
      const next = typeof value === 'function' ? value(current) : value
      dataRef.current = next
      return next
    })
  }, [])

  useEffect(() => {
    dataRef.current = data
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    if (!supabase || !userId) return undefined
    let active = true
    let pollTimer
    let realtimeChannel
    cloudReady.current = false
    hasUnsavedChanges.current = false
    setSyncStatus('loading')
    setSyncError('')

    function applyCloudRow(row, notify = false) {
      if (!active || !row?.content || !isValidSiteData(row.content)) return
      if (row.updated_at && row.updated_at === cloudUpdatedAt.current) return

      const next = normalizeSiteData(row.content)
      const nextJson = JSON.stringify(next)
      const previous = dataRef.current
      cloudJson.current = nextJson
      cloudUpdatedAt.current = row.updated_at ?? ''

      if (nextJson !== JSON.stringify(previous)) {
        if (notify && row.updated_by && row.updated_by !== userId) {
          setRemoteNotice(remoteNoticeFor(previous, next))
        }
        updateData(next)
      }
      setSyncStatus('synced')
      setSyncError('')
    }

    async function loadCloudData(notify = false) {
      const { data: row, error } = await supabase
        .from('site_data')
        .select('content,updated_at,updated_by')
        .eq('id', CLOUD_ROW_ID)
        .maybeSingle()

      if (error) throw error

      if (row?.content && isValidSiteData(row.content)) {
        if (!hasUnsavedChanges.current) applyCloudRow(row, notify)
      } else {
        const localData = loadData()
        const savedAt = new Date().toISOString()
        const { error: insertError } = await supabase.from('site_data').upsert({
          id: CLOUD_ROW_ID,
          content: localData,
          updated_at: savedAt,
          updated_by: userId,
        })
        if (insertError) throw insertError
        cloudJson.current = JSON.stringify(localData)
        cloudUpdatedAt.current = savedAt
      }

      if (active) {
        cloudReady.current = true
        setSyncStatus('synced')
      }
    }

    loadCloudData()
      .then(() => {
        if (!active) return

        realtimeChannel = supabase
          .channel('site-data-sync')
          .on('broadcast', { event: 'content-changed' }, () => {
            if (!hasUnsavedChanges.current) loadCloudData(true).catch(() => undefined)
          })
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'site_data',
            filter: `id=eq.${CLOUD_ROW_ID}`,
          }, (payload) => {
            if (!hasUnsavedChanges.current) applyCloudRow(payload.new, true)
          })
          .subscribe()
        syncChannel.current = realtimeChannel

        pollTimer = window.setInterval(() => {
          if (!hasUnsavedChanges.current) loadCloudData(true).catch(() => undefined)
        }, SYNC_POLL_INTERVAL)
      })
      .catch(() => {
        if (active) {
          setSyncStatus('error')
          setSyncError('云端数据空间还没有准备好，当前修改仍会保存在这台设备。')
        }
      })

    return () => {
      active = false
      cloudReady.current = false
      if (pollTimer) window.clearInterval(pollTimer)
      if (realtimeChannel) {
        if (syncChannel.current === realtimeChannel) syncChannel.current = null
        supabase.removeChannel(realtimeChannel)
      }
    }
  }, [updateData, userId])

  useEffect(() => {
    if (!supabase || !userId || !cloudReady.current) return undefined
    const dataJson = JSON.stringify(data)
    if (dataJson === cloudJson.current) return undefined

    hasUnsavedChanges.current = true
    setSyncStatus('saving')

    const timer = window.setTimeout(async () => {
      const savedAt = new Date().toISOString()
      const { error } = await supabase.from('site_data').upsert({
        id: CLOUD_ROW_ID,
        content: data,
        updated_at: savedAt,
        updated_by: userId,
      })

      if (error) {
        setSyncStatus('error')
        setSyncError('云端保存暂时失败，当前修改仍会保存在这台设备。')
      } else {
        cloudJson.current = dataJson
        cloudUpdatedAt.current = savedAt
        hasUnsavedChanges.current = false
        setSyncStatus('synced')
        setSyncError('')
        syncChannel.current?.send({
          type: 'broadcast',
          event: 'content-changed',
          payload: { updatedAt: savedAt },
        })
      }
    }, 700)

    return () => window.clearTimeout(timer)
  }, [data, userId])

  return [data, updateData, {
    syncStatus,
    syncError,
    remoteNotice,
    clearRemoteNotice: () => setRemoteNotice(null),
  }]
}
