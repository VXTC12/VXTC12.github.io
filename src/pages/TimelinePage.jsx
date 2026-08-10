import { useState } from 'react'
import { CalendarDays, Edit3, LoaderCircle, Plus, Trash2 } from 'lucide-react'
import CloudPhoto from '../components/CloudPhoto'
import ContentPhotoField from '../components/ContentPhotoField'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import { removePhoto, uploadContentPhoto } from '../services/photoStorage'
import { formatDate, todayInputValue } from '../utils/date'
import { createId } from '../utils/id'

function TimelineForm({ item, onSave, onClose }) {
  const [form, setForm] = useState(item ?? {
    date: todayInputValue(),
    title: '',
    description: '',
    image: '/images/first-meeting.png',
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
      if (photoFile) uploadedPath = (await uploadContentPhoto(photoFile, 'timeline')).path
      onSave({
        ...form,
        id: item?.id ?? createId('timeline'),
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
      <label>标题<input required name="title" value={form.title} onChange={update} placeholder="例如：第一次一起看海" /></label>
      <label className="full-field">想说的话<textarea required name="description" value={form.description} onChange={update} rows="4" placeholder="写下那天值得记住的细节……" /></label>
      <ContentPhotoField currentPath={form.imagePath} currentImage={form.image} selectedFile={photoFile} onSelect={setPhotoFile} onError={setError} />
      {error && <p className="form-error full-field" role="alert">{error}</p>}
      <div className="form-actions full-field">
        <button type="button" className="button secondary" onClick={onClose} disabled={saving}>取消</button>
        <button type="submit" className="button primary" disabled={saving}>{saving ? <><LoaderCircle className="spin" size={17} /> 正在保存</> : '保存这段回忆'}</button>
      </div>
    </form>
  )
}

export default function TimelinePage({ items, addItem, updateItem, deleteItem }) {
  const [editing, setEditing] = useState(undefined)
  const [modalOpen, setModalOpen] = useState(false)
  const sortedItems = [...items].sort((a, b) => a.date.localeCompare(b.date))

  const openNew = () => { setEditing(undefined); setModalOpen(true) }
  const openEdit = (item) => { setEditing(item); setModalOpen(true) }
  const remove = (item) => {
    if (window.confirm('确定删除这段回忆吗？')) {
      deleteItem('timeline', item.id)
      if (item.imagePath) removePhoto(item.imagePath).catch(() => undefined)
    }
  }

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="OUR STORY"
        title="时光轴"
        description="从第一次心动开始，把重要瞬间一页一页收好。"
        action={<button type="button" className="button primary" onClick={openNew}><Plus size={18} /> 新增事件</button>}
      />

      <section className="timeline-list">
        {sortedItems.map((item, index) => (
          <article className="timeline-entry" key={item.id}>
            <div className="timeline-marker"><span>{index + 1}</span></div>
            <div className="timeline-photo polaroid">
              <CloudPhoto path={item.imagePath} fallback={item.image} alt={item.title} />
              <span>{formatDate(item.date)}</span>
            </div>
            <div className="timeline-content">
              <p className="entry-date"><CalendarDays size={16} /> {formatDate(item.date)}</p>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              <div className="card-actions">
                <button type="button" onClick={() => openEdit(item)}><Edit3 size={16} /> 编辑</button>
                <button type="button" className="danger-link" onClick={() => remove(item)}><Trash2 size={16} /> 删除</button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {modalOpen && (
        <Modal title={editing ? '编辑时光事件' : '新增时光事件'} onClose={() => setModalOpen(false)}>
          <TimelineForm
            item={editing}
            onClose={() => setModalOpen(false)}
            onSave={(item) => editing ? updateItem('timeline', item) : addItem('timeline', item)}
          />
        </Modal>
      )}
    </div>
  )
}
