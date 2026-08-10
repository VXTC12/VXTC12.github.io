import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'
import { supabase } from '../lib/supabase'

const LOCATION_PREFIX = 'location:'

function locationId(userId) {
  return `${LOCATION_PREFIX}${userId}`
}

function displayName(user) {
  return user?.user_metadata?.display_name
    || user?.email?.split('@')[0]
    || '另一半'
}

function permissionError(error) {
  const message = error?.message ?? ''
  if (message.includes('denied') || message.includes('permission')) {
    return new Error('定位权限没有开启，请在手机“设置 → 应用 → YG嘻嘻站 → 权限”中允许位置信息。')
  }
  if (message.includes('timeout')) return new Error('暂时没有获取到位置，请到窗边或室外后再试一次。')
  return new Error(message || '暂时无法获取位置，请确认手机定位服务已经开启。')
}

async function currentPosition() {
  try {
    if (Capacitor.isNativePlatform()) {
      const permission = await Geolocation.requestPermissions({ permissions: ['location'] })
      if (permission.location !== 'granted' && permission.coarseLocation !== 'granted') {
        throw new Error('permission denied')
      }
    }

    return await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000,
    })
  } catch (error) {
    throw permissionError(error)
  }
}

export async function shareMyLocation(user) {
  if (!supabase || !user?.id) throw new Error('云端连接还没有准备好。')
  const position = await currentPosition()
  const sharedAt = new Date(position.timestamp || Date.now()).toISOString()
  const content = {
    sharing: true,
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: Math.round(position.coords.accuracy || 0),
    shared_at: sharedAt,
    display_name: displayName(user),
    avatar_path: user?.user_metadata?.avatar_path ?? '',
  }

  const { error } = await supabase.from('site_data').upsert({
    id: locationId(user.id),
    content,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  })
  if (error) throw error
  return content
}

export async function stopSharingLocation(user) {
  if (!supabase || !user?.id) throw new Error('云端连接还没有准备好。')
  const { error } = await supabase.from('site_data').upsert({
    id: locationId(user.id),
    content: {
      sharing: false,
      display_name: displayName(user),
      stopped_at: new Date().toISOString(),
    },
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  })
  if (error) throw error
}

export async function loadCoupleLocations() {
  if (!supabase) throw new Error('云端连接还没有准备好。')
  const { data, error } = await supabase
    .from('site_data')
    .select('id,content,updated_at,updated_by')
    .like('id', `${LOCATION_PREFIX}%`)
    .order('updated_at', { ascending: false })
  if (error) throw error

  return (data ?? [])
    .filter((row) => row.content?.sharing && Number.isFinite(row.content.latitude) && Number.isFinite(row.content.longitude))
    .map((row) => ({
      userId: row.updated_by || row.id.slice(LOCATION_PREFIX.length),
      ...row.content,
      updatedAt: row.updated_at,
    }))
}

function radians(degrees) {
  return degrees * Math.PI / 180
}

export function distanceBetween(first, second) {
  if (!first || !second) return null
  const earthRadiusMetres = 6371000
  const latitudeDelta = radians(second.latitude - first.latitude)
  const longitudeDelta = radians(second.longitude - first.longitude)
  const firstLatitude = radians(first.latitude)
  const secondLatitude = radians(second.latitude)
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2
  return 2 * earthRadiusMetres * Math.asin(Math.sqrt(haversine))
}

export function formatDistance(metres) {
  if (!Number.isFinite(metres)) return '等待双方共享位置'
  if (metres < 1000) return `${Math.max(1, Math.round(metres / 10) * 10)} 米`
  if (metres < 100000) return `${(metres / 1000).toFixed(1)} 公里`
  return `${Math.round(metres / 1000)} 公里`
}

export function locationAgeLabel(dateValue) {
  if (!dateValue) return '更新时间未知'
  const elapsedMinutes = Math.max(0, Math.round((Date.now() - new Date(dateValue).getTime()) / 60000))
  if (elapsedMinutes < 1) return '刚刚更新'
  if (elapsedMinutes < 60) return `${elapsedMinutes} 分钟前更新`
  const hours = Math.floor(elapsedMinutes / 60)
  if (hours < 24) return `${hours} 小时前更新`
  return `${Math.floor(hours / 24)} 天前更新`
}
