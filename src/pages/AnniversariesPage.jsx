import { useState } from 'react'
import { CalendarHeart, Edit3, Plus, RefreshCw, Trash2 } from 'lucide-react'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import { countdownLabel, daysUntil, formatDate, nextOccurrence, todayInputValue } from '../utils/date'
import { createId } from '../utils/id'

function AnniversaryForm({ item, onSave, onClose }) {
  const [form, setForm] = useState(item ?? {
    title: '',
    date: todayInputValue(),
    repeatYearly: true,
    note: '',
  })
  const update = (event) => setForm({
    ...form,
    [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value,
  })
  const submit = (event) => {
    event.preventDefault()
    onSave({ ...form, id: item?.id ?? createId('anniversary') })
    onClose()
  }

  return (
    <form className="entry-form" onSubmit={submit}>
      <label>纪念日名称<input required name="title" value={form.title} onChange={update} placeholder="例如：第一次牵手" /></label>
      <label>日期<input required type="date" name="date" value={form.date} onChange={update} /></label>
      <label className="check-field full-field"><input type="checkbox" name="repeatYearly" checked={form.repeatYearly} onChange={update} /><span>每年重复（生日、周年等建议勾选）</span></label>
      <label className="full-field">提醒小纸条<textarea name="note" value={form.note} onChange={update} rows="4" placeholder="例如：提前订餐厅，准备一束花……" /></label>
      <div className="form-actions full-field">
        <button type="button" className="button secondary" onClick={onClose}>取消</button>
        <button type="submit" className="button primary">保存纪念日</button>
      </div>
    </form>
  )
}

export default function AnniversariesPage({ items, addItem, updateItem, deleteItem }) {
  const [editing, setEditing] = useState(undefined)
  const [modalOpen, setModalOpen] = useState(false)
  const decorated = items
    .map((item) => ({
      ...item,
      days: daysUntil(item.date, item.repeatYearly),
      next: nextOccurrence(item.date, item.repeatYearly),
    }))
    .sort((a, b) => (a.days ?? Infinity) - (b.days ?? Infinity))

  const openNew = () => { setEditing(undefined); setModalOpen(true) }
  const openEdit = (item) => { setEditing(item); setModalOpen(true) }

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="SPECIAL DAYS"
        title="纪念日"
        description="重要的日子不用死记，它们会在这里温柔地提醒你。"
        action={<button type="button" className="button primary" onClick={openNew}><Plus size={18} /> 添加纪念日</button>}
      />

      <section className="anniversary-grid">
        {decorated.map((item, index) => (
          <article className={`anniversary-card color-${index % 3}`} key={item.id}>
            <div className="calendar-sheet">
              <span>{item.next?.toLocaleDateString('zh-CN', { month: 'long' })}</span>
              <strong>{item.next?.getDate()}</strong>
            </div>
            <div className="anniversary-content">
              <div className="anniversary-heading">
                <h2>{item.title}</h2>
                {item.repeatYearly && <span className="repeat-tag"><RefreshCw size={13} /> 每年</span>}
              </div>
              <p className="original-date">最初的日子：{formatDate(item.date)}</p>
              <strong className="countdown-big">{countdownLabel(item.days)}</strong>
              {item.note && <p className="anniversary-note">{item.note}</p>}
              <div className="card-actions">
                <button type="button" onClick={() => openEdit(item)}><Edit3 size={16} /> 编辑</button>
                <button type="button" className="danger-link" onClick={() => {
                  if (window.confirm('确定删除这个纪念日吗？')) deleteItem('anniversaries', item.id)
                }}><Trash2 size={16} /> 删除</button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <div className="anniversary-tip"><CalendarHeart size={21} /> 每年重复的日期会自动计算下一次到来的时间。</div>

      {modalOpen && (
        <Modal title={editing ? '编辑纪念日' : '添加纪念日'} onClose={() => setModalOpen(false)}>
          <AnniversaryForm
            item={editing}
            onClose={() => setModalOpen(false)}
            onSave={(item) => editing ? updateItem('anniversaries', item) : addItem('anniversaries', item)}
          />
        </Modal>
      )}
    </div>
  )
}
