import { useEffect, useRef, useState } from 'react'
import { Camera, LoaderCircle, LogOut, Settings2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { removePhoto, signedPhotoUrl, uploadAccountAvatar } from '../services/photoStorage'

function accountInitial(email) {
  return email?.trim().charAt(0).toUpperCase() || '♡'
}

export default function AccountMenu({ user, onOpenAdmin, onSignOut }) {
  const menuRef = useRef(null)
  const fileInputRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [avatarPath, setAvatarPath] = useState(user?.user_metadata?.avatar_path ?? '')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true

    if (!avatarPath) {
      setAvatarUrl('')
      return undefined
    }

    signedPhotoUrl(avatarPath)
      .then((url) => {
        if (active) setAvatarUrl(url ?? '')
      })
      .catch(() => {
        if (active) setAvatarUrl('')
      })

    return () => {
      active = false
    }
  }, [avatarPath])

  useEffect(() => {
    if (!open) return undefined

    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const previousPath = avatarPath
    setUploading(true)
    setMessage('')

    try {
      const uploaded = await uploadAccountAvatar(file, user.id)
      const { error } = await supabase.auth.updateUser({
        data: { ...(user.user_metadata ?? {}), avatar_path: uploaded.path },
      })
      if (error) throw error

      setAvatarPath(uploaded.path)
      setAvatarUrl(uploaded.url)
      setMessage('头像已经更新啦')

      if (previousPath && previousPath !== uploaded.path) {
        removePhoto(previousPath).catch(() => undefined)
      }
    } catch (error) {
      setMessage(error?.message || '头像上传失败，请稍后再试。')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        type="button"
        className="account-trigger"
        onClick={() => {
          setOpen((current) => !current)
          setMessage('')
        }}
        aria-label="打开账号菜单"
        aria-haspopup="dialog"
        aria-expanded={open}
        title={user?.email ?? '账号'}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="我的头像" onError={() => setAvatarUrl('')} />
        ) : (
          <span aria-hidden="true">{accountInitial(user?.email)}</span>
        )}
      </button>

      {open && (
        <div className="account-popover" role="dialog" aria-label="账号信息">
          <div className="account-summary">
            <div className="account-avatar-large">
              {avatarUrl ? <img src={avatarUrl} alt="我的头像" /> : <span>{accountInitial(user?.email)}</span>}
            </div>
            <div>
              <strong>当前账号</strong>
              <p title={user?.email}>{user?.email}</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatarUpload}
          />
          <button type="button" className="account-action account-admin" onClick={() => { setOpen(false); onOpenAdmin() }}>
            <Settings2 size={17} />管理网站内容
          </button>
          <button
            type="button"
            className="account-action"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <LoaderCircle className="spin" size={17} /> : <Camera size={17} />}
            {uploading ? '正在上传头像' : avatarPath ? '更换我的头像' : '上传我的头像'}
          </button>
          <button type="button" className="account-action account-signout" onClick={onSignOut} disabled={uploading}>
            <LogOut size={17} />退出登录
          </button>
          {message && <p className="account-message" role="status">{message}</p>}
          <small>头像只属于当前登录账号，建议使用正方形照片。</small>
        </div>
      )}
    </div>
  )
}
