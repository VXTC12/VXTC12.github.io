import { useEffect, useRef, useState } from 'react'
import { createInitialData } from '../data/sampleData'
import { supabase } from '../lib/supabase'

export const STORAGE_KEY = 'our-little-world-data-v1'
const CLOUD_ROW_ID = 'our-little-world'
const REQUIRED_SECTIONS = ['timeline', 'daily', 'gallery', 'wishes', 'anniversaries', 'messages']

function isValidSiteData(value) {
  return value && REQUIRED_SECTIONS.every((section) => Array.isArray(value[section]))
}

function loadData() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : createInitialData()
  } catch {
    return createInitialData()
  }
}

export function usePersistentData(userId) {
  const [data, setData] = useState(loadData)
  const [syncStatus, setSyncStatus] = useState('loading')
  const [syncError, setSyncError] = useState('')
  const cloudReady = useRef(false)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    if (!supabase || !userId) return undefined
    let active = true
    cloudReady.current = false
    setSyncStatus('loading')
    setSyncError('')

    async function loadCloudData() {
      const { data: row, error } = await supabase
        .from('site_data')
        .select('content')
        .eq('id', CLOUD_ROW_ID)
        .maybeSingle()

      if (error) throw error

      if (row?.content && isValidSiteData(row.content)) {
        if (active) setData(row.content)
      } else {
        const localData = loadData()
        const { error: insertError } = await supabase.from('site_data').upsert({
          id: CLOUD_ROW_ID,
          content: localData,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        })
        if (insertError) throw insertError
      }

      if (active) {
        cloudReady.current = true
        setSyncStatus('synced')
      }
    }

    loadCloudData().catch(() => {
      if (active) {
        setSyncStatus('error')
        setSyncError('云端数据空间还没有准备好，当前修改仍会保存在这台设备。')
      }
    })

    return () => {
      active = false
      cloudReady.current = false
    }
  }, [userId])

  useEffect(() => {
    if (!supabase || !userId || !cloudReady.current) return undefined
    setSyncStatus('saving')

    const timer = window.setTimeout(async () => {
      const { error } = await supabase.from('site_data').upsert({
        id: CLOUD_ROW_ID,
        content: data,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })

      if (error) {
        setSyncStatus('error')
        setSyncError('云端保存暂时失败，当前修改仍会保存在这台设备。')
      } else {
        setSyncStatus('synced')
        setSyncError('')
      }
    }, 700)

    return () => window.clearTimeout(timer)
  }, [data, userId])

  return [data, setData, { syncStatus, syncError }]
}
