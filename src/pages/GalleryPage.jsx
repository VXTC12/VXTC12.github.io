import { useMemo, useState } from 'react'
import { Camera, Edit3, Heart, LoaderCircle, Plus, Trash2, X } from 'lucide-react'
import CloudPhoto from '../components/CloudPhoto'
import ContentPhotoField from '../components/ContentPhotoField'
import InlineEditableText from '../components/InlineEditableText'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import { siteConfig } from '../data/siteConfig'
import { removePhoto, uploadContentPhoto } from '../services/photoStorage'
import { createId } from '../utils/id'

function GalleryForm({ item, onSave, onClose }) {
  const [form, setForm] = useState(item ?? {
    year: String(new Date().getFullYear()),
    category: '日常',
    title: '',
    story: '',
    image: '',
    imagePath: '',
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const submit = async (event) => {
    event.preventDefault()
    if (!photoFile && !form.imagePath && !form.image) {
      setError('请先选择一张照片。')
      return
    }

    setSaving(true)
    setError('')
    let uploadedPath = ''

    try {
      if (photoFile) uploadedPath = (await uploadContentPhoto(photoFile, 'gallery')).path
      onSave({
        ...form,
        year: String(form.year),
        id: item?.id ?? createId('photo'),
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
      <label>照片标题<input required name="title" value={form.title} onChange={update} placeholder="例如：海边的傍晚" /></label>
      <label>年份<input required type="number" min="1900" max="2200" name="year" value={form.year} onChange={update} /></label>
      <label className="full-field">分类<input required name="category" value={form.category} onChange={update} placeholder="例如：旅行、日常、生日" /></label>
      <label className="full-field">照片背后的故事<textarea required name="story" value={form.story} onChange={update} rows="5" placeholder="写下拍这张照片时发生的故事……" /></label>
      <ContentPhotoField currentPath={form.imagePath} currentImage={form.image} selectedFile={photoFile} onSelect={setPhotoFile} onError={setError} />
      {error && <p className="form-error full-field" role="alert">{error}</p>}
      <div className="form-actions full-field">
        <button type="button" className="button secondary" onClick={onClose} disabled={saving}>取消</button>
        <button type="submit" className="button primary" disabled={saving}>{saving ? <><LoaderCircle className="spin" size={17} /> 正在保存</> : '保存到相册'}</button>
      </div>
    </form>
  )
}

export default function GalleryPage({ items, addItem, updateItem, deleteItem, pageText = siteConfig.pages.gallery, pageEditing = false, onPageTextChange }) {
  const [category, setCategory] = useState('全部')
  const [year, setYear] = useState('全部年份')
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(undefined)
  const [modalOpen, setModalOpen] = useState(false)
  const categories = ['全部', ...new Set(items.map((item) => item.category))]
  const years = useMemo(() => ['全部年份', ...new Set(items.map((item) => String(item.year)).sort().reverse())], [items])
  const visibleItems = items.filter((item) =>
    (category === '全部' || item.category === category) &&
    (year === '全部年份' || String(item.year) === year),
  )

  const openNew = () => { setEditing(undefined); setSelected(null); setModalOpen(true) }
  const openEdit = (item) => { setEditing(item); setSelected(null); setModalOpen(true) }
  const remove = (item) => {
    if (window.confirm(`确定删除“${item.title}”这张照片吗？`)) {
      deleteItem('gallery', item.id)
      if (item.imagePath) removePhoto(item.imagePath).catch(() => undefined)
      if (selected?.id === item.id) setSelected(null)
    }
  }

  return (
    <div className="page-container">
      <PageHeader
        eyebrow={pageText.eyebrow}
        title={pageText.title}
        description={pageText.description}
        editing={pageEditing}
        onTextChange={onPageTextChange}
        action={<button type="button" className="button primary" onClick={openNew}><Plus size={18} /> 添加照片</button>}
      />

      <div className="gallery-filters">
        <div className="chip-group" aria-label="相册主题筛选">
          {categories.map((item) => (
            <button type="button" key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>
          ))}
        </div>
        <label className="year-filter">年份<select value={year} onChange={(event) => setYear(event.target.value)}>
          {years.map((item) => <option key={item}>{item}</option>)}
        </select></label>
      </div>

      <section className="photo-wall">
        {visibleItems.map((item, index) => (
          <article className={`gallery-polaroid photo-tilt-${index % 4}`} key={item.id}>
            <button type="button" className="gallery-open" onClick={() => setSelected(item)} aria-label={`查看照片：${item.title}`}>
              <span className="photo-corner" aria-hidden="true"><Heart size={16} fill="currentColor" /></span>
              <CloudPhoto path={item.imagePath} fallback={item.image} alt={item.title} />
              <span className="gallery-caption">
                <strong>{item.title}</strong>
                <small>{item.year} · {item.category}</small>
              </span>
            </button>
            <div className="card-actions gallery-actions">
              <button type="button" onClick={() => openEdit(item)}><Edit3 size={15} /> 编辑</button>
              <button type="button" className="danger-link" onClick={() => remove(item)}><Trash2 size={15} /> 删除</button>
            </div>
          </article>
        ))}
      </section>

      {visibleItems.length === 0 && (
        <div className="empty-state"><Camera size={30} /><InlineEditableText as="h3" value={pageText.emptyTitle} editing={pageEditing} onChange={(value) => onPageTextChange('emptyTitle', value)} ariaLabel="相册空状态标题" /><InlineEditableText as="p" value={pageText.emptyDescription} editing={pageEditing} onChange={(value) => onPageTextChange('emptyDescription', value)} ariaLabel="相册空状态说明" /></div>
      )}

      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)} wide>
          <div className="photo-story">
            <CloudPhoto path={selected.imagePath} fallback={selected.image} alt={selected.title} />
            <div>
              <p className="eyebrow">{selected.year} · {selected.category}</p>
              <InlineEditableText as="h3" value={pageText.storyTitle} editing={pageEditing} onChange={(value) => onPageTextChange('storyTitle', value)} ariaLabel="照片故事标题" />
              <p>{selected.story}</p>
              <div className="photo-story-actions">
                <button type="button" className="button secondary" onClick={() => openEdit(selected)}><Edit3 size={17} /> 编辑照片</button>
                <button type="button" className="button secondary" onClick={() => setSelected(null)}><X size={17} /> 收好照片</button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {modalOpen && (
        <Modal title={editing ? '编辑相册照片' : '添加相册照片'} onClose={() => setModalOpen(false)}>
          <GalleryForm
            item={editing}
            onClose={() => setModalOpen(false)}
            onSave={(item) => editing ? updateItem('gallery', item) : addItem('gallery', item)}
          />
        </Modal>
      )}
    </div>
  )
}
