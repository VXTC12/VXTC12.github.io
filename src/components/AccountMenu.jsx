import { useEffect, useRef, useState } from 'react'
import { BarChart3, Camera, LoaderCircle, LogOut, PencilLine, Save, Settings2, ShieldCheck, Smartphone } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { removePhoto, signedPhotoUrl, uploadAccountAvatar } from '../services/photoStorage'
import { updateSharedLocationProfile } from '../services/coupleLocation'

function accountInitial(email) {
  return email?.trim().charAt(0).toUpperCase() || '♡'
}

export default function AccountMenu({ user, onOpenAdmin, onOpenAnalytics, onOpenPermissions, onOpenUpdate, onStartPageEdit, pageEditing, onSignOut }) {
  const menuRef = useRef(null)
  const fileInputRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [avatarPath, setAvatarPath] = useState(user?.user_metadata?.avatar_path ?? '')
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? '')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [savingName, setSavingName] = useState(false)
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
    setAvatarPath(user?.user_metadata?.avatar_path ?? '')
    setDisplayName(user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? '')
  }, [user])

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
      const { data, error } = await supabase.auth.updateUser({
        data: { ...(user.user_metadata ?? {}), avatar_path: uploaded.path },
      })
      if (error) throw error

      setAvatarPath(uploaded.path)
      setAvatarUrl(uploaded.url)
      setMessage('头像已经更新啦')
      updateSharedLocationProfile(data.user).catch(() => undefined)

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

  const saveDisplayName = async (event) => {
    event.preventDefault()
    const nextName = displayName.trim()
    if (!nextName) {
      setMessage('昵称不能为空。')
      return
    }

    setSavingName(true)
    setMessage('')
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { ...(user.user_metadata ?? {}), display_name: nextName },
      })
      if (error) throw error
      setDisplayName(nextName)
      setMessage('软件昵称已经保存。')
      updateSharedLocationProfile(data.user).catch(() => undefined)
    } catch (error) {
      setMessage(error?.message || '昵称保存失败，请稍后再试。')
    } finally {
      setSavingName(false)
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
        title={displayName || user?.email || '账号'}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="我的头像" onError={() => setAvatarUrl('')} />
        ) : (
          <span aria-hidden="true">{accountInitial(displayName || user?.email)}</span>
        )}
      </button>

      {open && (
        <div className="account-popover" role="dialog" aria-label="账号信息">
          <div className="account-summary">
            <div className="account-avatar-large">
              {avatarUrl ? <img src={avatarUrl} alt="我的头像" /> : <span>{accountInitial(displayName || user?.email)}</span>}
            </div>
            <div>
              <strong>{displayName || '当前账号'}</strong>
              <p title={user?.email}>{user?.email}</p>
            </div>
          </div>

          <form className="account-profile-form" onSubmit={saveDisplayName}>
            <label htmlFor="account-display-name">软件昵称</label>
            <div>
              <input id="account-display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength="20" placeholder="输入你的昵称" />
              <button type="submit" disabled={savingName || uploading} aria-label="保存软件昵称">
                {savingName ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}
              </button>
            </div>
          </form>

          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatarUpload}
          />
          <button type="button" className="account-action account-admin" onClick={() => { setOpen(false); onStartPageEdit() }} disabled={pageEditing}>
            <PencilLine size={17} />{pageEditing ? '正在直接编辑页面' : '直接编辑页面文字'}
          </button>
          <button type="button" className="account-action" onClick={() => { setOpen(false); onOpenAnalytics() }}>
            <BarChart3 size={17} />查看访问流量
          </button>
          <button type="button" className="account-action" onClick={() => { setOpen(false); onOpenUpdate() }}>
            <Smartphone size={17} />检查 APP 更新
          </button>
          <button type="button" className="account-action" onClick={() => { setOpen(false); onOpenPermissions() }}>
            <ShieldCheck size={17} />权限与隐私
          </button>
          <button type="button" className="account-action account-admin" onClick={() => { setOpen(false); onOpenAdmin() }}>
            <Settings2 size={17} />管理头像与日期
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
          <button type="button" className="account-action account-signout" onClick={onSignOut} disabled={uploading || savingName}>
            <LogOut size={17} />退出登录
          </button>
          {message && <p className="account-message" role="status">{message}</p>}
          <small>头像只属于当前登录账号，建议使用正方形照片。</small>
        </div>
      )}
    </div>
  )
}
