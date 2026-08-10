import { useEffect, useRef, useState } from 'react'
import { CalendarHeart, Heart, ListChecks, LoaderCircle, NotebookPen, Sparkles, UploadCloud } from 'lucide-react'
import { siteConfig } from '../data/siteConfig'
import { signedPhotoUrl, uploadHeroPhoto } from '../services/photoStorage'
import { countdownLabel, daysTogether, formatDate, getNextAnniversary } from '../utils/date'

function useSignedPhoto(path, fallback) {
  const [url, setUrl] = useState(fallback)

  useEffect(() => {
    let active = true
    setUrl(fallback)
    if (path) signedPhotoUrl(path).then((signedUrl) => {
      if (active && signedUrl) setUrl(signedUrl)
    }).catch(() => undefined)
    return () => { active = false }
  }, [path, fallback])

  return url
}

export default function HomePage({ data, settings = siteConfig, onNavigate, onHeroPhotoUploaded }) {
  const togetherDays = daysTogether(settings.couple.relationshipStart)
  const nextAnniversary = getNextAnniversary(data.anniversaries)
  const photoInput = useRef(null)
  const [heroPhoto, setHeroPhoto] = useState(settings.home.heroPhoto)
  const [uploading, setUploading] = useState(false)
  const [photoMessage, setPhotoMessage] = useState('')
  const personOneAvatar = useSignedPhoto(settings.couple.personOne.avatarPath, settings.couple.personOne.avatar)
  const personTwoAvatar = useSignedPhoto(settings.couple.personTwo.avatarPath, settings.couple.personTwo.avatar)

  useEffect(() => {
    let active = true
    if (!data.heroPhotoPath) {
      setHeroPhoto(settings.home.heroPhoto)
      return undefined
    }

    signedPhotoUrl(data.heroPhotoPath)
      .then((url) => {
        if (active && url) setHeroPhoto(url)
      })
      .catch(() => {
        if (active) setPhotoMessage('合照暂时无法读取，请稍后刷新页面。')
      })

    return () => {
      active = false
    }
  }, [data.heroPhotoPath, settings.home.heroPhoto])

  const handlePhoto = async (event) => {
    const [file] = event.target.files
    event.target.value = ''
    if (!file) return

    setUploading(true)
    setPhotoMessage('')
    try {
      const uploaded = await uploadHeroPhoto(file)
      setHeroPhoto(uploaded.url)
      onHeroPhotoUploaded(uploaded.path)
      setPhotoMessage('新合照已经安全保存 ♡')
    } catch (error) {
      setPhotoMessage(error?.message?.includes('Bucket not found') ? '私有照片空间还没有建立，请先完成 Supabase 设置。' : error.message || '上传失败，请稍后再试。')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="paper-tape" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles size={15} /> OUR LITTLE WORLD</p>
          <h1>{settings.siteName}</h1>
          <p className="hero-subtitle">{settings.siteSubtitle}</p>

          <div className="couple-row" aria-label="情侣信息">
            <div className="person-card">
              <img src={personOneAvatar} alt={`${settings.couple.personOne.name}的头像`} />
              <span>{settings.couple.personOne.name}</span>
            </div>
            <span className="beating-heart" aria-label="相爱"><Heart size={25} fill="currentColor" /></span>
            <div className="person-card">
              <img src={personTwoAvatar} alt={`${settings.couple.personTwo.name}的头像`} />
              <span>{settings.couple.personTwo.name}</span>
            </div>
          </div>

          <p className="start-date">从 {formatDate(settings.couple.relationshipStart)} 开始</p>
        </div>

        <div className="hero-photo-area">
          <figure className="hero-polaroid">
            <span className="photo-sticker" aria-hidden="true">LOVE</span>
            <img src={heroPhoto} alt={settings.home.photoCaption} />
            <figcaption>{settings.home.photoCaption} ♡</figcaption>
          </figure>
          <button type="button" className="button secondary hero-upload-button" onClick={() => photoInput.current?.click()} disabled={uploading}>
            {uploading ? <><LoaderCircle className="spin" size={17} /> 正在上传</> : <><UploadCloud size={17} /> 更换我们的合照</>}
          </button>
          <input ref={photoInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handlePhoto} aria-label="选择要上传的合照" />
          {photoMessage && <p className="photo-upload-message" role="status">{photoMessage}</p>}
        </div>
      </section>

      <section className="stats-grid" aria-label="恋爱天数与纪念日倒计时">
        <article className="stat-card stat-card--pink">
          <span className="stat-icon"><Heart size={22} fill="currentColor" /></span>
          <div>
            <p>我们已经在一起</p>
            <strong>{togetherDays}<small> 天</small></strong>
          </div>
        </article>
        <article className="stat-card stat-card--cream">
          <span className="stat-icon"><CalendarHeart size={24} /></span>
          <div>
            <p>下一个纪念日 · {nextAnniversary?.title ?? '等待添加'}</p>
            <strong>{nextAnniversary ? countdownLabel(nextAnniversary.days) : '去添加一个吧'}</strong>
          </div>
        </article>
      </section>

      <section className="quote-card">
        <span className="quote-mark">“</span>
        <p>{settings.home.quote}</p>
        <span className="quote-line" aria-hidden="true" />
      </section>

      <section className="quick-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">QUICK NOTES</p>
            <h2>今天想记录什么？</h2>
          </div>
          <span className="handwritten-note">每一件小事，都算数。</span>
        </div>
        <div className="quick-grid">
          <button type="button" onClick={() => onNavigate('daily')}>
            <span className="quick-icon"><NotebookPen size={22} /></span>
            <span><strong>写一篇日常</strong><small>收藏今天的小确幸</small></span>
          </button>
          <button type="button" onClick={() => onNavigate('anniversaries')}>
            <span className="quick-icon"><CalendarHeart size={22} /></span>
            <span><strong>添加纪念日</strong><small>把重要日子记牢</small></span>
          </button>
          <button type="button" onClick={() => onNavigate('wishes')}>
            <span className="quick-icon"><ListChecks size={22} /></span>
            <span><strong>许一个心愿</strong><small>一起期待更多以后</small></span>
          </button>
        </div>
      </section>
    </div>
  )
}
