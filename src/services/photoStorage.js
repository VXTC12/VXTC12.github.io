import { supabase } from '../lib/supabase'

export const PHOTO_BUCKET = 'couple-photos'
const MAX_PHOTO_BYTES = 8 * 1024 * 1024

function validatePhoto(file) {
  if (!file?.type.startsWith('image/')) throw new Error('请选择 JPG、PNG、WebP 等图片文件。')
  if (file.size > MAX_PHOTO_BYTES) throw new Error('图片不能超过 8MB，请压缩后再上传。')
}

function extensionFor(file) {
  const knownTypes = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  }
  return knownTypes[file.type] ?? 'jpg'
}

export async function signedPhotoUrl(path) {
  if (!path || !supabase) return null
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7)
  if (error) throw error
  return data.signedUrl
}

export async function uploadHeroPhoto(file) {
  validatePhoto(file)
  if (!supabase) throw new Error('照片空间还没有连接成功。')

  const path = `hero/${crypto.randomUUID()}.${extensionFor(file)}`
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error

  return { path, url: await signedPhotoUrl(path) }
}

export async function uploadAccountAvatar(file, userId) {
  validatePhoto(file)
  if (!supabase || !userId) throw new Error('头像空间还没有连接成功。')

  const path = `avatars/${userId}/${crypto.randomUUID()}.${extensionFor(file)}`
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error

  return { path, url: await signedPhotoUrl(path) }
}

export async function removePhoto(path) {
  if (!path || !supabase) return
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([path])
  if (error) throw error
}
