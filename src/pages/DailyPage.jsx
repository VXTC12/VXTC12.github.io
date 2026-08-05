import { useState } from 'react'
import { Calendar, Edit3, Image, Plus, Smile, Trash2 } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import { formatDate, todayInputValue } from '../utils/date'
import { createId } from '../utils/id'

const moods = ['甜甜的', '开心', '安心', '想念', '小惊喜', '平静', '有点累']
const photos = [
  ['/images/daily-sunset.png', '粉色晚霞'],
  ['/images/daily-rain.png', '雨天宅家'],
  ['/images/gallery-cooking.png', '一起做饭'],
  ['/images/gallery-walk.png', '散步日常'],
  ['', '不放照片'],
]

function DailyForm({ item, onSave, onClose }) {
  const [form, setForm] = useState(item ?? {
    date: todayInputValue(),
    mood: '开心',
    description: '',
    image: '/images/daily-sunset.png',
  })
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const submit = (event) => {
    event.preventDefault()
    onSave({ ...form, id: item?.id ?? createId('daily') })
    onClose()
  }

  return (
    <form className="entry-form" onSubmit={submit}>
      <label>日期<input required type="date" name="date" value={form.date} onChange={update} /></label>
      <label>今天的心情<select name="mood" value={form.mood} onChange={update}>
        {moods.map((mood) => <option key={mood}>{mood}</option>)}
      </select></label>
      <label className="full-field">今天发生了什么<textarea required name="description" value={form.description} onChange={update} rows="5" placeholder="哪怕只是一顿好吃的晚饭，也值得记录……" /></label>
      <label className="full-field">搭配一张照片<select name="image" value={form.image} onChange={update}>
        {photos.map(([value, label]) => <option key={label} value={value}>{label}</option>)}
      </select></label>
      <div className="form-actions full-field">
        <button type="button" className="button secondary" onClick={onClose}>取消</button>
        <button type="submit" className="button primary">保存日常</button>
      </div>
    </form>
  )
}

export default function DailyPage({ items, addItem, updateItem, deleteItem }) {
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
        eyebrow="EVERYDAY NOTES"
        title="日常记录"
        description="普通日子里的小事，回头看也会闪闪发光。"
        action={<button type="button" className="button primary" onClick={openNew}><Plus size={18} /> 写下今天</button>}
      />

      <div className="filter-bar">
        <label><Calendar size={17} /> 按日期查看<input type="date" value={filterDate} onChange={(event) => setFilterDate(event.target.value)} /></label>
        {filterDate && <button type="button" className="text-button" onClick={() => setFilterDate('')}>查看全部</button>}
      </div>

      {visibleItems.length === 0 ? (
        <EmptyState title="这一天还没有记录" description="也许今天的一杯热饮、一次散步，就能成为以后想起时会微笑的瞬间。" />
      ) : (
        <section className="daily-grid">
          {visibleItems.map((item, index) => (
            <article className={`daily-card rotation-${index % 3}`} key={item.id}>
              <div className="daily-card-top">
                <span className="mood-tag"><Smile size={15} /> {item.mood}</span>
                <span className="daily-date">{formatDate(item.date)}</span>
              </div>
              {item.image ? <img src={item.image} alt="日常记录配图" /> : <div className="no-photo"><Image size={26} /><span>这一天没有拍照</span></div>}
              <p>{item.description}</p>
              <div className="card-actions">
                <button type="button" onClick={() => openEdit(item)}><Edit3 size={16} /> 编辑</button>
                <button type="button" className="danger-link" onClick={() => {
                  if (window.confirm('确定删除这条日常吗？')) deleteItem('daily', item.id)
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
