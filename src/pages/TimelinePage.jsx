import { useState } from 'react'
import { CalendarDays, Edit3, Plus, Trash2 } from 'lucide-react'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import { formatDate, todayInputValue } from '../utils/date'
import { createId } from '../utils/id'

const photoOptions = [
  ['/images/first-meeting.png', '咖啡店'],
  ['/images/confession.png', '告白时刻'],
  ['/images/trip.png', '一起旅行'],
  ['/images/birthday.png', '生日庆祝'],
  ['/images/gallery-sea.png', '海边'],
]

function TimelineForm({ item, onSave, onClose }) {
  const [form, setForm] = useState(item ?? {
    date: todayInputValue(),
    title: '',
    description: '',
    image: '/images/first-meeting.png',
  })

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const submit = (event) => {
    event.preventDefault()
    onSave({ ...form, id: item?.id ?? createId('timeline') })
    onClose()
  }

  return (
    <form className="entry-form" onSubmit={submit}>
      <label>日期<input required type="date" name="date" value={form.date} onChange={update} /></label>
      <label>标题<input required name="title" value={form.title} onChange={update} placeholder="例如：第一次一起看海" /></label>
      <label className="full-field">想说的话<textarea required name="description" value={form.description} onChange={update} rows="4" placeholder="写下那天值得记住的细节……" /></label>
      <label className="full-field">示例照片<select name="image" value={form.image} onChange={update}>
        {photoOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <div className="form-actions full-field">
        <button type="button" className="button secondary" onClick={onClose}>取消</button>
        <button type="submit" className="button primary">保存这段回忆</button>
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
  const remove = (id) => {
    if (window.confirm('确定删除这段回忆吗？')) deleteItem('timeline', id)
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
              <img src={item.image} alt={item.title} />
              <span>{formatDate(item.date)}</span>
            </div>
            <div className="timeline-content">
              <p className="entry-date"><CalendarDays size={16} /> {formatDate(item.date)}</p>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              <div className="card-actions">
                <button type="button" onClick={() => openEdit(item)}><Edit3 size={16} /> 编辑</button>
                <button type="button" className="danger-link" onClick={() => remove(item.id)}><Trash2 size={16} /> 删除</button>
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
