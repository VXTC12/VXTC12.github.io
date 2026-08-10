import { useState } from 'react'
import { Calendar, Edit3, Image, LoaderCircle, Plus, Smile, Trash2 } from 'lucide-react'
import CloudPhoto from '../components/CloudPhoto'
import ContentPhotoField from '../components/ContentPhotoField'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import { siteConfig } from '../data/siteConfig'
import { removePhoto, uploadContentPhoto } from '../services/photoStorage'
import { formatDate, todayInputValue } from '../utils/date'
import { createId } from '../utils/id'

const moods = ['甜甜的', '开心', '安心', '想念', '小惊喜', '平静', '有点累']
function DailyForm({ item, onSave, onClose }) {
  const [form, setForm] = useState(item ?? {
    date: todayInputValue(),
    mood: '开心',
    description: '',
    image: '/images/daily-sunset.png',
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    let uploadedPath = ''
    try {
      if (photoFile) uploadedPath = (await uploadContentPhoto(photoFile, 'daily')).path
      onSave({
        ...form,
        id: item?.id ?? createId('daily'),
        imagePath: uploadedPath || form.imagePath,
      })
      if (uploadedPath && item?.imagePath && item.imagePath !== uploadedPath) {
        removePhoto(item.imagePath).catch(() => undefined)
      }
      onClose()
    } catch (submitError) {
      if (uploadedPath) removePhoto(uploadedPath).catch(() => undefined)
      setError(submitError.message || '照片上传失败，请稍后再试。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="entry-form" onSubmit={submit}>
      <label>日期<input required type="date" name="date" value={form.date} onChange={update} /></label>
      <label>今天的心情<select name="mood" value={form.mood} onChange={update}>
        {moods.map((mood) => <option key={mood}>{mood}</option>)}
      </select></label>
      <label className="full-field">今天发生了什么<textarea required name="description" value={form.description} onChange={update} rows="5" placeholder="哪怕只是一顿好吃的晚饭，也值得记录……" /></label>
      <ContentPhotoField currentPath={form.imagePath} currentImage={form.image} selectedFile={photoFile} onSelect={setPhotoFile} onError={setError} />
      {error && <p className="form-error full-field" role="alert">{error}</p>}
      <div className="form-actions full-field">
        <button type="button" className="button secondary" onClick={onClose} disabled={saving}>取消</button>
        <button type="submit" className="button primary" disabled={saving}>{saving ? <><LoaderCircle className="spin" size={17} /> 正在保存</> : '保存日常'}</button>
      </div>
    </form>
  )
}

export default function DailyPage({ items, addItem, updateItem, deleteItem, pageText = siteConfig.pages.daily, pageEditing = false, onPageTextChange }) {
  const [filterDate, setFilterDate] = useState('')
  const [editing, setEditing] = useState(undefined)
  const [modalOpen, setModalOpen] = useState(false)
  const visibleItems = [...items]
    .filter((item) => !filterDate || item.date === filterDate)
    .sort((a, b) => b.date.localeCompare(a.date))

  const openNew = () => { setEditing(undefined); setModalOpen(true) }
  const openEdit = (item) => { setEditing(item); setModalOpen(true) }

  return (
    <div className="page-container">
      <PageHeader
        eyebrow={pageText.eyebrow}
        title={pageText.title}
        description={pageText.description}
        editing={pageEditing}
        onTextChange={onPageTextChange}
        action={<button type="button" className="button primary" onClick={openNew}><Plus size={18} /> 写下今天</button>}
      />

      <div className="filter-bar">
        <label><Calendar size={17} /> 按日期查看<input type="date" value={filterDate} onChange={(event) => setFilterDate(event.target.value)} /></label>
        {filterDate && <button type="button" className="text-button" onClick={() => setFilterDate('')}>查看全部</button>}
      </div>

      {visibleItems.length === 0 ? (
        <EmptyState title={pageText.emptyTitle} description={pageText.emptyDescription} editing={pageEditing} onTextChange={onPageTextChange} />
      ) : (
        <section className="daily-grid">
          {visibleItems.map((item, index) => (
            <article className={`daily-card rotation-${index % 3}`} key={item.id}>
              <div className="daily-card-top">
                <span className="mood-tag"><Smile size={15} /> {item.mood}</span>
                <span className="daily-date">{formatDate(item.date)}</span>
              </div>
              {item.imagePath || item.image ? <CloudPhoto path={item.imagePath} fallback={item.image} alt="日常记录配图" /> : <div className="no-photo"><Image size={26} /><span>这一天没有拍照</span></div>}
              <p>{item.description}</p>
              <div className="card-actions">
                <button type="button" onClick={() => openEdit(item)}><Edit3 size={16} /> 编辑</button>
                <button type="button" className="danger-link" onClick={() => {
                  if (window.confirm('确定删除这条日常吗？')) {
                    deleteItem('daily', item.id)
                    if (item.imagePath) removePhoto(item.imagePath).catch(() => undefined)
                  }
                }}><Trash2 size={16} /> 删除</button>
              </div>
            </article>
          ))}
        </section>
      )}

      {modalOpen && (
        <Modal title={editing ? '编辑日常' : '写下今天'} onClose={() => setModalOpen(false)}>
          <DailyForm
            item={editing}
            onClose={() => setModalOpen(false)}
            onSave={(item) => editing ? updateItem('daily', item) : addItem('daily', item)}
          />
        </Modal>
      )}
    </div>
  )
}
