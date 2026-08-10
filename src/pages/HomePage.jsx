import { useEffect, useRef, useState } from 'react'
import { CalendarHeart, Heart, ListChecks, LoaderCircle, NotebookPen, Sparkles, UploadCloud } from 'lucide-react'
import InlineEditableText from '../components/InlineEditableText'
import { siteConfig } from '../data/siteConfig'
import useSignedPhoto from '../hooks/useSignedPhoto'
import { signedPhotoUrl, uploadHeroPhoto } from '../services/photoStorage'
import { countdownLabel, daysTogether, formatDate, getNextAnniversary } from '../utils/date'

export default function HomePage({ data, settings = siteConfig, onNavigate, onHeroPhotoUploaded, pageEditing = false, onSettingsTextChange }) {
  const togetherDays = daysTogether(settings.couple.relationshipStart)
  const nextAnniversary = getNextAnniversary(data.anniversaries)
  const pageText = settings.pages.home
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
          <p className="eyebrow"><Sparkles size={15} /> <InlineEditableText value={pageText.eyebrow} editing={pageEditing} onChange={(value) => onSettingsTextChange(['pages', 'home', 'eyebrow'], value)} ariaLabel="首页英文小标题" /></p>
          <InlineEditableText as="h1" value={settings.siteName} editing={pageEditing} onChange={(value) => onSettingsTextChange(['siteName'], value)} ariaLabel="网站名称" />
          <InlineEditableText as="p" className="hero-subtitle" value={settings.siteSubtitle} editing={pageEditing} onChange={(value) => onSettingsTextChange(['siteSubtitle'], value)} ariaLabel="首页副标题" />

          <div className="couple-row" aria-label="情侣信息">
            <div className="person-card">
              <img src={personOneAvatar} alt={`${settings.couple.personOne.name}的头像`} />
              <InlineEditableText value={settings.couple.personOne.name} editing={pageEditing} onChange={(value) => onSettingsTextChange(['couple', 'personOne', 'name'], value)} ariaLabel="第一个人的名字" />
            </div>
            <span className="beating-heart" aria-label="相爱"><Heart size={25} fill="currentColor" /></span>
            <div className="person-card">
              <img src={personTwoAvatar} alt={`${settings.couple.personTwo.name}的头像`} />
              <InlineEditableText value={settings.couple.personTwo.name} editing={pageEditing} onChange={(value) => onSettingsTextChange(['couple', 'personTwo', 'name'], value)} ariaLabel="第二个人的名字" />
            </div>
          </div>

          <p className="start-date">从 {formatDate(settings.couple.relationshipStart)} 开始</p>
        </div>

        <div className="hero-photo-area">
          <figure className="hero-polaroid">
            <span className="photo-sticker" aria-hidden="true">LOVE</span>
            <img src={heroPhoto} alt={settings.home.photoCaption} />
            <figcaption><InlineEditableText value={settings.home.photoCaption} editing={pageEditing} onChange={(value) => onSettingsTextChange(['home', 'photoCaption'], value)} ariaLabel="合照说明" /> ♡</figcaption>
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
            <InlineEditableText as="p" value={pageText.togetherLabel} editing={pageEditing} onChange={(value) => onSettingsTextChange(['pages', 'home', 'togetherLabel'], value)} ariaLabel="恋爱天数说明" />
            <strong>{togetherDays}<small> 天</small></strong>
          </div>
        </article>
        <article className="stat-card stat-card--cream">
          <span className="stat-icon"><CalendarHeart size={24} /></span>
          <div>
            <p><InlineEditableText value={pageText.nextAnniversaryLabel} editing={pageEditing} onChange={(value) => onSettingsTextChange(['pages', 'home', 'nextAnniversaryLabel'], value)} ariaLabel="纪念日倒计时说明" /> · {nextAnniversary?.title ?? '等待添加'}</p>
            <strong>{nextAnniversary ? countdownLabel(nextAnniversary.days) : '去添加一个吧'}</strong>
          </div>
        </article>
      </section>

      <section className="quote-card">
        <span className="quote-mark">“</span>
        <InlineEditableText as="p" value={settings.home.quote} editing={pageEditing} onChange={(value) => onSettingsTextChange(['home', 'quote'], value)} ariaLabel="首页情侣文案" />
        <span className="quote-line" aria-hidden="true" />
      </section>

      <section className="quick-section">
        <div className="section-heading">
          <div>
            <InlineEditableText as="p" className="eyebrow" value={pageText.quickEyebrow} editing={pageEditing} onChange={(value) => onSettingsTextChange(['pages', 'home', 'quickEyebrow'], value)} ariaLabel="快捷入口英文标题" />
            <InlineEditableText as="h2" value={pageText.quickTitle} editing={pageEditing} onChange={(value) => onSettingsTextChange(['pages', 'home', 'quickTitle'], value)} ariaLabel="快捷入口标题" />
          </div>
          <InlineEditableText className="handwritten-note" value={pageText.quickNote} editing={pageEditing} onChange={(value) => onSettingsTextChange(['pages', 'home', 'quickNote'], value)} ariaLabel="快捷入口小纸条" />
        </div>
        <div className="quick-grid">
          <button type="button" onClick={() => { if (!pageEditing) onNavigate('daily') }}>
            <span className="quick-icon"><NotebookPen size={22} /></span>
            <span><InlineEditableText as="strong" value={pageText.dailyTitle} editing={pageEditing} onChange={(value) => onSettingsTextChange(['pages', 'home', 'dailyTitle'], value)} ariaLabel="日常入口标题" /><InlineEditableText as="small" value={pageText.dailyDescription} editing={pageEditing} onChange={(value) => onSettingsTextChange(['pages', 'home', 'dailyDescription'], value)} ariaLabel="日常入口说明" /></span>
          </button>
          <button type="button" onClick={() => { if (!pageEditing) onNavigate('anniversaries') }}>
            <span className="quick-icon"><CalendarHeart size={22} /></span>
            <span><InlineEditableText as="strong" value={pageText.anniversaryTitle} editing={pageEditing} onChange={(value) => onSettingsTextChange(['pages', 'home', 'anniversaryTitle'], value)} ariaLabel="纪念日入口标题" /><InlineEditableText as="small" value={pageText.anniversaryDescription} editing={pageEditing} onChange={(value) => onSettingsTextChange(['pages', 'home', 'anniversaryDescription'], value)} ariaLabel="纪念日入口说明" /></span>
          </button>
          <button type="button" onClick={() => { if (!pageEditing) onNavigate('wishes') }}>
            <span className="quick-icon"><ListChecks size={22} /></span>
            <span><InlineEditableText as="strong" value={pageText.wishTitle} editing={pageEditing} onChange={(value) => onSettingsTextChange(['pages', 'home', 'wishTitle'], value)} ariaLabel="心愿入口标题" /><InlineEditableText as="small" value={pageText.wishDescription} editing={pageEditing} onChange={(value) => onSettingsTextChange(['pages', 'home', 'wishDescription'], value)} ariaLabel="心愿入口说明" /></span>
          </button>
        </div>
      </section>
    </div>
  )
}
