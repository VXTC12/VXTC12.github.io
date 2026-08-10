import { useEffect, useRef, useState } from 'react'
import { ImagePlus, LoaderCircle, Save, Settings2 } from 'lucide-react'
import Modal from './Modal'
import { removePhoto, signedPhotoUrl, uploadSiteAvatar, validatePhoto } from '../services/photoStorage'

function initialForm(settings) {
  return {
    siteName: settings.siteName,
    siteSubtitle: settings.siteSubtitle,
    personOneName: settings.couple.personOne.name,
    personTwoName: settings.couple.personTwo.name,
    relationshipStart: settings.couple.relationshipStart,
    quote: settings.home.quote,
    photoCaption: settings.home.photoCaption,
    footerText: settings.footerText,
  }
}

export default function AdminSettingsModal({ settings, onSave, onClose }) {
  const firstInput = useRef(null)
  const secondInput = useRef(null)
  const objectUrls = useRef([])
  const [form, setForm] = useState(() => initialForm(settings))
  const [files, setFiles] = useState({ personOne: null, personTwo: null })
  const [previews, setPreviews] = useState({
    personOne: settings.couple.personOne.avatar,
    personTwo: settings.couple.personTwo.avatar,
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    const urlsToRevoke = objectUrls.current
    const people = ['personOne', 'personTwo']

    people.forEach((person) => {
      const path = settings.couple[person].avatarPath
      if (!path) return
      signedPhotoUrl(path)
        .then((url) => {
          if (active && url) setPreviews((current) => ({ ...current, [person]: url }))
        })
        .catch(() => undefined)
    })

    return () => {
      active = false
      urlsToRevoke.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [settings])

  const update = (event) => setForm((current) => ({
    ...current,
    [event.target.name]: event.target.value,
  }))

  const chooseAvatar = (person, event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      validatePhoto(file)
      const preview = URL.createObjectURL(file)
      objectUrls.current.push(preview)
      setFiles((current) => ({ ...current, [person]: file }))
      setPreviews((current) => ({ ...current, [person]: preview }))
      setMessage('')
    } catch (error) {
      setMessage(error.message)
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      if (![form.siteName, form.siteSubtitle, form.personOneName, form.personTwoName, form.quote, form.photoCaption, form.footerText].every((value) => value.trim())) {
        throw new Error('文字内容不能只填写空格。')
      }
      const personOne = { ...settings.couple.personOne, name: form.personOneName.trim() }
      const personTwo = { ...settings.couple.personTwo, name: form.personTwoName.trim() }
      const oldPaths = []

      if (files.personOne) {
        const uploaded = await uploadSiteAvatar(files.personOne, 'person-one')
        if (personOne.avatarPath) oldPaths.push(personOne.avatarPath)
        personOne.avatarPath = uploaded.path
      }
      if (files.personTwo) {
        const uploaded = await uploadSiteAvatar(files.personTwo, 'person-two')
        if (personTwo.avatarPath) oldPaths.push(personTwo.avatarPath)
        personTwo.avatarPath = uploaded.path
      }

      onSave({
        ...settings,
        siteName: form.siteName.trim(),
        siteSubtitle: form.siteSubtitle.trim(),
        couple: {
          ...settings.couple,
          personOne,
          personTwo,
          relationshipStart: form.relationshipStart,
        },
        home: {
          ...settings.home,
          quote: form.quote.trim(),
          photoCaption: form.photoCaption.trim(),
        },
        footerText: form.footerText.trim(),
      })

      oldPaths.forEach((path) => removePhoto(path).catch(() => undefined))
      onClose()
    } catch (error) {
      setMessage(error?.message || '保存失败，请稍后再试。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="管理网站内容" onClose={onClose} wide>
      <form className="entry-form admin-settings-form" onSubmit={submit}>
        <section className="admin-section full-field">
          <div className="admin-section-heading"><Settings2 size={18} /><div><h3>网站与首页</h3><p>修改后会同步显示在首页、顶部和页脚。</p></div></div>
          <div className="admin-fields">
            <label>网站名称<input required maxLength="30" name="siteName" value={form.siteName} onChange={update} /></label>
            <label>首页英文副标题<input required maxLength="80" name="siteSubtitle" value={form.siteSubtitle} onChange={update} /></label>
            <label className="full-field">首页情侣文案<textarea required rows="3" name="quote" value={form.quote} onChange={update} /></label>
            <label>合照下方说明<input required maxLength="50" name="photoCaption" value={form.photoCaption} onChange={update} /></label>
            <label>页脚文字<input required maxLength="80" name="footerText" value={form.footerText} onChange={update} /></label>
          </div>
        </section>

        <section className="admin-section full-field">
          <div className="admin-section-heading"><ImagePlus size={18} /><div><h3>两个人的信息</h3><p>可修改姓名，并上传替换首页中的圆形头像。</p></div></div>
          <div className="admin-fields">
            <label>第一个人的姓名<input required maxLength="12" name="personOneName" value={form.personOneName} onChange={update} /></label>
            <label>第二个人的姓名<input required maxLength="12" name="personTwoName" value={form.personTwoName} onChange={update} /></label>
          </div>
          <div className="admin-avatar-grid">
            <div className="admin-avatar-card">
              <img src={previews.personOne} alt="第一个人的头像预览" />
              <div><strong>{form.personOneName || '第一个人'}</strong><button type="button" className="button secondary small" onClick={() => firstInput.current?.click()}><ImagePlus size={16} /> 选择新头像</button>{files.personOne && <small>{files.personOne.name}</small>}</div>
              <input ref={firstInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => chooseAvatar('personOne', event)} />
            </div>
            <div className="admin-avatar-card">
              <img src={previews.personTwo} alt="第二个人的头像预览" />
              <div><strong>{form.personTwoName || '第二个人'}</strong><button type="button" className="button secondary small" onClick={() => secondInput.current?.click()}><ImagePlus size={16} /> 选择新头像</button>{files.personTwo && <small>{files.personTwo.name}</small>}</div>
              <input ref={secondInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => chooseAvatar('personTwo', event)} />
            </div>
          </div>
        </section>

        <section className="admin-section full-field">
          <div className="admin-section-heading"><Settings2 size={18} /><div><h3>恋爱开始日期</h3><p>保存后会同时更新首页天数和“恋爱纪念日”，两处不再分开计算。</p></div></div>
          <div className="admin-fields admin-fields--date">
            <label>我们开始的日期<input required type="date" name="relationshipStart" value={form.relationshipStart} onChange={update} /></label>
          </div>
        </section>

        <p className="admin-helper full-field">首页代表性合照仍可直接点击“更换我们的合照”上传。日常、时间轴、心愿和纪念日内容可在对应页面新增或编辑。</p>
        {message && <p className="form-message form-message--error full-field" role="alert">{message}</p>}
        <div className="form-actions full-field">
          <button type="button" className="button secondary" onClick={onClose} disabled={saving}>取消</button>
          <button type="submit" className="button primary" disabled={saving}>{saving ? <><LoaderCircle className="spin" size={18} /> 正在保存</> : <><Save size={18} /> 保存全部修改</>}</button>
        </div>
      </form>
    </Modal>
  )
}
