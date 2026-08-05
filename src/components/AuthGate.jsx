import { useEffect, useState } from 'react'
import { Heart, LoaderCircle, LockKeyhole } from 'lucide-react'
import { siteConfig } from '../data/siteConfig'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

function friendlyAuthError(error) {
  if (error?.code === 'invalid_credentials') return '邮箱或密码不正确，请再检查一次。'
  if (error?.code === 'email_not_confirmed') return '这个邮箱还没有完成确认，请先查看邮箱里的确认信。'
  if (error?.status === 429) return '尝试次数有点多，请稍等一会儿再试。'
  return '暂时无法登录，请检查网络后再试。'
}

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!supabase) {
      setChecking(false)
      return undefined
    }

    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session)
        setChecking(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession)
        setChecking(false)
      }
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSubmitting(true)
    setErrorMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get('email')).trim(),
      password: String(form.get('password')),
    })

    if (error) setErrorMessage(friendlyAuthError(error))
    setSubmitting(false)
  }

  const signOut = async () => {
    setErrorMessage('')
    const { error } = await supabase.auth.signOut()
    if (error) setErrorMessage('退出失败，请稍后再试。')
  }

  if (checking) {
    return (
      <div className="auth-page auth-page--loading" role="status">
        <LoaderCircle className="spin" size={28} />
        <span>正在打开我们的小世界…</span>
      </div>
    )
  }

  if (session) return children({ session, signOut })

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-seal" aria-hidden="true"><Heart size={28} fill="currentColor" /></div>
        <p className="eyebrow"><LockKeyhole size={14} /> PRIVATE MEMORIES</p>
        <h1>{siteConfig.siteName}</h1>
        <p className="auth-intro">这里收藏着只属于我们的故事。登录以后，才能轻轻打开。</p>

        {!isSupabaseConfigured ? (
          <p className="form-message form-message--error">网站还没有完成登录配置，请联系网站维护者。</p>
        ) : (
          <form className="auth-form" onSubmit={signIn}>
            <label>
              登录邮箱
              <input type="email" name="email" autoComplete="email" placeholder="请输入邮箱" required />
            </label>
            <label>
              登录密码
              <input type="password" name="password" autoComplete="current-password" placeholder="请输入密码" minLength="6" required />
            </label>
            {errorMessage && <p className="form-message form-message--error" role="alert">{errorMessage}</p>}
            <button className="button primary auth-submit" type="submit" disabled={submitting}>
              {submitting ? <><LoaderCircle className="spin" size={18} /> 正在登录</> : <><Heart size={18} fill="currentColor" /> 进入我们的小世界</>}
            </button>
          </form>
        )}

        <p className="auth-note">本站不提供公开注册，只有预先添加的账号可以登录。</p>
      </section>
    </main>
  )
}
